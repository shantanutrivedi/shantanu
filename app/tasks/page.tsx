'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { loadState, saveState, onUserChange } from '@/lib/store';
import { loadJiraConfig } from '@/lib/userConfig';
import { usePalette } from '@/lib/palette';
import type { Palette } from '@/lib/palette';
import type { AppState, ActionItem, DailyActivity } from '@/lib/types';

// ── Unified task ─────────────────────────────────────────────────────────────

interface Task {
  id: string;
  source: 'MOM' | 'Activity';
  task: string;
  assignee: string;
  eta: string;
  product: string;
  priority: string;
  type: string;
  status: string;
  comment: string;
  projectId: string;
}

// ── Date helpers ──────────────────────────────────────────────────────────────

export function toISO(raw: string): string {
  if (!raw) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const d = new Date(raw);
  if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  return raw;
}

export function fmtDate(raw: string): string {
  if (!raw) return '—';
  const iso = toISO(raw);
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [y, m, d] = iso.split('-').map(Number);
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${String(d).padStart(2,'0')} ${months[m-1]} ${y}`;
  }
  return raw;
}

// ── Calendar picker ───────────────────────────────────────────────────────────

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_INITIALS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

function CalendarPicker({ value, onSelect, onClose, p }: {
  value: string; onSelect: (d: string) => void; onClose: () => void; p: Palette;
}) {
  const init = value ? new Date(value + 'T00:00:00') : new Date();
  const [yr, setYr] = useState(init.getFullYear());
  const [mo, setMo] = useState(init.getMonth());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);

  function prev() { if (mo === 0) { setYr(y => y-1); setMo(11); } else setMo(m => m-1); }
  function next() { if (mo === 11) { setYr(y => y+1); setMo(0); } else setMo(m => m+1); }

  function pick(day: number) {
    onSelect(`${yr}-${String(mo+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`);
    onClose();
  }

  const first = new Date(yr, mo, 1).getDay();
  const days  = new Date(yr, mo+1, 0).getDate();
  const today = new Date();
  const todayMark = today.getFullYear()===yr && today.getMonth()===mo ? today.getDate() : null;
  const selDay = value?.startsWith(`${yr}-${String(mo+1).padStart(2,'0')}`) ? +value.split('-')[2] : null;

  const cells: (number|null)[] = [];
  for (let i=0; i<first; i++) cells.push(null);
  for (let d=1; d<=days; d++) cells.push(d);
  while (cells.length%7) cells.push(null);

  return (
    <div ref={ref} style={{
      position: 'absolute', top: '100%', left: 0, zIndex: 300, marginTop: 6,
      background: p.cardBg, border: `1px solid ${p.border}`, borderRadius: 14,
      padding: 16, width: 268,
      boxShadow: '0 16px 48px rgba(0,0,0,0.3)',
    }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 12 }}>
        <button onClick={prev} style={{ background:'none', border:'none', cursor:'pointer', color: p.violet, fontSize: 20, lineHeight:1, padding:'0 6px' }}>‹</button>
        <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize: 13, color: p.textPrimary }}>
          {MONTH_NAMES[mo]} {yr}
        </span>
        <button onClick={next} style={{ background:'none', border:'none', cursor:'pointer', color: p.violet, fontSize: 20, lineHeight:1, padding:'0 6px' }}>›</button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap: 2, marginBottom: 4 }}>
        {DAY_INITIALS.map(d => (
          <div key={d} style={{ textAlign:'center', fontSize: 9, color: p.textMuted, fontFamily:"'JetBrains Mono',monospace", fontWeight: 600, padding:'2px 0' }}>{d}</div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap: 2 }}>
        {cells.map((day, i) => (
          <button key={i} onClick={() => day && pick(day)} style={{
            padding:'6px 0', borderRadius: 7, border:'none',
            cursor: day ? 'pointer' : 'default',
            fontSize: 12, fontFamily:"'JetBrains Mono',monospace",
            background: day===selDay ? p.violet : day===todayMark ? `${p.violet}20` : 'none',
            color: day===selDay ? '#fff' : day===todayMark ? p.violet : day ? p.textPrimary : 'transparent',
            fontWeight: (day===selDay || day===todayMark) ? 700 : 400,
            transition: 'background 0.1s',
          }}>{day ?? ''}</button>
        ))}
      </div>

      {value && (
        <button onClick={() => { onSelect(''); onClose(); }} style={{
          width:'100%', marginTop: 10, padding:'6px 0', borderRadius: 8,
          border: `1px solid ${p.border}`, background:'none', cursor:'pointer',
          color: p.textMuted, fontSize: 11, fontFamily:"'JetBrains Mono',monospace",
        }}>
          Clear date
        </button>
      )}
    </div>
  );
}

// ── Column filter dropdown ────────────────────────────────────────────────────

function FilterDropdown({ options, value, onSelect, onClose, p }: {
  options: string[]; value: string;
  onSelect: (v: string) => void; onClose: () => void; p: Palette;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);

  return (
    <div ref={ref} style={{
      position:'absolute', top:'100%', left: 0, zIndex: 300, minWidth: 150,
      background: p.cardBg, border:`1px solid ${p.border}`, borderRadius: 12,
      padding:'4px 0', boxShadow:'0 12px 36px rgba(0,0,0,0.28)', marginTop: 4,
    }}>
      {['All', ...options].map(opt => {
        const active = opt === 'All' ? !value : value === opt;
        return (
          <button key={opt} onClick={() => { onSelect(opt === 'All' ? '' : opt); onClose(); }} style={{
            width:'100%', textAlign:'left', padding:'8px 14px',
            background: active ? p.rowBg : 'none', border:'none', cursor:'pointer',
            fontSize: 12, color: active ? p.violet : p.textBody,
            fontFamily:"'Inter',sans-serif", fontWeight: active ? 600 : 400,
          }}>
            {opt}
          </button>
        );
      })}
    </div>
  );
}

// ── Product pill ──────────────────────────────────────────────────────────────

const PRODUCTS = [
  { value: 'AI for Work',     color: '#8B7CFF', lightColor: '#5548D9' },
  { value: 'Search AI',       color: '#56E0FF', lightColor: '#007FAA' },
  { value: 'Agent Platform',  color: '#B6FF6E', lightColor: '#4A9200' },
] as const;

function SourceBadge({ source, p }: { source: 'MOM' | 'Activity'; p: Palette }) {
  const isMOM = source === 'MOM';
  const color = isMOM ? p.violet : p.amber;
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap: 4, padding:'2px 8px',
      borderRadius: 100, fontSize: 9, fontWeight: 700, letterSpacing:'0.05em',
      fontFamily:"'JetBrains Mono',monospace",
      background:`${color}18`, color, border:`1px solid ${color}30`,
    }}>
      {isMOM ? 'MOM' : 'ACT'}
    </span>
  );
}

function StatusChip({ status, p }: { status: string; p: Palette }) {
  const MAP: Record<string, string> = {
    'Done': p.lime, 'In Progress': p.cyan, 'Blocked': p.coral,
    'Pending': p.violet, 'Feature': p.cyan, 'Bug': p.coral,
    'Config': p.amber, 'Meeting': p.violet, 'Other': p.textMuted,
  };
  const color = MAP[status] || p.textMuted;
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap: 4, padding:'2px 8px',
      borderRadius: 100, fontSize: 10, fontFamily:"'JetBrains Mono',monospace",
      background:`${color}18`, color, border:`1px solid ${color}30`,
    }}>
      <span style={{ width:5, height:5, borderRadius:'50%', background:color, display:'inline-block' }}/>
      {status}
    </span>
  );
}

// ── Column header with filter ─────────────────────────────────────────────────

const COLS = [
  { key:'source',   label:'Source',   filterable:true,  width:'6%'  },
  { key:'task',     label:'Task',     filterable:false, width:'24%' },
  { key:'assignee', label:'Assignee', filterable:true,  width:'9%'  },
  { key:'eta',      label:'ETA',      filterable:'date' as const, width:'9%'  },
  { key:'product',  label:'Product',  filterable:true,  width:'10%' },
  { key:'priority', label:'Priority', filterable:true,  width:'8%'  },
  { key:'type',     label:'Type',     filterable:true,  width:'8%'  },
  { key:'status',   label:'Status',   filterable:true,  width:'11%' },
  { key:'comment',  label:'Comment',  filterable:false, width:'15%' },
] as const;

type ColKey = (typeof COLS)[number]['key'];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TasksPage() {
  const p = usePalette();
  const { data: session } = useSession();
  const [state, setState] = useState<AppState | null>(null);
  const [productFilter, setProductFilter] = useState('');
  const [colFilters, setColFilters] = useState<Partial<Record<ColKey, string>>>({});
  const [openFilter, setOpenFilter] = useState<ColKey | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ updated: number; error?: string } | null>(null);

  useEffect(() => {
    const sync = () => setState(loadState());
    sync();
    const unsub = onUserChange(sync);
    window.addEventListener('shantanu-project-change', sync);
    return () => { unsub(); window.removeEventListener('shantanu-project-change', sync); };
  }, []);

  const userId = session?.user?.id || 'guest';

  // Items in the current filtered view that have a Jira URL
  const jiraItems = useMemo(() => {
    if (!state) return [];
    return state.actionItems.filter(a => a.jiraUrl?.trim());
  }, [state]);

  async function handleJiraSync() {
    if (!state || jiraItems.length === 0) return;
    setSyncing(true);
    setSyncResult(null);

    const jiraConfig = loadJiraConfig(userId);
    if (!jiraConfig.baseUrl || !jiraConfig.email || !jiraConfig.apiToken) {
      setSyncResult({ updated: 0, error: 'Jira not configured. Go to Settings → Connectors.' });
      setSyncing(false);
      return;
    }

    try {
      const res = await fetch('/api/jira-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: jiraItems.map(a => ({ id: a.id, jiraUrl: a.jiraUrl })),
          jiraConfig,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSyncResult({ updated: 0, error: data.error || 'Sync failed' });
        return;
      }

      const updatedState = loadState();
      let updated = 0;
      for (const r of data.results) {
        if (r.status) {
          const idx = updatedState.actionItems.findIndex(a => a.id === r.id);
          if (idx >= 0 && updatedState.actionItems[idx].status !== r.status) {
            updatedState.actionItems[idx] = { ...updatedState.actionItems[idx], status: r.status as ActionItem['status'] };
            updated++;
          }
        }
      }
      saveState(updatedState);
      setState(updatedState);
      setSyncResult({ updated });
    } catch {
      setSyncResult({ updated: 0, error: 'Network error' });
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncResult(null), 4000);
    }
  }

  // Build unified task list
  const allTasks = useMemo<Task[]>(() => {
    if (!state) return [];
    const projectMap: Record<string, string> = {};
    state.projects.forEach(pr => { projectMap[pr.id] = pr.name; });

    const momTasks: Task[] = (state.actionItems ?? []).map(a => ({
      id: `mom-${a.id}`,
      source: 'MOM' as const,
      task: a.action,
      assignee: a.assignee,
      eta: toISO(a.eta),
      product: a.product,
      priority: a.priority,
      type: a.type,
      status: a.status,
      comment: a.comment,
      projectId: a.projectId ?? '',
    }));

    const actTasks: Task[] = (state.activities ?? []).map(a => ({
      id: `act-${a.id}`,
      source: 'Activity' as const,
      task: a.activity,
      assignee: a.team,
      eta: a.date,
      product: '',
      priority: '',
      type: a.type,
      status: a.type,
      comment: '',
      projectId: a.projectId,
    }));

    return [...momTasks, ...actTasks].sort((a, b) => b.eta.localeCompare(a.eta));
  }, [state]);

  // Derive unique values per column (for filter dropdowns)
  const uniqueValues = useMemo(() => {
    const map: Partial<Record<ColKey, string[]>> = {};
    COLS.filter(c => c.filterable && c.filterable !== 'date').forEach(col => {
      const vals = [...new Set(allTasks.map(t => t[col.key as keyof Task] as string).filter(Boolean))].sort();
      map[col.key] = vals;
    });
    return map;
  }, [allTasks]);

  // Apply filters
  const filtered = useMemo(() => {
    return allTasks.filter(t => {
      if (productFilter && t.source === 'MOM' && t.product !== productFilter) return false;
      if (productFilter && t.source === 'Activity') return false;
      for (const [col, val] of Object.entries(colFilters)) {
        if (!val) continue;
        const key = col as ColKey;
        if (key === 'eta') {
          if (t.eta !== val) return false;
        } else {
          if ((t[key as keyof Task] as string) !== val) return false;
        }
      }
      return true;
    });
  }, [allTasks, productFilter, colFilters]);

  function setColFilter(col: ColKey, val: string) {
    setColFilters(prev => ({ ...prev, [col]: val }));
  }

  const hasAnyFilter = productFilter || Object.values(colFilters).some(Boolean);

  if (!state) return (
    <div style={{ padding:'40px', color: p.textMuted, fontFamily:"'JetBrains Mono',monospace" }}>Loading…</div>
  );

  return (
    <div style={{ background: p.pageBg, minHeight:'100vh', position:'relative', color: p.textPrimary }}>
      {p.glow && (
        <div style={{
          position:'fixed', inset:0, pointerEvents:'none', zIndex:0,
          background:'radial-gradient(ellipse at 30% 0%, rgba(139,124,255,0.12), transparent 55%), radial-gradient(ellipse at 80% 10%, rgba(86,224,255,0.07), transparent 45%)',
        }}/>
      )}

      <div style={{ position:'relative', zIndex:1, maxWidth:1400, margin:'0 auto', padding:'36px 32px 80px' }}>

        {/* Header */}
        <div style={{ marginBottom: 28, display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16 }}>
          <div>
            <div style={{ fontSize:10, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color: p.violet, fontFamily:"'JetBrains Mono',monospace", marginBottom: 8 }}>
              Unified View
            </div>
            <h1 style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:34, letterSpacing:'-1px', color: p.textPrimary, margin:'0 0 6px' }}>
              Tasks
            </h1>
            <p style={{ color: p.textMuted, fontSize:13, fontFamily:"'Inter',sans-serif", margin:0 }}>
              All action items and activity logs — {filtered.length} of {allTasks.length} tasks
            </p>
          </div>

          {/* Jira Sync button */}
          {jiraItems.length > 0 && (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6, flexShrink:0 }}>
              <button onClick={handleJiraSync} disabled={syncing}
                style={{
                  display:'flex', alignItems:'center', gap:8,
                  padding:'10px 20px', borderRadius:10, cursor: syncing ? 'not-allowed' : 'pointer',
                  background:'linear-gradient(135deg,#0052CC,#2684FF)',
                  border:'none', color:'#fff', fontFamily:"'Space Grotesk',sans-serif",
                  fontWeight:600, fontSize:13, opacity: syncing ? 0.7 : 1,
                  boxShadow: p.glow ? '0 0 18px rgba(0,82,204,0.4)' : '0 2px 8px rgba(0,82,204,0.3)',
                  transition:'all 0.15s',
                }}>
                <span style={{ fontSize:14 }}>⟳</span>
                {syncing ? 'Syncing…' : `Sync Jira (${jiraItems.length})`}
              </button>
              {syncResult && (
                <div style={{
                  fontSize:11, fontFamily:"'JetBrains Mono',monospace",
                  color: syncResult.error ? p.coral : p.lime,
                  padding:'4px 10px', borderRadius:6,
                  background: syncResult.error ? `${p.coral}14` : `${p.lime}14`,
                }}>
                  {syncResult.error || `✓ ${syncResult.updated} item${syncResult.updated !== 1 ? 's' : ''} updated`}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Product filter buttons */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom: 24 }}>
          {PRODUCTS.map(prod => {
            const active = productFilter === prod.value;
            const color = p.glow ? prod.color : prod.lightColor;
            return (
              <button key={prod.value}
                onClick={() => setProductFilter(active ? '' : prod.value)}
                style={{
                  padding:'18px 16px', borderRadius:16, cursor:'pointer',
                  border: `2px solid ${color}`,
                  background: active ? color : `${color}10`,
                  color: active ? (p.glow ? '#1C1C24' : '#fff') : color,
                  fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:15,
                  letterSpacing:'-0.3px',
                  boxShadow: active && p.glow ? `0 0 32px ${color}60, 0 0 8px ${color}40` : active ? `0 4px 16px ${color}40` : 'none',
                  transition:'all 0.18s',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:10,
                }}
              >
                <span style={{
                  width:8, height:8, borderRadius:'50%',
                  background: active ? (p.glow ? '#1C1C24' : '#fff') : color,
                  boxShadow: active && p.glow ? 'none' : p.glow ? `0 0 8px ${color}` : 'none',
                  display:'inline-block', flexShrink:0,
                }}/>
                {prod.value}
                {active && (
                  <span style={{ fontSize:11, opacity:0.8, fontWeight:600 }}>
                    ({allTasks.filter(t => t.product === prod.value).length})
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Active filters bar */}
        {hasAnyFilter && (
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16, flexWrap:'wrap' }}>
            <span style={{ fontSize:11, color: p.textMuted, fontFamily:"'JetBrains Mono',monospace" }}>Filters:</span>
            {Object.entries(colFilters).filter(([,v]) => v).map(([col, val]) => (
              <span key={col} style={{
                display:'inline-flex', alignItems:'center', gap:6,
                padding:'3px 10px', borderRadius:100, fontSize:11,
                background: `${p.violet}18`, color: p.violet, border:`1px solid ${p.violet}30`,
                fontFamily:"'JetBrains Mono',monospace",
              }}>
                {col}: {col === 'eta' ? fmtDate(val) : val}
                <button onClick={() => setColFilter(col as ColKey, '')} style={{ background:'none', border:'none', cursor:'pointer', color: p.violet, fontSize:14, lineHeight:1, padding:0 }}>×</button>
              </span>
            ))}
            <button onClick={() => { setColFilters({}); setProductFilter(''); }} style={{
              padding:'3px 12px', borderRadius:100, fontSize:11, border:`1px solid ${p.border}`,
              background:'none', cursor:'pointer', color: p.textMuted, fontFamily:"'JetBrains Mono',monospace",
            }}>
              Clear all
            </button>
          </div>
        )}

        {/* Table */}
        <div style={{ borderRadius:16, border:`1px solid ${p.border}`, overflow:'hidden' }}>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', tableLayout:'fixed' }}>
              <colgroup>
                {COLS.map(c => <col key={c.key} style={{ width: c.width }}/>)}
              </colgroup>

              {/* Header */}
              <thead>
                <tr style={{ background: p.inputBg, borderBottom:`1px solid ${p.borderTint}` }}>
                  {COLS.map(col => {
                    const filterVal = colFilters[col.key] ?? '';
                    const isFiltered = !!filterVal;
                    return (
                      <th key={col.key} style={{
                        padding:'11px 10px', textAlign:'left', fontSize:10, fontWeight:600,
                        letterSpacing:'0.07em', textTransform:'uppercase', color: isFiltered ? p.violet : p.textMuted,
                        fontFamily:"'JetBrains Mono',monospace", position:'relative',
                      }}>
                        {col.filterable ? (
                          <button
                            onClick={() => {
                              if (col.filterable === 'date') {
                                setCalendarOpen(o => !o);
                                setOpenFilter(openFilter === col.key ? null : col.key);
                              } else {
                                setOpenFilter(openFilter === col.key ? null : col.key);
                                setCalendarOpen(false);
                              }
                            }}
                            style={{
                              background:'none', border:'none', cursor:'pointer',
                              display:'flex', alignItems:'center', gap:5,
                              color: isFiltered ? p.violet : p.textMuted,
                              fontFamily:"'JetBrains Mono',monospace", fontSize:10,
                              fontWeight:600, letterSpacing:'0.07em', textTransform:'uppercase',
                              padding:0,
                            }}
                          >
                            {col.label}
                            <span style={{ fontSize:9, opacity:0.7 }}>{isFiltered ? '●' : '▾'}</span>
                          </button>
                        ) : (
                          col.label
                        )}

                        {/* Calendar popup for ETA */}
                        {col.filterable === 'date' && openFilter === col.key && (
                          <CalendarPicker
                            value={filterVal}
                            onSelect={v => setColFilter(col.key, v)}
                            onClose={() => { setOpenFilter(null); setCalendarOpen(false); }}
                            p={p}
                          />
                        )}

                        {/* Text/select dropdown */}
                        {col.filterable === true && openFilter === col.key && (
                          <FilterDropdown
                            options={uniqueValues[col.key] ?? []}
                            value={filterVal}
                            onSelect={v => setColFilter(col.key, v)}
                            onClose={() => setOpenFilter(null)}
                            p={p}
                          />
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>

              {/* Body */}
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={COLS.length} style={{ textAlign:'center', padding:'48px 24px', color: p.textMuted, fontFamily:"'Inter',sans-serif", fontSize:14 }}>
                      No tasks match the current filters.
                    </td>
                  </tr>
                ) : filtered.map((task, i) => (
                  <tr key={task.id} style={{
                    borderBottom:`1px solid ${p.borderTint}`,
                    background: i%2===0 ? 'transparent' : p.rowBg,
                    transition:'background 0.12s',
                  }}
                    onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = p.inputBg}
                    onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = i%2===0 ? 'transparent' : p.rowBg}
                  >
                    {/* Source */}
                    <td style={{ padding:'9px 10px', verticalAlign:'middle' }}>
                      <SourceBadge source={task.source} p={p}/>
                    </td>
                    {/* Task */}
                    <td style={{ padding:'9px 10px', fontSize:12, color: p.textPrimary, fontFamily:"'Inter',sans-serif", lineHeight:1.5, wordBreak:'break-word', verticalAlign:'top' }}>
                      {task.task || <span style={{ color: p.textMuted }}>—</span>}
                    </td>
                    {/* Assignee */}
                    <td style={{ padding:'9px 10px', fontSize:11, color: p.textBody, fontFamily:"'JetBrains Mono',monospace", verticalAlign:'middle', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {task.assignee || '—'}
                    </td>
                    {/* ETA */}
                    <td style={{ padding:'9px 10px', fontSize:11, color: task.eta ? p.cyan : p.textMuted, fontFamily:"'JetBrains Mono',monospace", verticalAlign:'middle', whiteSpace:'nowrap' }}>
                      {fmtDate(task.eta)}
                    </td>
                    {/* Product */}
                    <td style={{ padding:'9px 10px', verticalAlign:'middle' }}>
                      {task.product ? (
                        <span style={{
                          fontSize:10, fontFamily:"'JetBrains Mono',monospace", fontWeight:600,
                          color: task.product==='AI for Work' ? p.violet : task.product==='Search AI' ? p.cyan : p.lime,
                        }}>
                          {task.product}
                        </span>
                      ) : <span style={{ color: p.textMuted, fontSize:10 }}>—</span>}
                    </td>
                    {/* Priority */}
                    <td style={{ padding:'9px 10px', fontSize:11, verticalAlign:'middle',
                      color: task.priority==='High' ? p.coral : task.priority==='Medium' ? p.amber : task.priority==='Low' ? p.textMuted : p.textMuted,
                      fontFamily:"'JetBrains Mono',monospace",
                    }}>
                      {task.priority || '—'}
                    </td>
                    {/* Type */}
                    <td style={{ padding:'9px 10px', verticalAlign:'middle' }}>
                      {task.type ? <StatusChip status={task.type} p={p}/> : <span style={{ color: p.textMuted, fontSize:10 }}>—</span>}
                    </td>
                    {/* Status */}
                    <td style={{ padding:'9px 10px', verticalAlign:'middle' }}>
                      {task.status ? <StatusChip status={task.status} p={p}/> : <span style={{ color: p.textMuted, fontSize:10 }}>—</span>}
                    </td>
                    {/* Comment */}
                    <td style={{ padding:'9px 10px', fontSize:11, color: p.textMuted, fontFamily:"'Inter',sans-serif", lineHeight:1.45, wordBreak:'break-word', verticalAlign:'top' }}>
                      {task.comment || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary row */}
        <div style={{ marginTop:16, display:'flex', gap:24, flexWrap:'wrap' }}>
          {[
            { label:'Total',       val: filtered.length,                                              color: p.textBody  },
            { label:'MOM tasks',   val: filtered.filter(t=>t.source==='MOM').length,                  color: p.violet    },
            { label:'Activities',  val: filtered.filter(t=>t.source==='Activity').length,             color: p.amber     },
            { label:'Done',        val: filtered.filter(t=>t.status==='Done').length,                 color: p.lime      },
            { label:'Blocked',     val: filtered.filter(t=>t.status==='Blocked').length,              color: p.coral     },
          ].map(s => (
            <div key={s.label} style={{ display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ fontSize:18, fontWeight:700, fontFamily:"'Space Grotesk',sans-serif", color: s.color, textShadow: p.glow ? `0 0 12px ${s.color}60` : 'none' }}>
                {s.val}
              </span>
              <span style={{ fontSize:11, color: p.textMuted, fontFamily:"'JetBrains Mono',monospace" }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
