import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';
import type { RiskScanResult } from '@/lib/types';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Cached — same system prompt across all daily calls
const SYSTEM_PROMPT = `You are a senior program manager assistant. You receive structured risk data and write a concise daily briefing.

Rules:
- Write exactly 3 bullets. Each bullet must name the specific item, person, or product — no generic statements.
- Be direct. No hedging, no "it may be worth considering".
- Write one short recommendation sentence at the end.
- Return ONLY valid JSON: { "headline": string, "bullets": [string, string, string], "recommendation": string }`;

export async function POST(req: NextRequest) {
  const { risks, projectId }: { risks: RiskScanResult; projectId: string } = await req.json();

  const totalIssues = risks.slipping.length + risks.noEta.length + risks.blocked.length;

  // If no real risks, return a clean bill of health without calling Claude
  if (totalIssues === 0) {
    return Response.json({
      headline: 'No risks detected today',
      bullets: [
        'All tracked items have ETAs set',
        'No overdue items found',
        'No blocked items',
      ],
      recommendation: 'Keep up the good work.',
    });
  }

  const riskSummary = JSON.stringify(risks, null, 2);

  const response = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 512,
    system: [
      {
        type: 'text',
        text: SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: `Project: ${projectId}\nToday: ${new Date().toISOString().split('T')[0]}\n\nRisk data:\n${riskSummary}`,
      },
    ],
  });

  const textBlock = response.content.find(b => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    return Response.json({ error: 'No response from Claude' }, { status: 500 });
  }

  try {
    const parsed = JSON.parse(textBlock.text.trim());
    return Response.json(parsed);
  } catch {
    const match = textBlock.text.match(/\{[\s\S]*\}/);
    if (match) return Response.json(JSON.parse(match[0]));
    return Response.json({ error: 'Could not parse Claude response' }, { status: 500 });
  }
}
