'use client';
import { usePalette } from '@/lib/palette';

type Status = 'Pending' | 'In Progress' | 'Done' | 'Blocked';

const DARK_STYLES: Record<Status, { bg: string; color: string }> = {
  'Done':        { bg: 'rgba(182,255,110,0.12)', color: '#B6FF6E' },
  'In Progress': { bg: 'rgba(86,224,255,0.12)',  color: '#56E0FF' },
  'Blocked':     { bg: 'rgba(240,153,123,0.12)', color: '#F0997B' },
  'Pending':     { bg: 'rgba(139,124,255,0.12)', color: '#8B7CFF' },
};

const LIGHT_STYLES: Record<Status, { bg: string; color: string }> = {
  'Done':        { bg: 'rgba(74,146,0,0.1)',   color: '#4A9200' },
  'In Progress': { bg: 'rgba(0,127,170,0.1)',   color: '#007FAA' },
  'Blocked':     { bg: 'rgba(217,97,74,0.1)',   color: '#D9614A' },
  'Pending':     { bg: 'rgba(85,72,217,0.1)',   color: '#5548D9' },
};

export default function StatusPill({ status }: { status: Status }) {
  const p = usePalette();
  const styles = p.glow ? DARK_STYLES : LIGHT_STYLES;
  const s = styles[status] || styles['Pending'];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 9px',
      borderRadius: 100, fontSize: 10, fontWeight: 600, fontFamily: "'JetBrains Mono',monospace",
      background: s.bg, color: s.color, border: `1px solid ${s.color}30` }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.color,
        boxShadow: p.glow ? `0 0 6px ${s.color}` : 'none', display: 'inline-block' }} />
      {status}
    </span>
  );
}
