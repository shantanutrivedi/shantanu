'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { loadState, saveState, onUserChange } from '@/lib/store';
import { loadJiraConfig } from '@/lib/userConfig';
import { usePalette } from '@/lib/palette';
import type { Palette } from '@/lib/palette';
import type { AppState, ActionItem } from '@/lib/types';
import { getTaskId, getActivityId } from '@/lib/taskUtils';

// ── Unified task ──────────────────────────────────────────────────────────────

interface Task {
  id: string;
  source: 'MOM' | 'Activity';
  task: string;
  assignee: string;
  startDate: string;
  eta: string;
  product: string;
  priority: string;
  type: string;
  status: string;
  comment: string;
  jiraUrl: string;
  projectId: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function toISO(raw: string): string {
  if (!raw) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const d = new Date(raw);
  if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  return raw;
}

export function fmtDate(raw: string): string {
  if (!raw || raw === 'TBD') return raw || '—';
  const iso = toISO(raw);
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [y, m, d] = iso.split('-').map(Number);
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${String(d).padStart(2,'0')} ${months[m-1]} ${y}`;
  }
  return raw;
}

function getDisplayId(task: Task): string {
  return task.source === 'MOM' ? getTaskId(task.id) : getActivityId(task.id);
}

type KanbanStatus = 'todo' | 'inprogress' | 'done' | 'blocked';

function getKanbanStatus(task: Task): KanbanStatus {
  if (task.source === 'Activity') {
    const today = new Date().toISOString().split('T')[0];
    return task.eta && task.eta < today ? 'done' : 'inprogress';
  }
  switch (task.status) {
    case 'In Progress': return 'inprogress';
    case 'Done':        return 'done';
    case 'Blocked':     return 'blocked';
    default:            return 'todo';
  }
}

// ── Kanban column definitions ─────────────────────────────────────────────────

const KANBAN_COLS: { id: KanbanStatus; label: string; colorKey: keyof Palette }[] = [
  { id: 'todo',       label: 'To Do',       colorKey: 'violet' },
  { id: 'inprogress', label: 'In Progress', colorKey: 'cyan'   },
  { id: 'done',       label: 'Done',        colorKey: 'lime'   },
  { id: 'blocked',    label: 'Blocked',     colorKey: 'coral'  },
];

const PRODUCTS = [
  { value: 'AI for Work',    color: '#8B7CFF', lightColor: '#5548D9' },
  { value: 'Search AI',      color: '#56E0FF', lightColor: '#007FAA' },
  { value: 'Agent Platform', color: '#B6FF6E', lightColor: '#4A9200' },
] as const;

// ── Sub-components ────────────────────────────────────────────────────────────

function SourceBadge({ source, p }: { source: 'MOM' | 'Activity'; p: Palette }) {
  const color = source === 'MOM' ? p.violet : p.amber;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '2px 7px',
      borderRadius: 100, fontSize: 9, fontWeight: 700, letterSpacing: '0.05em',
      fontFamily: "'JetBrains Mono',monospace",
      background: `${color}18`, color, border: `1px solid ${color}30`,
    }}>
      {source === 'MOM' ? 'MOM' : 'ACT'}
    </span>
  );
}

function TypeBadge({ type, p }: { type: string; p: Palette }) {
  const MAP: Record<string, string> = {
    Feature: p.cyan, Bug: p.coral, Config: p.amber,
    Risk: p.pink, Decision: p.violet, Meeting: p.violet, Other: p.textMuted,
  };
  const color = MAP[type] || p.textMuted;
  return (
    <span style={{
      display: 'inline-block', padding: '2px 7px', borderRadius: 6,
      fontSize: 9, fontFamily: "'JetBrains Mono',monospace",
      background: `${color}18`, color, border: `1px solid ${color}30`,
    }}>
      {type}
    </span>
  );
}

function PriorityDot({ priority, p }: { priority: string; p: Palette }) {
  const color = priority === 'High' ? p.coral : priority === 'Medium' ? p.amber : p.textMuted;
  if (!priority) return null;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10,
      fontFamily: "'JetBrains Mono',monospace", color }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color,
        boxShadow: p.glow ? `0 0 6px ${color}` : 'none', display: 'inline-block', flexShrink: 0 }} />
      {priority}
    </span>
  );
}

function AssigneeInitials({ name, p }: { name: string; p: Palette }) {
  if (!name) return <span style={{ color: p.textMuted, fontSize: 10 }}>—</span>;
  const initials = name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 22, height: 22, borderRadius: '50%', fontSize: 9, fontWeight: 700,
      fontFamily: "'Space Grotesk',sans-serif",
      background: `${p.violet}22`, color: p.violet, border: `1px solid ${p.violet}40`,
      flexShrink: 0,
    }}>
      {initials}
    </span>
  );
}

// ── Task detail modal ─────────────────────────────────────────────────────────

function TaskDetailModal({ task, onClose, p }: { task: Task; onClose: () => void; p: Palette }) {
  const displayId = getDisplayId(task);
  const colInfo = KANBAN_COLS.find(c => c.id === getKanbanStatus(task));
  const statusColor = colInfo ? (p[colInfo.colorKey] as string) : p.textMuted;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const fieldStyle: React.CSSProperties = {
    background: p.inputBg, borderRadius: 10, padding: '10px 14px',
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
    color: p.textMuted, fontFamily: "'JetBrains Mono',monospace", marginBottom: 4,
  };
  const valueStyle: React.CSSProperties = {
    fontSize: 12, color: p.textBody, fontFamily: "'JetBrains Mono',monospace",
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: p.cardBg, border: `1px solid ${p.border}`, borderRadius: 20,
          padding: '28px 32px', width: '100%', maxWidth: 580, maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: p.glow ? `0 0 60px rgba(139,124,255,0.2), 0 24px 64px rgba(0,0,0,0.5)` : '0 24px 64px rgba(0,0,0,0.25)',
        }}
      >
        {/* Modal header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{
                fontSize: 11, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace",
                color: p.violet, background: `${p.violet}14`, border: `1px solid ${p.violet}30`,
                padding: '3px 10px', borderRadius: 6,
              }}>
                {displayId}
              </span>
              <SourceBadge source={task.source} p={p} />
              <span style={{
                fontSize: 10, fontFamily: "'JetBrains Mono',monospace",
                background: `${statusColor}14`, color: statusColor, border: `1px solid ${statusColor}30`,
                padding: '2px 9px', borderRadius: 100,
              }}>
                {colInfo?.label ?? task.status}
              </span>
            </div>
            <h2 style={{
              fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 18,
              color: p.textPrimary, margin: 0, lineHeight: 1.35,
            }}>
              {task.task || '—'}
            </h2>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer', color: p.textMuted,
            fontSize: 20, lineHeight: 1, padding: '2px 6px', borderRadius: 6, flexShrink: 0,
          }}>×</button>
        </div>

        {/* Fields grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>

          <div style={fieldStyle}>
            <div style={labelStyle}>Assignee</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AssigneeInitials name={task.assignee} p={p} />
              <span style={valueStyle}>{task.assignee || '—'}</span>
            </div>
          </div>

          <div style={fieldStyle}>
            <div style={labelStyle}>Product</div>
            <div style={{
              ...valueStyle,
              color: task.product === 'AI for Work' ? p.violet
                : task.product === 'Search AI' ? p.cyan
                : task.product === 'Agent Platform' ? p.lime
                : p.textMuted,
              fontWeight: task.product ? 600 : 400,
            }}>
              {task.product || '—'}
            </div>
          </div>

          <div style={fieldStyle}>
            <div style={labelStyle}>Start Date</div>
            <div style={{ ...valueStyle, color: task.startDate ? p.violet : p.textMuted }}>
              {fmtDate(task.startDate) || '—'}
            </div>
          </div>

          <div style={fieldStyle}>
            <div style={labelStyle}>ETA</div>
            <div style={{ ...valueStyle, color: task.eta ? p.cyan : p.textMuted }}>
              {fmtDate(task.eta) || '—'}
            </div>
          </div>

          <div style={fieldStyle}>
            <div style={labelStyle}>Priority</div>
            <PriorityDot priority={task.priority} p={p} />
            {!task.priority && <span style={{ ...valueStyle, color: p.textMuted }}>—</span>}
          </div>

          <div style={fieldStyle}>
            <div style={labelStyle}>Type</div>
            {task.type ? <TypeBadge type={task.type} p={p} /> : <span style={{ ...valueStyle, color: p.textMuted }}>—</span>}
          </div>

          {task.projectId && (
            <div style={fieldStyle}>
              <div style={labelStyle}>Project</div>
              <div style={{ ...valueStyle, color: p.textBody }}>{task.projectId}</div>
            </div>
          )}

        </div>

        {/* Comment */}
        {task.comment && (
          <div style={{ ...fieldStyle, marginTop: 10 }}>
            <div style={labelStyle}>Comment</div>
            <div style={{ ...valueStyle, color: p.textBody, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              {task.comment}
            </div>
          </div>
        )}

        {/* Jira URL */}
        {task.jiraUrl && (
          <div style={{ ...fieldStyle, marginTop: 10 }}>
            <div style={labelStyle}>Jira</div>
            <a href={task.jiraUrl} target="_blank" rel="noreferrer" style={{
              ...valueStyle, color: '#2684FF', textDecoration: 'underline',
              display: 'block', wordBreak: 'break-all',
            }}>
              {task.jiraUrl}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Kanban card ───────────────────────────────────────────────────────────────

function KanbanCard({ task, onClick, p }: { task: Task; onClick: () => void; p: Palette }) {
  const [hovered, setHovered] = useState(false);
  const displayId = getDisplayId(task);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? p.inputBg : p.cardBg,
        border: `1px solid ${hovered ? p.border : p.borderTint}`,
        borderRadius: 12, padding: '12px 14px', cursor: 'pointer',
        transition: 'all 0.15s',
        boxShadow: hovered && p.glow ? `0 4px 20px rgba(139,124,255,0.15)` : hovered ? '0 4px 12px rgba(0,0,0,0.12)' : 'none',
      }}
    >
      {/* Top row: ID + type + source */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <span style={{
            fontSize: 9, fontWeight: 700, color: p.violet,
            fontFamily: "'JetBrains Mono',monospace", flexShrink: 0,
          }}>
            {displayId}
          </span>
          {task.type && <TypeBadge type={task.type} p={p} />}
        </div>
        <SourceBadge source={task.source} p={p} />
      </div>

      {/* Task title */}
      <div style={{
        fontSize: 12, fontFamily: "'Inter',sans-serif", color: p.textPrimary,
        lineHeight: 1.45, marginBottom: 10,
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}>
        {task.task || <span style={{ color: p.textMuted }}>Untitled task</span>}
      </div>

      {/* Bottom row: priority + assignee + eta */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {task.priority && <PriorityDot priority={task.priority} p={p} />}
          <AssigneeInitials name={task.assignee} p={p} />
        </div>
        {task.eta && (
          <span style={{
            fontSize: 9, color: p.textMuted, fontFamily: "'JetBrains Mono',monospace",
            flexShrink: 0,
          }}>
            {fmtDate(task.eta)}
          </span>
        )}
      </div>

      {/* Product tag — warning if missing */}
      <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${p.borderTint}` }}>
        {task.product ? (
          <span style={{
            fontSize: 9, fontFamily: "'JetBrains Mono',monospace", fontWeight: 600,
            color: task.product === 'AI for Work' ? p.violet
              : task.product === 'Search AI' ? p.cyan
              : p.lime,
          }}>
            {task.product}
          </span>
        ) : task.source === 'MOM' ? (
          <span style={{
            fontSize: 9, fontFamily: "'JetBrains Mono',monospace", fontWeight: 600,
            color: p.coral, display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: p.coral, display: 'inline-block' }} />
            No product set
          </span>
        ) : null}
      </div>
    </div>
  );
}

// ── Kanban column ─────────────────────────────────────────────────────────────

function KanbanColumn({ colId, label, colorKey, tasks, onCardClick, p }: {
  colId: KanbanStatus; label: string; colorKey: keyof Palette;
  tasks: Task[]; onCardClick: (t: Task) => void; p: Palette;
}) {
  const color = p[colorKey] as string;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', minWidth: 0,
    }}>
      {/* Column header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12,
        padding: '8px 12px', borderRadius: 10,
        background: `${color}10`, border: `1px solid ${color}25`,
      }}>
        <span style={{
          width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0,
          boxShadow: p.glow ? `0 0 8px ${color}` : 'none',
        }} />
        <span style={{
          fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 13,
          color: p.textPrimary, flex: 1,
        }}>
          {label}
        </span>
        <span style={{
          fontSize: 10, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace",
          color, background: `${color}18`, border: `1px solid ${color}30`,
          padding: '2px 8px', borderRadius: 100,
        }}>
          {tasks.length}
        </span>
      </div>

      {/* Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        {tasks.length === 0 ? (
          <div style={{
            border: `1px dashed ${p.borderTint}`, borderRadius: 12,
            padding: '24px 16px', textAlign: 'center',
            color: p.textMuted, fontSize: 11, fontFamily: "'Inter',sans-serif",
          }}>
            No tasks
          </div>
        ) : (
          tasks.map(task => (
            <KanbanCard key={task.id} task={task} onClick={() => onCardClick(task)} p={p} />
          ))
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TasksPage() {
  const p = usePalette();
  const { data: session } = useSession();
  const [state, setState] = useState<AppState | null>(null);
  const [productFilter, setProductFilter] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
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

  const jiraItems = useMemo(() => {
    if (!state) return [];
    return state.actionItems.filter(a => a.jiraUrl?.trim());
  }, [state]);

  async function handleJiraSync() {
    if (!state || jiraItems.length === 0) return;
    setSyncing(true); setSyncResult(null);
    const jiraConfig = loadJiraConfig(userId);
    if (!jiraConfig.baseUrl || !jiraConfig.email || !jiraConfig.apiToken) {
      setSyncResult({ updated: 0, error: 'Jira not configured. Go to Settings → Connectors.' });
      setSyncing(false); return;
    }
    try {
      const res = await fetch('/api/jira-sync', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: jiraItems.map(a => ({ id: a.id, jiraUrl: a.jiraUrl })), jiraConfig }),
      });
      const data = await res.json();
      if (!res.ok) { setSyncResult({ updated: 0, error: data.error || 'Sync failed' }); return; }
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
      saveState(updatedState); setState(updatedState); setSyncResult({ updated });
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
    const momTasks: Task[] = (state.actionItems ?? []).map(a => ({
      id:        `mom-${a.id}`,
      source:    'MOM' as const,
      task:      a.action,
      assignee:  a.assignee,
      startDate: a.startDate ?? '',
      eta:       toISO(a.eta),
      product:   a.product,
      priority:  a.priority,
      type:      a.type,
      status:    a.status,
      comment:   a.comment,
      jiraUrl:   a.jiraUrl,
      projectId: a.projectId ?? '',
    }));

    const actTasks: Task[] = (state.activities ?? []).map(a => ({
      id:        `act-${a.id}`,
      source:    'Activity' as const,
      task:      a.activity,
      assignee:  a.team,
      startDate: '',
      eta:       a.date,
      product:   '',
      priority:  '',
      type:      a.type,
      status:    a.type,
      comment:   '',
      jiraUrl:   '',
      projectId: a.projectId,
    }));

    return [...momTasks, ...actTasks];
  }, [state]);

  // Apply product filter
  const filtered = useMemo(() => {
    if (!productFilter) return allTasks;
    return allTasks.filter(t => {
      if (t.source === 'Activity') return false;
      return t.product === productFilter;
    });
  }, [allTasks, productFilter]);

  // Group by kanban status
  const kanbanGroups = useMemo(() => {
    const groups: Record<KanbanStatus, Task[]> = { todo: [], inprogress: [], done: [], blocked: [] };
    for (const task of filtered) {
      groups[getKanbanStatus(task)].push(task);
    }
    return groups;
  }, [filtered]);

  if (!state) return (
    <div style={{ padding: '40px', color: p.textMuted, fontFamily: "'JetBrains Mono',monospace" }}>Loading…</div>
  );

  return (
    <div style={{ background: p.pageBg, minHeight: '100vh', position: 'relative', color: p.textPrimary }}>
      {p.glow && (
        <div style={{
          position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
          background: 'radial-gradient(ellipse at 30% 0%, rgba(139,124,255,0.12), transparent 55%), radial-gradient(ellipse at 80% 10%, rgba(86,224,255,0.07), transparent 45%)',
        }} />
      )}

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1400, margin: '0 auto', padding: '36px 32px 80px' }}>

        {/* Header */}
        <div style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: p.violet, fontFamily: "'JetBrains Mono',monospace", marginBottom: 8 }}>
              Kanban Board
            </div>
            <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 34, letterSpacing: '-1px', color: p.textPrimary, margin: '0 0 6px' }}>
              Tasks
            </h1>
            <p style={{ color: p.textMuted, fontSize: 13, fontFamily: "'Inter',sans-serif", margin: 0 }}>
              {filtered.length} of {allTasks.length} tasks
              {productFilter && ` · filtered by ${productFilter}`}
            </p>
          </div>

          {/* Jira Sync */}
          {jiraItems.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
              <button onClick={handleJiraSync} disabled={syncing} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 20px', borderRadius: 10, cursor: syncing ? 'not-allowed' : 'pointer',
                background: 'linear-gradient(135deg,#0052CC,#2684FF)',
                border: 'none', color: '#fff', fontFamily: "'Space Grotesk',sans-serif",
                fontWeight: 600, fontSize: 13, opacity: syncing ? 0.7 : 1,
                boxShadow: p.glow ? '0 0 18px rgba(0,82,204,0.4)' : '0 2px 8px rgba(0,82,204,0.3)',
                transition: 'all 0.15s',
              }}>
                <span style={{ fontSize: 14 }}>⟳</span>
                {syncing ? 'Syncing…' : `Sync Jira (${jiraItems.length})`}
              </button>
              {syncResult && (
                <div style={{
                  fontSize: 11, fontFamily: "'JetBrains Mono',monospace",
                  color: syncResult.error ? p.coral : p.lime,
                  padding: '4px 10px', borderRadius: 6,
                  background: syncResult.error ? `${p.coral}14` : `${p.lime}14`,
                }}>
                  {syncResult.error || `✓ ${syncResult.updated} item${syncResult.updated !== 1 ? 's' : ''} updated`}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Product filter buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 28 }}>
          {PRODUCTS.map(prod => {
            const active = productFilter === prod.value;
            const color = p.glow ? prod.color : prod.lightColor;
            return (
              <button key={prod.value}
                onClick={() => setProductFilter(active ? '' : prod.value)}
                style={{
                  padding: '18px 16px', borderRadius: 16, cursor: 'pointer',
                  border: `2px solid ${color}`,
                  background: active ? color : `${color}10`,
                  color: active ? (p.glow ? '#1C1C24' : '#fff') : color,
                  fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 15,
                  letterSpacing: '-0.3px',
                  boxShadow: active && p.glow ? `0 0 32px ${color}60, 0 0 8px ${color}40` : active ? `0 4px 16px ${color}40` : 'none',
                  transition: 'all 0.18s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                }}
              >
                <span style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: active ? (p.glow ? '#1C1C24' : '#fff') : color,
                  boxShadow: active && p.glow ? 'none' : p.glow ? `0 0 8px ${color}` : 'none',
                  display: 'inline-block', flexShrink: 0,
                }} />
                {prod.value}
                {active && (
                  <span style={{ fontSize: 11, opacity: 0.8, fontWeight: 600 }}>
                    ({allTasks.filter(t => t.product === prod.value).length})
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Kanban board */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16,
          alignItems: 'start',
        }}>
          {KANBAN_COLS.map(col => (
            <KanbanColumn
              key={col.id}
              colId={col.id}
              label={col.label}
              colorKey={col.colorKey}
              tasks={kanbanGroups[col.id]}
              onCardClick={setSelectedTask}
              p={p}
            />
          ))}
        </div>

        {/* Summary row */}
        <div style={{ marginTop: 28, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {[
            { label: 'Total',       val: filtered.length,                                    color: p.textBody },
            { label: 'To Do',       val: kanbanGroups.todo.length,                           color: p.violet   },
            { label: 'In Progress', val: kanbanGroups.inprogress.length,                     color: p.cyan     },
            { label: 'Done',        val: kanbanGroups.done.length,                           color: p.lime     },
            { label: 'Blocked',     val: kanbanGroups.blocked.length,                        color: p.coral    },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif", color: s.color, textShadow: p.glow ? `0 0 12px ${s.color}60` : 'none' }}>
                {s.val}
              </span>
              <span style={{ fontSize: 11, color: p.textMuted, fontFamily: "'JetBrains Mono',monospace" }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Task detail modal */}
      {selectedTask && (
        <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} p={p} />
      )}
    </div>
  );
}
