import Link from 'next/link';

const FEATURES = [
  { t: 'MOM → Actions', d: 'Paste meeting notes. Shantanu extracts decisions, owners, risks, and ETAs in under two seconds.', c: '#8B7CFF' },
  { t: 'Two-way Jira', d: 'Edit the action table. We push it to Jira. Always in sync, zero copy-paste.', c: '#56E0FF' },
  { t: 'Go-live tracking', d: 'Calendar of cutovers and milestones. Nothing slips without a flag.', c: '#FFB089' },
  { t: 'Weekly auto-digest', d: 'Leadership rollup generated from your data. No more screenshots or status calls.', c: '#B6FF6E' },
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

const STATUS_COLORS: Record<string, string> = {
  'Done': '#B6FF6E', 'In Progress': '#56E0FF', 'Blocked': '#FFB089', 'Pending': '#8B7CFF',
};
const PRIORITY_COLORS: Record<string, string> = { High: '#FFB089', Medium: '#FFCB5C', Low: '#B7B3DC' };

export default function HomePage() {
  return (
    <div style={{ background: '#1C1C24', color: '#B7B3DC', position: 'relative', overflow: 'hidden' }}>

      {/* Layered glow background */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 20% -10%, rgba(139,124,255,0.55), transparent 50%), radial-gradient(ellipse at 85% 15%, rgba(255,176,137,0.30), transparent 45%), radial-gradient(ellipse at 50% 40%, rgba(86,224,255,0.18), transparent 55%)' }} />

      {/* ─── Hero ─────────────────────────────────────────────────── */}
      <section style={{ position: 'relative', padding: '72px 48px 56px', maxWidth: 1280, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 14px', borderRadius: 100,
          border: '1px solid rgba(139,124,255,0.25)', background: 'rgba(139,124,255,0.08)',
          fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8B7CFF',
          fontFamily: "'JetBrains Mono',monospace", marginBottom: 28 }}>
          <span style={{ width: 6, height: 6, borderRadius: 3, background: '#B6FF6E', boxShadow: '0 0 8px #B6FF6E', display: 'inline-block' }} />
          Real-time · auto-synced
        </div>

        <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 88, lineHeight: 0.98,
          letterSpacing: '-3.6px', color: '#EEEDFE', margin: '0 auto', maxWidth: 980 }}>
          Automate{' '}
          <span style={{ color: '#7F77DD', textShadow: '0 0 28px rgba(139,124,255,0.7)' }}>everything</span>.{' '}
          <br />
          Own the{' '}
          <span style={{ color: '#7F77DD', textShadow: '0 0 28px rgba(139,124,255,0.7)' }}>outcome</span>
          <span style={{ display: 'inline-block', width: 14, height: 14, borderRadius: '50%', background: '#F0997B',
            boxShadow: '0 0 16px #F0997B', marginLeft: 8, verticalAlign: 'middle' }} />
        </h1>

        <p style={{ fontSize: 17, lineHeight: 1.55, color: '#B7B3DC', maxWidth: 600, margin: '26px auto 30px' }}>
          MOM in, action plan out. Live status. Synced Jira. Auto rollups.
          The dull part of program management — automated.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 56 }}>
          <Link href="/workbench" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 28px',
            borderRadius: 12, fontWeight: 600, fontSize: 15, color: '#EEEDFE',
            background: 'linear-gradient(135deg,#534AB7,#7F77DD)', boxShadow: '0 0 24px rgba(83,74,183,0.5)',
            textDecoration: 'none', fontFamily: "'Space Grotesk',sans-serif" }}>
            Start automating
          </Link>
          <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 28px',
            borderRadius: 12, fontWeight: 600, fontSize: 15, color: '#EEEDFE',
            border: '1px solid rgba(139,124,255,0.3)', background: 'rgba(139,124,255,0.06)',
            textDecoration: 'none', fontFamily: "'Space Grotesk',sans-serif" }}>
            View dashboard ↗
          </Link>
        </div>

        {/* Transformation diagram */}
        <div style={{ display: 'grid', gridTemplateColumns: '260px 80px 1fr', gap: 16, alignItems: 'center', textAlign: 'left', maxWidth: 1080, margin: '0 auto' }}>

          {/* MOM file preview */}
          <div style={{ background: 'rgba(28,28,36,0.9)', border: '1px solid rgba(139,124,255,0.2)', borderRadius: 16, padding: 18,
            fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: '#B7B3DC',
            boxShadow: '0 0 32px rgba(139,124,255,0.35)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, fontWeight: 600, color: '#8B7CFF' }}>
              <span style={{ width: 7, height: 7, borderRadius: 4, background: '#F0997B', boxShadow: '0 0 8px rgba(240,153,123,0.9)', display: 'inline-block' }} />
              q3-planning-mom.txt
            </div>
            {MOM_LINES.map((l, i) => (
              <div key={i} style={{ padding: '3px 0', color: '#7B7796', opacity: 1 - i * 0.07, lineHeight: 1.4 }}>{l}</div>
            ))}
            <div style={{ marginTop: 10, fontSize: 10, color: '#7B7796' }}>+ 28 lines</div>
          </div>

          {/* Arrow */}
          <div style={{ position: 'relative', height: 4, margin: '0 6px' }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: 2,
              background: 'linear-gradient(90deg,#534AB7,#F0997B)',
              boxShadow: '0 0 14px rgba(139,124,255,0.6), 0 0 22px rgba(255,176,137,0.4)' }} />
            <div style={{ position: 'absolute', right: -10, top: -10, width: 0, height: 0,
              borderLeft: '14px solid #F0997B', borderTop: '10px solid transparent', borderBottom: '10px solid transparent',
              filter: 'drop-shadow(0 0 6px rgba(255,176,137,0.8))' }} />
            <div style={{ position: 'absolute', top: -26, left: 0, right: 0, textAlign: 'center',
              fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: '#8B7CFF',
              letterSpacing: '0.06em', textTransform: 'uppercase' }}>auto · 1.4s</div>
          </div>

          {/* Action table preview */}
          <div style={{ background: 'rgba(28,28,36,0.9)', border: '1px solid rgba(139,124,255,0.2)', borderRadius: 16, overflow: 'hidden',
            boxShadow: '0 0 32px rgba(139,124,255,0.2)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(139,124,255,0.15)', background: 'rgba(139,124,255,0.06)' }}>
                  {['Action Item', 'Assignee', 'ETA', 'Priority', 'Status'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: 10, fontWeight: 600,
                      letterSpacing: '0.06em', textTransform: 'uppercase', color: '#7B7796',
                      fontFamily: "'JetBrains Mono',monospace" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TABLE_ROWS.map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(139,124,255,0.08)' }}>
                    <td style={{ padding: '7px 10px', fontSize: 11, color: '#EEEDFE', fontFamily: "'Inter',sans-serif" }}>{row.action}</td>
                    <td style={{ padding: '7px 10px', fontSize: 11, color: '#B7B3DC', fontFamily: "'JetBrains Mono',monospace" }}>{row.assignee}</td>
                    <td style={{ padding: '7px 10px', fontSize: 11, color: '#B7B3DC', fontFamily: "'JetBrains Mono',monospace" }}>{row.eta}</td>
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
          {FEATURES.map(f => (
            <div key={f.t} style={{ background: 'rgba(28,28,36,0.6)', border: '1px solid rgba(139,124,255,0.15)', borderRadius: 16, padding: 20 }}>
              <div style={{ width: 8, height: 8, borderRadius: 4, background: f.c, boxShadow: `0 0 10px ${f.c}`, marginBottom: 12 }} />
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 16, letterSpacing: '-0.3px', color: '#EEEDFE', marginBottom: 6 }}>{f.t}</div>
              <div style={{ fontSize: 12, lineHeight: 1.5, color: '#7B7796' }}>{f.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CTA strip ───────────────────────────────────────────── */}
      <section style={{ padding: '0 48px 80px', maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ borderRadius: 22, padding: '48px 56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'linear-gradient(135deg, rgba(83,74,183,0.25), rgba(240,153,123,0.15))',
          border: '1px solid rgba(139,124,255,0.25)', boxShadow: '0 24px 80px -20px rgba(83,74,183,0.4)' }}>
          <div>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 36, letterSpacing: '-1.2px', color: '#EEEDFE', marginBottom: 8 }}>
              Ready to cut status meetings by 60%?
            </div>
            <div style={{ fontSize: 15, color: '#B7B3DC' }}>Drop your first MOM and watch it become an action plan.</div>
          </div>
          <Link href="/workbench" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 32px',
            borderRadius: 14, fontWeight: 700, fontSize: 16, color: '#EEEDFE', whiteSpace: 'nowrap',
            background: 'linear-gradient(135deg,#534AB7,#7F77DD)', boxShadow: '0 0 28px rgba(83,74,183,0.6)',
            textDecoration: 'none', fontFamily: "'Space Grotesk',sans-serif" }}>
            Open Workbench →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(139,124,255,0.1)', padding: '24px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, color: '#7B7796', fontSize: 14 }}>Shantanu</span>
        <span style={{ fontSize: 12, color: '#7B7796' }}>Built for program leads</span>
      </footer>
    </div>
  );
}
