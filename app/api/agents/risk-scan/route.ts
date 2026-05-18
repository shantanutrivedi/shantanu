import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { computeRisks } from '@/lib/agentUtils';
import { upsertRiskCard } from '@/lib/supabase';
import type { ActionItem } from '@/lib/types';

// Triggered by Vercel Cron (8am daily) or manually via POST with { items, projectId }
export async function POST(req: NextRequest) {
  // Cron calls are unauthenticated — accept a shared secret header
  const cronSecret = req.headers.get('x-cron-secret');
  const isAuthorizedCron = cronSecret === process.env.CRON_SECRET;

  // Session-authenticated manual call
  const session = await auth();
  const userId = session?.user?.id;

  if (!isAuthorizedCron && !userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const items: ActionItem[] = body.items ?? [];
  const projectId: string = body.projectId ?? 'unknown';
  const targetUserId: string = body.userId ?? userId ?? 'unknown';

  if (items.length === 0) {
    return Response.json({ skipped: true, reason: 'no items provided' });
  }

  const today = new Date().toISOString().split('T')[0];
  const rawRisks = computeRisks(items, today);

  // Call risk-narrative to generate the Claude summary
  const narrativeRes = await fetch(new URL('/api/agents/risk-narrative', req.url).toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ risks: rawRisks, projectId }),
  });

  if (!narrativeRes.ok) {
    return Response.json({ error: 'narrative generation failed' }, { status: 500 });
  }

  const narrative = await narrativeRes.json();

  await upsertRiskCard({
    userId:    targetUserId,
    projectId,
    date:      today,
    rawRisks,
    narrative,
  });

  return Response.json({ success: true, date: today, riskScore: rawRisks.riskScore });
}
