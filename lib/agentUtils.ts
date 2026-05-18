import type { ActionItem, DuplicateFlag, RiskScanResult } from './types';

// ── Duplicate detection ───────────────────────────────────────────────────────
// Extracted from workbench/page.tsx — shared between UI and server-side agent

const STOPWORDS = new Set([
  'a','an','the','is','in','on','at','to','for','of','and','or','with','by',
  'from','that','this','it','be','as','are','was','will','have','has','do',
  'not','we','you','i','they','their','our','your','its','into','up','out',
  'than','more','also','so','but','if','then','all','any','each','get','set',
  'need','should','must','can','please','new',
]);

function tokenize(text: string): Set<string> {
  return new Set(
    text.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !STOPWORDS.has(w))
  );
}

export function jaccardSimilarity(a: ActionItem, b: ActionItem): number {
  const ta = tokenize(a.action);
  const tb = tokenize(b.action);
  if (ta.size === 0 && tb.size === 0) return 0;
  const intersection = [...ta].filter(t => tb.has(t)).length;
  const union = new Set([...ta, ...tb]).size;
  return union === 0 ? 0 : intersection / union;
}

export const DUPLICATE_THRESHOLD = 0.4;

export function findDuplicates(
  incoming: ActionItem[],
  existing: ActionItem[],
): DuplicateFlag[] {
  const flags: DuplicateFlag[] = [];
  for (const inc of incoming) {
    for (const ex of existing) {
      const similarity = jaccardSimilarity(inc, ex);
      if (similarity >= DUPLICATE_THRESHOLD) {
        flags.push({ incomingId: inc.id, existingId: ex.id, similarity });
      }
    }
  }
  return flags;
}

// ── Risk computation ──────────────────────────────────────────────────────────
// Pure TypeScript — no AI needed. Deterministic rules over ActionItem fields.

export function computeRisks(items: ActionItem[], today: string): RiskScanResult {
  const todayMs = new Date(today).getTime();

  const slipping: RiskScanResult['slipping'] = [];
  const noEta: RiskScanResult['noEta'] = [];
  const blocked: RiskScanResult['blocked'] = [];

  for (const item of items) {
    if (item.status === 'Done') continue;

    if (item.status === 'Blocked') {
      // Estimate days blocked from startDate if available
      const startMs = item.startDate ? new Date(item.startDate).getTime() : null;
      const daysSinceBlocked = startMs
        ? Math.floor((todayMs - startMs) / 86_400_000)
        : undefined;
      blocked.push({ id: item.id, action: item.action, assignee: item.assignee, daysSinceBlocked });
    }

    if (!item.eta || item.eta === 'TBD' || item.eta === '') {
      noEta.push({ id: item.id, action: item.action, assignee: item.assignee });
      continue;
    }

    const etaMs = new Date(item.eta).getTime();
    if (!isNaN(etaMs) && etaMs < todayMs) {
      const daysOverdue = Math.floor((todayMs - etaMs) / 86_400_000);
      slipping.push({ id: item.id, action: item.action, eta: item.eta, daysOverdue });
    }
  }

  // Score 0–10: weighted sum capped at 10
  const score = Math.min(
    10,
    slipping.length * 2 + noEta.length * 0.5 + blocked.length * 1.5
  );

  return {
    slipping,
    noEta,
    blocked,
    riskScore: Math.round(score * 10) / 10,
  };
}
