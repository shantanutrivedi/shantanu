import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are an expert program manager creating executive summaries for leadership.
Given a week's worth of action items and daily activities, produce a clear, concise weekly executive summary.

Structure your response as a JSON object with these keys:
- headline: one-sentence project health summary (string)
- health: "On Track", "At Risk", or "Behind"
- overview: 2-3 sentence paragraph summary of the week (string)
- stats: object with counts: { total, done, inProgress, blocked, bugs, features, configs, risks }
- highlights: array of 3-5 key accomplishments (strings)
- blockers: array of current blockers with owner (objects: { issue, owner, impact })
- nextWeek: array of top 3-5 priorities for next week (strings)
- goLiveStatus: brief statement on go-live timeline (string)
- recommendation: one concrete recommendation for leadership (string)

Return ONLY valid JSON. No markdown fences, no explanation.`;

export async function POST(req: NextRequest) {
  const { projectName, goLiveDate, actionItems, activities, weekRange } = await req.json();

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const dataPayload = JSON.stringify({
          project: projectName,
          goLiveDate,
          weekRange,
          actionItems,
          activities,
        }, null, 2);

        const response = await client.messages.create({
          model: 'claude-opus-4-7',
          max_tokens: 2048,
          thinking: { type: 'adaptive' },
          system: SYSTEM_PROMPT,
          messages: [
            {
              role: 'user',
              content: `Generate a weekly executive summary for this project data:\n\n${dataPayload}`,
            },
          ],
        });

        const textBlock = response.content.find(b => b.type === 'text');
        if (!textBlock || textBlock.type !== 'text') {
          throw new Error('No text in response');
        }

        let parsed;
        try {
          parsed = JSON.parse(textBlock.text.trim());
        } catch {
          const match = textBlock.text.match(/\{[\s\S]*\}/);
          if (match) {
            parsed = JSON.parse(match[0]);
          } else {
            throw new Error('Could not parse response');
          }
        }

        controller.enqueue(encoder.encode(JSON.stringify({ success: true, summary: parsed })));
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
