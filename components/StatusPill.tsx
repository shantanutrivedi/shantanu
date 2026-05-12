type Status = 'Pending' | 'In Progress' | 'Done' | 'Blocked';

const STATUS_STYLES: Record<Status, { bg: string; color: string; glow: string }> = {
  'Done':        { bg: 'rgba(182,255,110,0.12)', color: '#B6FF6E', glow: 'rgba(182,255,110,0.25)' },
  'In Progress': { bg: 'rgba(86,224,255,0.12)',  color: '#56E0FF', glow: 'rgba(86,224,255,0.25)' },
  'Blocked':     { bg: 'rgba(240,153,123,0.12)', color: '#F0997B', glow: 'rgba(240,153,123,0.25)' },
  'Pending':     { bg: 'rgba(139,124,255,0.12)', color: '#8B7CFF', glow: 'rgba(139,124,255,0.25)' },
};

export default function StatusPill({ status }: { status: Status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES['Pending'];
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.glow}`, fontFamily: "'JetBrains Mono',monospace" }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.color, boxShadow: `0 0 6px ${s.color}`, display: 'inline-block' }} />
      {status}
    </span>
  );
}
