import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { findDuplicates } from '@/lib/agentUtils';
import { insertPendingItem } from '@/lib/supabase';
import type { ActionItem, NormalizedTranscript } from '@/lib/types';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Cached across all meeting parse calls — the rules are always the same
const SYSTEM_PROMPT = `You are an expert program manager assistant parsing a meeting transcript.

Extract every action item, decision, risk, and dependency mentioned. For each item return:
- action: clear description (string)
- assignee: person responsible ("TBD" if unclear)
- eta: due date YYYY-MM-DD ("TBD" if not mentioned)
- product: product/project name ("General" if unclear)
- priority: "High", "Medium", or "Low"
- type: "Feature", "Bug", "Config", "Risk", "Decision", or "Other"
- status: always "Pending"
- comment: meeting name and any context (format: "[Meeting Title] — [context]")
- jiraUrl: empty string

Return ONLY valid JSON: { "items": ActionItem[], "meetingTitle": string, "attendees": string[] }`;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const {
    transcript,
    existingItems,
    projectId,
    meetingId,
  }: {
    transcript: NormalizedTranscript;
    existingItems: ActionItem[];
    projectId: string;
    meetingId: string;
  } = await req.json();

  if (!transcript?.text) {
    return Response.json({ error: 'Missing transcript' }, { status: 400 });
  }

  const response = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 4096,
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
        content: `Meeting transcript (source: ${transcript.source}):\n\n---\n${transcript.text}\n---`,
      },
    ],
  });

  const textBlock = response.content.find(b => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    return Response.json({ error: 'No response from Claude' }, { status: 500 });
  }

  let parsed: { items: ActionItem[]; meetingTitle: string; attendees: string[] };
  try {
    const jsonText = textBlock.text.trim();
    parsed = JSON.parse(jsonText);
  } catch {
    const match = textBlock.text.match(/\{[\s\S]*\}/);
    if (!match) return Response.json({ error: 'Could not parse Claude response' }, { status: 500 });
    parsed = JSON.parse(match[0]);
  }

  // Assign IDs and projectId to incoming items
  const items: ActionItem[] = (parsed.items ?? []).map(item => ({
    ...item,
    id: crypto.randomUUID(),
    projectId,
    startDate: new Date().toISOString().split('T')[0],
  }));

  const duplicates = findDuplicates(items, existingItems);

  await insertPendingItem({
    userId:           session.user.id,
    projectId,
    meetingId,
    meetingTitle:     parsed.meetingTitle ?? transcript.meetingTitle ?? 'Meeting',
    items,
    duplicates,
    transcriptSource: transcript.source,
    status:           'pending',
  });

  return Response.json({
    success:      true,
    itemCount:    items.length,
    duplicates:   duplicates.length,
    meetingTitle: parsed.meetingTitle,
  });
}
