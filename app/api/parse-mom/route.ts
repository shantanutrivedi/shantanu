import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are an expert program manager assistant. Your job is to parse minutes-of-meeting (MOM) documents and extract action items into a structured JSON format.

Extract every actionable item, decision, risk, and dependency mentioned. For each item return:
- action: clear description of what needs to be done (string)
- assignee: person responsible (string, or "TBD" if unclear)
- eta: due date in YYYY-MM-DD format (or "TBD" if not mentioned)
- product: product/project name mentioned (string, or "General" if unclear)
- priority: "High", "Medium", or "Low" based on urgency/impact cues
- type: "Feature", "Bug", "Config", "Risk", "Decision", or "Other"
- status: always "Pending" for new items
- comment: any additional context, blockers, or notes (string, can be empty)
- jiraUrl: empty string (will be filled by user)

Return ONLY a valid JSON object with a single key "items" containing an array. No markdown, no explanation.`;

export async function POST(req: NextRequest) {
  const { text, filename, model } = await req.json();

  if (!text || typeof text !== 'string') {
    return Response.json({ error: 'Missing text' }, { status: 400 });
  }

  const selectedModel = model || 'claude-haiku-4-5';
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = await client.messages.create({
          model: selectedModel,
          max_tokens: 4096,
          system: SYSTEM_PROMPT,
          messages: [
            {
              role: 'user',
              content: `Parse this meeting notes document and extract all action items.\n\nFilename: ${filename || 'meeting-notes.txt'}\n\n---\n${text}\n---`,
            },
          ],
        });

        // Find the text block
        const textBlock = response.content.find(b => b.type === 'text');
        if (!textBlock || textBlock.type !== 'text') {
          throw new Error('No text in response');
        }

        // Try to parse the JSON from the response
        let parsed;
        try {
          const jsonText = textBlock.text.trim();
          parsed = JSON.parse(jsonText);
        } catch {
          // Try to extract JSON from the text
          const match = textBlock.text.match(/\{[\s\S]*\}/);
          if (match) {
            parsed = JSON.parse(match[0]);
          } else {
            throw new Error('Could not parse JSON from response');
          }
        }

        controller.enqueue(encoder.encode(JSON.stringify({ success: true, items: parsed.items || [] })));
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        controller.enqueue(encoder.encode(JSON.stringify({ success: false, error: msg })));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'application/json' },
  });
}
