'use client';
import Link from 'next/link';
import { usePalette } from '@/lib/palette';

const FEATURES = [
  { t: 'MOM → Actions', d: 'Paste meeting notes. Shantanu extracts decisions, owners, risks, and ETAs in under two seconds.', c: 'violet' as const },
  { t: 'Two-way Jira', d: 'Edit the action table. We push it to Jira. Always in sync, zero copy-paste.', c: 'cyan' as const },
  { t: 'Go-live tracking', d: 'Calendar of cutovers and milestones. Nothing slips without a flag.', c: 'coral' as const },
  { t: 'Weekly auto-digest', d: 'Leadership rollup generated from your data. No more screenshots or status calls.', c: 'lime' as const },
];

const MOM_LINES = [
  'Riya: pricing FAQ needs to land by 14th',
  'Jay: blocked on infra cap for staging',
  'Riya: report on Atlas auth dependency',
  'Devika: schedule advisory for v2 customers',
  'Akash: triage Helix risk by Friday',
];

const TABLE_ROWS = [
  { action: 'Pricing FAQ landing page', assignee: 'Riya', eta: 'Jul 14', product: 'Atlas', priority: 'High', status: 'In Progress' },
  { action: 'Resolve infra capacity', assignee: 'Jay', eta: 'Jul 12', product: 'Atlas', priority: 'High', status: 'Blocked' },
  { action: 'Auth dependency report', assignee: 'Riya', eta: 'Jul 15', product: 'Atlas', priority: 'Medium', status: 'Pending' },
  { action: 'Schedule advisory', assignee: 'Devika', eta: 'Jul 20', product: 'Helix', priority: 'Medium', status: 'Pending' },
  { action: 'Triage Helix risk', assignee: 'Akash', eta: 'Jul 12', product: 'Helix', priority: 'High', status: 'In Progress' },
];

export default function HomePage() {
  const p = usePalette();

  const STATUS_COLORS: Record<string, string> = {
    'Done': p.lime, 'In Progress': p.cyan, 'Blocked': p.coral, 'Pending': p.violet,
  };
  const PRIORITY_COLORS: Record<string, string> = { High: p.coral, Medium: p.amber, Low: p.textBody };

  const featureColor = (c: 'violet' | 'cyan' | 'coral' | 'lime') => p[c];

  const glowBg = p.glow
    ? 'radial-gradient(ellipse at 20% -10%, rgba(139,124,255,0.55), transparent 50%), radial-gradient(ellipse at 85% 15%, rgba(255,176,137,0.30), transparent 45%), radial-gradient(ellipse at 50% 40%, rgba(86,224,255,0.18), transparent 55%)'
    : 'radial-gradient(ellipse at 20% -10%, rgba(85,72,217,0.15), transparent 50%), radial-gradient(ellipse at 85% 15%, rgba(217,97,74,0.12), transparent 45%)';

  return (
    <div style={{ background: p.pageBg, color: p.textBody, position: 'relative', overflow: 'hidden' }}>

      {/* Layered glow background */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: glowBg }} />

      {/* ─── Hero ─────────────────────────────────────────────────── */}
      <section style={{ position: 'relative', padding: '72px 48px 56px', maxWidth: 1280, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 14px', borderRadius: 100,
          border: `1px solid ${p.border}`, background: p.inputBg,
          fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: p.violet,
          fontFamily: "'JetBrains Mono',monospace", marginBottom: 28 }}>
          <span style={{ width: 6, height: 6, borderRadius: 3, background: p.lime,
            boxShadow: p.glow ? `0 0 8px ${p.lime}` : 'none', display: 'inline-block' }} />
          Real-time · auto-synced
        </div>

        <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 88, lineHeight: 0.98,
          letterSpacing: '-3.6px', color: p.textPrimary, margin: '0 auto', maxWidth: 980 }}>
          Automate{' '}
          <span style={{ color: p.midViolet, textShadow: p.glow ? `0 0 28px ${p.violet}70` : 'none' }}>everything</span>.{' '}
          <br />
          Own the{' '}
          <span style={{ color: p.midViolet, textShadow: p.glow ? `0 0 28px ${p.violet}70` : 'none' }}>outcome</span>
          <span style={{ display: 'inline-block', width: 14, height: 14, borderRadius: '50%', background: p.coral,
            boxShadow: p.glow ? `0 0 16px ${p.coral}` : 'none', marginLeft: 8, verticalAlign: 'middle' }} />
        </h1>

        <p style={{ fontSize: 17, lineHeight: 1.55, color: p.textBody, maxWidth: 600, margin: '26px auto 30px' }}>
          MOM in, action plan out. Live status. Synced Jira. Auto rollups.
          The dull part of program management — automated.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 56 }}>
          <Link href="/workbench" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 28px',
            borderRadius: 12, fontWeight: 600, fontSize: 15, color: '#EEEDFE',
            background: 'linear-gradient(135deg,#534AB7,#7F77DD)', boxShadow: p.glow ? '0 0 24px rgba(83,74,183,0.5)' : 'none',
            textDecoration: 'none', fontFamily: "'Space Grotesk',sans-serif" }}>
            Start automating
          </Link>
          <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 28px',
            borderRadius: 12, fontWeight: 600, fontSize: 15, color: p.textPrimary,
            border: `1px solid ${p.border}`, background: p.inputBg,
            textDecoration: 'none', fontFamily: "'Space Grotesk',sans-serif" }}>
            View dashboard ↗
          </Link>
        </div>

        {/* Transformation diagram */}
        <div style={{ display: 'grid', gridTemplateColumns: '260px 80px 1fr', gap: 16, alignItems: 'center', textAlign: 'left', maxWidth: 1080, margin: '0 auto' }}>

          {/* MOM file preview */}
          <div style={{ background: p.cardBg, border: `1px solid ${p.border}`, borderRadius: 16, padding: 18,
            fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: p.textBody,
            boxShadow: p.glow ? `0 0 32px ${p.violet}38` : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, fontWeight: 600, color: p.violet }}>
              <span style={{ width: 7, height: 7, borderRadius: 4, background: p.coral,
                boxShadow: p.glow ? `0 0 8px ${p.coral}E0` : 'none', display: 'inline-block' }} />
              q3-planning-mom.txt
            </div>
            {MOM_LINES.map((l, i) => (
              <div key={i} style={{ padding: '3px 0', color: p.textMuted, opacity: 1 - i * 0.07, lineHeight: 1.4 }}>{l}</div>
            ))}
            <div style={{ marginTop: 10, fontSize: 10, color: p.textMuted }}>+ 28 lines</div>
          </div>

          {/* Arrow */}
          <div style={{ position: 'relative', height: 4, margin: '0 6px' }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: 2,
              background: 'linear-gradient(90deg,#534AB7,#F0997B)',
              boxShadow: p.glow ? `0 0 14px ${p.violet}60, 0 0 22px ${p.coral}40` : 'none' }} />
            <div style={{ position: 'absolute', right: -10, top: -10, width: 0, height: 0,
              borderLeft: '14px solid #F0997B', borderTop: '10px solid transparent', borderBottom: '10px solid transparent',
              filter: p.glow ? 'drop-shadow(0 0 6px rgba(255,176,137,0.8))' : 'none' }} />
            <div style={{ position: 'absolute', top: -26, left: 0, right: 0, textAlign: 'center',
              fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: p.violet,
              letterSpacing: '0.06em', textTransform: 'uppercase' }}>auto · 1.4s</div>
          </div>

          {/* Action table preview */}
          <div style={{ background: p.cardBg, border: `1px solid ${p.border}`, borderRadius: 16, overflow: 'hidden',
            boxShadow: p.glow ? `0 0 32px ${p.violet}20` : 'none' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${p.borderTint}`, background: p.inputBg }}>
                  {['Action Item', 'Assignee', 'ETA', 'Priority', 'Status'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: 10, fontWeight: 600,
                      letterSpacing: '0.06em', textTransform: 'uppercase', color: p.textMuted,
                      fontFamily: "'JetBrains Mono',monospace" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TABLE_ROWS.map((row, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${p.borderTint}` }}>
                    <td style={{ padding: '7px 10px', fontSize: 11, color: p.textPrimary, fontFamily: "'Inter',sans-serif" }}>{row.action}</td>
                    <td style={{ padding: '7px 10px', fontSize: 11, color: p.textBody, fontFamily: "'JetBrains Mono',monospace" }}>{row.assignee}</td>
                    <td style={{ padding: '7px 10px', fontSize: 11, color: p.textBody, fontFamily: "'JetBrains Mono',monospace" }}>{row.eta}</td>
                    <td style={{ padding: '7px 10px', fontSize: 11, color: PRIORITY_COLORS[row.priority], fontFamily: "'JetBrains Mono',monospace" }}>{row.priority}</td>
                    <td style={{ padding: '7px 10px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px',
                        borderRadius: 100, fontSize: 10, fontFamily: "'JetBrains Mono',monospace",
                        background: `${STATUS_COLORS[row.status]}18`, color: STATUS_COLORS[row.status],
                        border: `1px solid ${STATUS_COLORS[row.status]}30` }}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ─── Feature grid ────────────────────────────────────────── */}
      <section style={{ padding: '0 48px 56px', maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
          {FEATURES.map(f => {
            const color = featureColor(f.c);
            return (
              <div key={f.t} style={{ background: p.cardBg, border: `1px solid ${p.border}`, borderRadius: 16, padding: 20 }}>
                <div style={{ width: 8, height: 8, borderRadius: 4, background: color,
                  boxShadow: p.glow ? `0 0 10px ${color}` : 'none', marginBottom: 12 }} />
                <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 16, letterSpacing: '-0.3px', color: p.textPrimary, marginBottom: 6 }}>{f.t}</div>
                <div style={{ fontSize: 12, lineHeight: 1.5, color: p.textMuted }}>{f.d}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── CTA strip ───────────────────────────────────────────── */}
      <section style={{ padding: '0 48px 80px', maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ borderRadius: 22, padding: '48px 56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'linear-gradient(135deg, rgba(83,74,183,0.25), rgba(240,153,123,0.15))',
          border: `1px solid ${p.border}`, boxShadow: p.glow ? '0 24px 80px -20px rgba(83,74,183,0.4)' : 'none' }}>
          <div>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 36, letterSpacing: '-1.2px', color: p.textPrimary, marginBottom: 8 }}>
              Ready to cut status meetings by 60%?
            </div>
            <div style={{ fontSize: 15, color: p.textBody }}>Drop your first MOM and watch it become an action plan.</div>
          </div>
          <Link href="/workbench" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 32px',
            borderRadius: 14, fontWeight: 700, fontSize: 16, color: '#EEEDFE', whiteSpace: 'nowrap',
            background: 'linear-gradient(135deg,#534AB7,#7F77DD)', boxShadow: p.glow ? '0 0 28px rgba(83,74,183,0.6)' : 'none',
            textDecoration: 'none', fontFamily: "'Space Grotesk',sans-serif" }}>
            Open Workbench →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${p.borderTint}`, padding: '24px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, color: p.textMuted, fontSize: 14 }}>Shantanu</span>
        <span style={{ fontSize: 12, color: p.textMuted }}>Built for program leads</span>
      </footer>
    </div>
  );
}
