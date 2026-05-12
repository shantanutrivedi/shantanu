interface KPICardProps {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  glow?: boolean;
}

export default function KPICard({ label, value, sub, color = '#8B7CFF', glow = true }: KPICardProps) {
  return (
    <div className="rounded-xl p-4 flex flex-col gap-1"
      style={{ background: 'rgba(139,124,255,0.06)', border: '1px solid rgba(139,124,255,0.15)' }}>
      <div className="text-xs uppercase tracking-widest" style={{ color: '#7B7796', fontFamily: "'JetBrains Mono',monospace" }}>{label}</div>
      <div className="text-3xl font-bold" style={{ color, fontFamily: "'Space Grotesk',sans-serif", letterSpacing: '-1px', textShadow: glow ? `0 0 20px ${color}` : undefined }}>
        {value}
      </div>
      {sub && <div className="text-xs" style={{ color: '#7B7796' }}>{sub}</div>}
    </div>
  );
}
