type Priority = 'High' | 'Medium' | 'Low';

const STYLES: Record<Priority, { color: string }> = {
  High:   { color: '#FFB089' },
  Medium: { color: '#FFCB5C' },
  Low:    { color: '#B7B3DC' },
};

export default function PriorityBadge({ priority }: { priority: Priority }) {
  const s = STYLES[priority];
  return (
    <span className="text-xs font-mono" style={{ color: s.color, fontFamily: "'JetBrains Mono',monospace" }}>
      {priority === 'High' ? '▲' : priority === 'Medium' ? '●' : '▽'} {priority}
    </span>
  );
}
