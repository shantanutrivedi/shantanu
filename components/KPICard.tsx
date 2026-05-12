'use client';
import { usePalette } from '@/lib/palette';

interface KPICardProps {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}

export default function KPICard({ label, value, sub, color }: KPICardProps) {
  const p = usePalette();
  const c = color || p.violet;
  return (
    <div style={{ background: p.cardBg, border: `1px solid ${p.border}`, borderRadius: 14, padding: '18px 20px' }}>
      <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: p.textMuted, fontFamily: "'JetBrains Mono',monospace", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 34, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif", letterSpacing: '-1px', color: c, textShadow: p.glow ? `0 0 20px ${c}` : 'none' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: p.textMuted, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}
