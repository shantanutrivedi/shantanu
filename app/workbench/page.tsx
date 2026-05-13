'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { loadState, saveState, onUserChange } from '@/lib/store';
import { usePalette } from '@/lib/palette';
import type { ActionItem, MOMUpload, MOMUploadVersion, AppState } from '@/lib/types';

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<ActionItem['status'], string> = {
  'Done': '#B6FF6E', 'In Progress': '#56E0FF', 'Blocked': '#FFB089', 'Pending': '#8B7CFF',
};
const PRIORITY_COLORS: Record<ActionItem['priority'], string> = {
  High: '#FFB089', Medium: '#FFCB5C', Low: '#B7B3DC',
};
const TYPE_COLORS: Record<ActionItem['type'], string> = {
  Feature: '#56E0FF', Bug: '#FFB089', Config: '#FFCB5C',
  Risk: '#FF6FD8', Decision: '#8B7CFF', Other: '#7B7796',
};
const STATUS_OPTIONS: ActionItem['status'][] = ['Pending', 'In Progress', 'Done', 'Blocked'];
const PRIORITY_OPTIONS: ActionItem['priority'][] = ['High', 'Medium', 'Low'];
const TYPE_OPTIONS: ActionItem['type'][] = ['Feature', 'Bug', 'Config', 'Risk', 'Decision', 'Other'];
const PRODUCT_OPTIONS = ['AI for Work', 'Search AI', 'Agent Platform'];
const VALID_PRODUCTS = new Set(PRODUCT_OPTIONS);

const TABLE_COLS = [
  { key: 'action',   label: 'Action Item', pct: '22%', wrap: true  },
  { key: 'assignee', label: 'Assignee',    pct: '9%',  wrap: false },
  { key: 'eta',      label: 'ETA',         pct: '8%',  wrap: false },
  { key: 'product',  label: 'Product',     pct: '10%', wrap: false },
  { key: 'priority', label: 'Priority',    pct: '9%',  wrap: false },
  { key: 'type',     label: 'Type',        pct: '7%',  wrap: false },
  { key: 'status',   label: 'Status',      pct: '11%', wrap: false },
  { key: 'comment',  label: 'Comment',     pct: '14%', wrap: true  },
  { key: 'jiraUrl',  label: 'Jira URL',    pct: '8%',  wrap: false },
] as const;

type ColKey = (typeof TABLE_COLS)[number]['key'];

// ── Similarity helpers ────────────────────────────────────────────────────────

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

function jaccardSimilarity(a: ActionItem, b: ActionItem): number {
  const ta = tokenize(a.action);
  const tb = tokenize(b.action);
  if (ta.size === 0 && tb.size === 0) return 0;
  const intersection = [...ta].filter(t => tb.has(t)).length;
  const union = new Set([...ta, ...tb]).size;
  return union === 0 ? 0 : intersection / union;
}

interface DuplicatePair {
  incoming: ActionItem;
  existing: ActionItem;
  similarity: number;
}

const DUPLICATE_THRESHOLD = 0.4;

// ── Display helpers ───────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso || '—';
  const [y, m, d] = iso.split('-').map(Number);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${String(d).padStart(2,'0')} ${months[m-1]} ${y}`;
}

function fmtDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' +
    d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function newBlankItem(): ActionItem {
  return {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString() + Math.random(),
    action: '', assignee: '', eta: '', product: '',
    priority: 'Medium', type: 'Feature', status: 'Pending', comment: '', jiraUrl: '',
  };
}

// ── Pill components ───────────────────────────────────────────────────────────

function StatusPill({ status }: { status: ActionItem['status'] }) {
  const color = STATUS_COLORS[status];
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 8px',
      borderRadius:100, fontSize:10, fontFamily:"'JetBrains Mono',monospace",
      background:`${color}18`, color, border:`1px solid ${color}30` }}>
      <span style={{ width:5, height:5, borderRadius:'50%', background:color, display:'inline-block' }} />
      {status}
    </span>
  );
}
function PriorityBadge({ priority }: { priority: ActionItem['priority'] }) {
  const color = PRIORITY_COLORS[priority];
  const icon = priority === 'High' ? '▲' : priority === 'Medium' ? '●' : '▽';
  return <span style={{ color, fontFamily:"'JetBrains Mono',monospace", fontSize:11 }}>{icon} {priority}</span>;
}
function TypeBadge({ type }: { type: ActionItem['type'] }) {
  const color = TYPE_COLORS[type];
  return (
    <span style={{ display:'inline-block', padding:'2px 7px', borderRadius:6, fontSize:10,
      fontFamily:"'JetBrains Mono',monospace", background:`${color}18`, color, border:`1px solid ${color}30` }}>
      {type}
    </span>
  );
}

// ── Editable cell ─────────────────────────────────────────────────────────────

function EditableCell({ value, col, rowId, onEdit }: {
  value: string; col: ColKey; rowId: string;
  onEdit: (id: string, col: ColKey, value: string) => void;
}) {
  const p = usePalette();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);

  useEffect(() => { setDraft(value); }, [value]);
  useEffect(() => { if (editing && inputRef.current) inputRef.current.focus(); }, [editing]);

  const commit = useCallback(() => {
    setEditing(false);
    if (draft !== value) onEdit(rowId, col, draft);
  }, [draft, value, rowId, col, onEdit]);

  const cellStyle: React.CSSProperties = {
    padding:'7px 10px', fontSize:11, fontFamily:"'JetBrains Mono',monospace",
    color: p.textPrimary, verticalAlign:'top', cursor:'pointer',
    wordBreak:'break-word', lineHeight:1.5,
  };
  const inputStyle: React.CSSProperties = {
    background: p.inputBg, border:`1px solid ${p.border}`, borderRadius:6,
    color: p.textPrimary, fontFamily:"'JetBrains Mono',monospace",
    fontSize:11, padding:'2px 6px', outline:'none', width:'100%', boxSizing:'border-box',
  };

  if (col === 'status') return (
    <td style={cellStyle} onClick={() => setEditing(true)}>
      {editing
        ? <select ref={inputRef as React.RefObject<HTMLSelectElement>} value={draft}
            onChange={e => setDraft(e.target.value)} onBlur={commit}
            style={{ ...inputStyle, cursor:'pointer' }}>
            {STATUS_OPTIONS.map(o => <option key={o}>{o}</option>)}
          </select>
        : <StatusPill status={draft as ActionItem['status']} />}
    </td>
  );

  if (col === 'priority') return (
    <td style={cellStyle} onClick={() => setEditing(true)}>
      {editing
        ? <select ref={inputRef as React.RefObject<HTMLSelectElement>} value={draft}
            onChange={e => setDraft(e.target.value)} onBlur={commit}
            style={{ ...inputStyle, cursor:'pointer' }}>
            {PRIORITY_OPTIONS.map(o => <option key={o}>{o}</option>)}
          </select>
        : <PriorityBadge priority={draft as ActionItem['priority']} />}
    </td>
  );

  if (col === 'product') return (
    <td style={cellStyle} onClick={() => setEditing(true)}>
      {editing
        ? <select ref={inputRef as React.RefObject<HTMLSelectElement>} value={draft}
            onChange={e => setDraft(e.target.value)} onBlur={commit}
            style={{ ...inputStyle, cursor:'pointer' }}>
            <option value="">—</option>
            {PRODUCT_OPTIONS.map(o => <option key={o}>{o}</option>)}
          </select>
        : <span style={{ color: p.textBody }}>{draft || '—'}</span>}
    </td>
  );

  if (col === 'type') return (
    <td style={cellStyle} onClick={() => setEditing(true)}>
      {editing
        ? <select ref={inputRef as React.RefObject<HTMLSelectElement>} value={draft}
            onChange={e => setDraft(e.target.value)} onBlur={commit}
            style={{ ...inputStyle, cursor:'pointer' }}>
            {TYPE_OPTIONS.map(o => <option key={o}>{o}</option>)}
          </select>
        : <TypeBadge type={draft as ActionItem['type']} />}
    </td>
  );

  if (col === 'eta') return (
    <td style={cellStyle} onClick={() => setEditing(true)}>
      {editing
        ? <input ref={inputRef as React.RefObject<HTMLInputElement>} type="date" value={draft}
            onChange={e => setDraft(e.target.value)} onBlur={commit}
            onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(value); setEditing(false); } }}
            style={{ ...inputStyle, colorScheme: p.glow ? 'dark' : 'light', cursor:'pointer' }} />
        : <span style={{ color: draft ? p.cyan : p.textMuted }}>{fmtDate(draft)}</span>}
    </td>
  );

  if (col === 'jiraUrl') return (
    <td style={cellStyle} onClick={() => setEditing(true)}>
      {editing
        ? <input ref={inputRef as React.RefObject<HTMLInputElement>} value={draft}
            onChange={e => setDraft(e.target.value)} onBlur={commit}
            onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(value); setEditing(false); } }}
            style={inputStyle} placeholder="https://..." />
        : draft
          ? <a href={draft} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
              style={{ color: p.violet, textDecoration:'underline', fontSize:11 }}>
              {draft.replace(/^https?:\/\//, '').slice(0, 22)}{draft.length > 28 ? '…' : ''}
            </a>
          : <span style={{ color: p.textMuted, fontSize:10 }}>+ add</span>}
    </td>
  );

  return (
    <td style={cellStyle} onClick={() => setEditing(true)}>
      {editing
        ? <input ref={inputRef as React.RefObject<HTMLInputElement>} value={draft}
            onChange={e => setDraft(e.target.value)} onBlur={commit}
            onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(value); setEditing(false); } }}
            style={inputStyle} />
        : <span style={{ color: col === 'action' ? p.textPrimary : p.textBody }}>
            {draft || <span style={{ color: p.textMuted, fontSize:10 }}>—</span>}
          </span>}
    </td>
  );
}

// ── Action table ──────────────────────────────────────────────────────────────

function ActionTable({ items, onEdit, onDelete, onAddRow }: {
  items: ActionItem[];
  onEdit: (id: string, col: ColKey, value: string) => void;
  onDelete: (id: string) => void;
  onAddRow: () => void;
}) {
  const p = usePalette();
  return (
    <div>
      <div style={{ borderRadius:14, border:`1px solid ${p.border}`, overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', tableLayout:'fixed' }}>
          <colgroup>
            {TABLE_COLS.map(col => <col key={col.key} style={{ width: col.pct }} />)}
            <col style={{ width:'36px' }} />
          </colgroup>
          <thead>
            <tr style={{ background: p.inputBg, borderBottom:`1px solid ${p.borderTint}` }}>
              {TABLE_COLS.map(col => (
                <th key={col.key} style={{
                  padding:'10px 10px', textAlign:'left', fontSize:10, fontWeight:600,
                  letterSpacing:'0.07em', textTransform:'uppercase', color: p.textMuted,
                  fontFamily:"'JetBrains Mono',monospace", whiteSpace:'nowrap', overflow:'hidden',
                }}>{col.label}</th>
              ))}
              <th style={{ padding:'10px 8px', width:36 }} />
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={item.id} style={{
                borderBottom:`1px solid ${p.borderTint}`,
                background: i % 2 === 0 ? 'transparent' : p.rowBg,
                transition:'background 0.15s',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = p.inputBg)}
                onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : p.rowBg)}
              >
                {TABLE_COLS.map(col => (
                  <EditableCell key={col.key} value={String(item[col.key] ?? '')}
                    col={col.key} rowId={item.id} onEdit={onEdit} />
                ))}
                <td style={{ padding:'7px 6px', verticalAlign:'middle', textAlign:'center' }}>
                  <button onClick={() => onDelete(item.id)}
                    title="Delete row"
                    style={{ background:'none', border:'none', cursor:'pointer', color: p.coral,
                      fontSize:14, lineHeight:1, padding:'2px 4px', borderRadius:4,
                      opacity:0.6, transition:'opacity 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '0.6')}
                  >✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add row button */}
      <button onClick={onAddRow}
        style={{
          marginTop:10, width:'100%', padding:'9px 0', borderRadius:10,
          border:`1px dashed ${p.borderTint}`, background:'none', cursor:'pointer',
          color: p.textMuted, fontFamily:"'JetBrains Mono',monospace", fontSize:12,
          display:'flex', alignItems:'center', justifyContent:'center', gap:6,
          transition:'all 0.15s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = p.violet; (e.currentTarget as HTMLButtonElement).style.color = p.violet; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = p.borderTint; (e.currentTarget as HTMLButtonElement).style.color = p.textMuted; }}
      >
        <span style={{ fontSize:16, lineHeight:1 }}>+</span> Add row
      </button>
    </div>
  );
}

// ── Merge modal ───────────────────────────────────────────────────────────────

function MergeModal({ pair, onConfirm, onCancel }: {
  pair: DuplicatePair;
  onConfirm: (merged: ActionItem) => void;
  onCancel: () => void;
}) {
  const p = usePalette();
  type Choice = 'incoming' | 'existing';
  const initial: Record<ColKey, Choice> = {} as Record<ColKey, Choice>;
  TABLE_COLS.forEach(c => { initial[c.key] = 'incoming'; });
  const [choices, setChoices] = useState<Record<ColKey, Choice>>(initial);

  function pick(col: ColKey, side: Choice) {
    setChoices(prev => ({ ...prev, [col]: side }));
  }

  function buildMerged(): ActionItem {
    const merged: Partial<ActionItem> = { id: pair.incoming.id };
    TABLE_COLS.forEach(c => {
      const src = choices[c.key] === 'incoming' ? pair.incoming : pair.existing;
      (merged as Record<string, unknown>)[c.key] = src[c.key as keyof ActionItem];
    });
    return merged as ActionItem;
  }

  const colLabelMap: Record<ColKey, string> = {
    action:'Action', assignee:'Assignee', eta:'ETA', product:'Product',
    priority:'Priority', type:'Type', status:'Status', comment:'Comment', jiraUrl:'Jira URL',
  };

  const displayVal = (item: ActionItem, col: ColKey): string => {
    const v = String(item[col as keyof ActionItem] ?? '');
    return col === 'eta' ? fmtDate(v) : v || '—';
  };

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,0.65)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:24,
    }}>
      <div style={{
        background: p.cardBg, border:`1px solid ${p.border}`, borderRadius:18,
        padding:28, width:'100%', maxWidth:760, maxHeight:'85vh', overflowY:'auto',
        boxShadow:'0 24px 80px rgba(0,0,0,0.5)',
      }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <div>
            <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:18, color: p.textPrimary }}>
              Merge Items
            </div>
            <div style={{ fontSize:12, color: p.textMuted, marginTop:3, fontFamily:"'Inter',sans-serif" }}>
              Pick which value to keep for each field
            </div>
          </div>
          <div style={{ padding:'4px 12px', borderRadius:100, fontSize:11, fontWeight:700,
            background:`${p.amber}18`, color: p.amber, fontFamily:"'JetBrains Mono',monospace" }}>
            {Math.round(pair.similarity * 100)}% similar
          </div>
        </div>

        {/* Column headers */}
        <div style={{ display:'grid', gridTemplateColumns:'100px 1fr 1fr', gap:8, marginBottom:8, alignItems:'center' }}>
          <div style={{ fontSize:10, color: p.textMuted, fontFamily:"'JetBrains Mono',monospace", textTransform:'uppercase', letterSpacing:'0.07em' }}>Field</div>
          <div style={{ fontSize:11, fontWeight:700, color: p.cyan, fontFamily:"'Space Grotesk',sans-serif", padding:'6px 10px',
            borderRadius:8, background:`${p.cyan}12`, border:`1px solid ${p.cyan}30`, textAlign:'center' }}>
            Incoming (new)
          </div>
          <div style={{ fontSize:11, fontWeight:700, color: p.violet, fontFamily:"'Space Grotesk',sans-serif", padding:'6px 10px',
            borderRadius:8, background:`${p.violet}12`, border:`1px solid ${p.violet}30`, textAlign:'center' }}>
            Existing
          </div>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {TABLE_COLS.map(c => {
            const inVal = displayVal(pair.incoming, c.key);
            const exVal = displayVal(pair.existing, c.key);
            const same = inVal === exVal || (inVal === '—' && exVal === '—');
            return (
              <div key={c.key} style={{ display:'grid', gridTemplateColumns:'100px 1fr 1fr', gap:8, alignItems:'center' }}>
                <div style={{ fontSize:10, color: p.textMuted, fontFamily:"'JetBrains Mono',monospace",
                  textTransform:'uppercase', letterSpacing:'0.06em' }}>{colLabelMap[c.key]}</div>
                {(['incoming','existing'] as Choice[]).map(side => {
                  const val = side === 'incoming' ? inVal : exVal;
                  const active = choices[c.key] === side;
                  const color = side === 'incoming' ? p.cyan : p.violet;
                  return (
                    <button key={side} onClick={() => pick(c.key, side)}
                      style={{
                        textAlign:'left', padding:'7px 10px', borderRadius:8, cursor: same ? 'default' : 'pointer',
                        border:`1px solid ${active ? color : p.borderTint}`,
                        background: active ? `${color}14` : 'transparent',
                        color: same ? p.textMuted : active ? color : p.textBody,
                        fontSize:12, fontFamily:"'Inter',sans-serif", lineHeight:1.4,
                        transition:'all 0.12s',
                      }}>
                      {active && !same && <span style={{ marginRight:5, fontSize:9 }}>●</span>}
                      {val}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        <div style={{ display:'flex', gap:10, marginTop:24 }}>
          <button onClick={() => onConfirm(buildMerged())}
            style={{ padding:'10px 24px', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer',
              background:'linear-gradient(135deg,#534AB7,#7F77DD)', color:'#EEEDFE', border:'none',
              fontFamily:"'Space Grotesk',sans-serif" }}>
            Confirm Merge
          </button>
          <button onClick={onCancel}
            style={{ padding:'10px 20px', borderRadius:10, fontSize:13, cursor:'pointer',
              background:'none', border:`1px solid ${p.border}`, color: p.textMuted }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Duplicate resolver panel ──────────────────────────────────────────────────

function DuplicateResolver({ pairs, onDelete, onMerge, onDismiss }: {
  pairs: DuplicatePair[];
  onDelete: (which: 'incoming' | 'existing', item: ActionItem) => void;
  onMerge: (pair: DuplicatePair) => void;
  onDismiss: () => void;
}) {
  const p = usePalette();
  const [activePair, setActivePair] = useState(0);

  if (pairs.length === 0) {
    return null;
  }

  function simColor(sim: number) {
    if (sim >= 0.9) return p.coral;
    if (sim >= 0.7) return p.amber;
    if (sim >= 0.5) return p.cyan;
    return p.textMuted;
  }

  const pair = pairs[activePair];

  return (
    <div style={{
      marginTop:28, background: p.cardBg, border:`2px solid ${p.amber}40`,
      borderRadius:18, padding:28,
      boxShadow: p.glow ? `0 0 32px ${p.amber}14` : 'none',
    }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background: p.amber,
            boxShadow: p.glow ? `0 0 10px ${p.amber}` : 'none', flexShrink:0 }} />
          <div>
            <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:18, color: p.textPrimary, letterSpacing:'-0.4px' }}>
              Potential Duplicates
            </div>
            <div style={{ fontSize:12, color: p.textMuted, marginTop:2, fontFamily:"'Inter',sans-serif" }}>
              {pairs.length} pair{pairs.length > 1 ? 's' : ''} found — review and resolve each one
            </div>
          </div>
        </div>
        <button onClick={onDismiss}
          style={{ background:'none', border:'none', cursor:'pointer', color: p.textMuted,
            fontSize:18, lineHeight:1, padding:'4px 8px' }}>✕</button>
      </div>

      {/* Pair navigation */}
      {pairs.length > 1 && (
        <div style={{ display:'flex', gap:6, marginBottom:18, flexWrap:'wrap' }}>
          {pairs.map((pr, i) => (
            <button key={i} onClick={() => setActivePair(i)}
              style={{
                padding:'4px 12px', borderRadius:100, fontSize:11, cursor:'pointer',
                fontFamily:"'JetBrains Mono',monospace",
                background: i === activePair ? `${simColor(pr.similarity)}18` : p.inputBg,
                border:`1px solid ${i === activePair ? simColor(pr.similarity) : p.borderTint}`,
                color: i === activePair ? simColor(pr.similarity) : p.textMuted,
              }}>
              #{i+1} · {Math.round(pr.similarity * 100)}%
            </button>
          ))}
        </div>
      )}

      {/* Side-by-side comparison */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:16 }}>
        {(['incoming','existing'] as const).map(side => {
          const item = side === 'incoming' ? pair.incoming : pair.existing;
          const color = side === 'incoming' ? p.cyan : p.violet;
          const label = side === 'incoming' ? 'New (incoming)' : 'Existing';
          return (
            <div key={side} style={{
              background:`${color}08`, border:`1px solid ${color}30`,
              borderRadius:12, padding:16,
            }}>
              <div style={{ fontSize:10, fontWeight:700, color, fontFamily:"'JetBrains Mono',monospace",
                letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:12 }}>
                {label}
              </div>
              <div style={{ fontSize:13, fontWeight:600, color: p.textPrimary, fontFamily:"'Space Grotesk',sans-serif",
                lineHeight:1.4, marginBottom:10 }}>
                {item.action || '—'}
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                {[
                  ['Assignee', item.assignee],
                  ['ETA',      fmtDate(item.eta)],
                  ['Product',  item.product],
                  ['Priority', item.priority],
                  ['Status',   item.status],
                ].map(([label, val]) => val && (
                  <div key={label} style={{ display:'flex', gap:8, alignItems:'center' }}>
                    <span style={{ fontSize:9, color: p.textMuted, fontFamily:"'JetBrains Mono',monospace",
                      textTransform:'uppercase', letterSpacing:'0.06em', minWidth:52 }}>{label}</span>
                    <span style={{ fontSize:11, color: p.textBody, fontFamily:"'JetBrains Mono',monospace" }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Similarity bar */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18 }}>
        <span style={{ fontSize:11, color: p.textMuted, fontFamily:"'JetBrains Mono',monospace", minWidth:70 }}>Similarity</span>
        <div style={{ flex:1, height:6, borderRadius:3, background: p.inputBg, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${Math.round(pair.similarity * 100)}%`,
            borderRadius:3, background: simColor(pair.similarity),
            boxShadow: p.glow ? `0 0 8px ${simColor(pair.similarity)}` : 'none',
            transition:'width 0.3s ease' }} />
        </div>
        <span style={{ fontSize:12, fontWeight:700, color: simColor(pair.similarity),
          fontFamily:"'JetBrains Mono',monospace", minWidth:36, textAlign:'right' }}>
          {Math.round(pair.similarity * 100)}%
        </span>
      </div>

      {/* Actions */}
      <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
        <button onClick={() => onMerge(pair)}
          style={{ padding:'9px 20px', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer',
            background:'linear-gradient(135deg,#534AB7,#7F77DD)', color:'#EEEDFE', border:'none',
            fontFamily:"'Space Grotesk',sans-serif" }}>
          Merge (field picker)
        </button>
        <button onClick={() => onDelete('incoming', pair.incoming)}
          style={{ padding:'9px 18px', borderRadius:10, fontSize:13, cursor:'pointer',
            background:`${p.cyan}12`, border:`1px solid ${p.cyan}30`, color: p.cyan,
            fontFamily:"'Space Grotesk',sans-serif", fontWeight:600 }}>
          Delete new
        </button>
        <button onClick={() => onDelete('existing', pair.existing)}
          style={{ padding:'9px 18px', borderRadius:10, fontSize:13, cursor:'pointer',
            background:`${p.coral}12`, border:`1px solid ${p.coral}30`, color: p.coral,
            fontFamily:"'Space Grotesk',sans-serif", fontWeight:600 }}>
          Delete existing
        </button>
        <button onClick={onDismiss}
          style={{ padding:'9px 18px', borderRadius:10, fontSize:13, cursor:'pointer',
            background:'none', border:`1px solid ${p.borderTint}`, color: p.textMuted,
            fontFamily:"'Space Grotesk',sans-serif" }}>
          Keep both
        </button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function WorkbenchPage() {
  const p = usePalette();
  const [appState, setAppState] = useState<AppState | null>(null);
  const [rawText, setRawText] = useState('');
  const [filename, setFilename] = useState('');
  const [parsedItems, setParsedItems] = useState<ActionItem[]>([]);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [saved, setSaved] = useState(false);
  const [expandedUploadId, setExpandedUploadId] = useState<string | null>(null);
  const [duplicates, setDuplicates] = useState<DuplicatePair[]>([]);
  const [showResolver, setShowResolver] = useState(false);
  const [mergeTarget, setMergeTarget] = useState<DuplicatePair | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const sync = () => setAppState(loadState());
    sync();
    const unsub = onUserChange(sync);
    return unsub;
  }, []);

  const SUPPORTED_EXTS = new Set(['txt','md','pdf','doc','docx','xlsx','xls','csv','json']);

  const readFile = useCallback(async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!SUPPORTED_EXTS.has(ext)) {
      setParseError(`Unsupported file type .${ext}. Supported: TXT, MD, PDF, DOC, DOCX, XLSX, XLS, CSV, JSON`);
      return;
    }
    setParseError('');
    setParsedItems([]);
    setDuplicates([]);
    setShowResolver(false);
    setSaved(false);
    setFilename(file.name);

    if (ext === 'txt' || ext === 'md') {
      const reader = new FileReader();
      reader.onload = e => setRawText((e.target?.result as string) || '');
      reader.readAsText(file);
    } else {
      // Server-side extraction for binary/structured formats
      setRawText('');
      const form = new FormData();
      form.append('file', file);
      try {
        const res = await fetch('/api/extract-text', { method: 'POST', body: form });
        const data = await res.json();
        if (data.error) { setParseError(data.error); return; }
        setRawText(data.text ?? '');
      } catch {
        setParseError('Failed to extract text from file.');
      }
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) readFile(file);
  }, [readFile]);

  const handleDragOver  = useCallback((e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setDragging(true); }, []);
  const handleDragLeave = useCallback(() => setDragging(false), []);
  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (file) readFile(file);
  }, [readFile]);

  const handleParseWithAI = useCallback(async () => {
    if (!rawText.trim()) return;
    setParsing(true); setParseError('');
    try {
      const res = await fetch('/api/parse-mom', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ text: rawText, filename, model: loadState().selectedModel }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.items)) {
        const items: ActionItem[] = data.items.map((item: Partial<ActionItem>) => ({
          id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Date.now().toString() + Math.random(),
          action: item.action ?? '', assignee: item.assignee ?? '', eta: item.eta ?? '',
          product: VALID_PRODUCTS.has(item.product ?? '') ? item.product! : '',
          priority: (['High','Medium','Low'].includes(item.priority ?? '') ? item.priority : 'Medium') as ActionItem['priority'],
          type: (['Feature','Bug','Config','Risk','Decision','Other'].includes(item.type ?? '') ? item.type : 'Other') as ActionItem['type'],
          status: (['Pending','In Progress','Done','Blocked'].includes(item.status ?? '') ? item.status : 'Pending') as ActionItem['status'],
          comment: item.comment ?? '', jiraUrl: item.jiraUrl ?? '',
        }));
        setParsedItems(items);
        setSaved(false);

        // Duplicate detection against existing action items
        const existing = loadState().actionItems;
        const found: DuplicatePair[] = [];
        for (const inc of items) {
          for (const ex of existing) {
            const sim = jaccardSimilarity(inc, ex);
            if (sim >= DUPLICATE_THRESHOLD) {
              found.push({ incoming: inc, existing: ex, similarity: sim });
            }
          }
        }
        setDuplicates(found);
        if (found.length > 0) setShowResolver(true);
      } else {
        setParseError(data.error || 'Parsing failed. Please try again.');
      }
    } catch {
      setParseError('Network error. Could not reach /api/parse-mom.');
    } finally {
      setParsing(false);
    }
  }, [rawText, filename]);

  const handleEditItem = useCallback((id: string, col: ColKey, value: string) => {
    setParsedItems(prev => prev.map(item => item.id === id ? { ...item, [col]: value } : item));
    setSaved(false);
  }, []);

  const handleAddRow = useCallback(() => {
    setParsedItems(prev => [...prev, newBlankItem()]);
    setSaved(false);
  }, []);

  const handleDeleteRow = useCallback((id: string) => {
    setParsedItems(prev => prev.filter(item => item.id !== id));
    setDuplicates(prev => prev.filter(d => d.incoming.id !== id));
    setSaved(false);
  }, []);

  // Version-aware save: group by filename + projectId
  const handleSave = useCallback(() => {
    if (!appState || parsedItems.length === 0) return;

    const taggedItems = parsedItems.map(item => ({
      ...item,
      projectId: appState.activeProjectId,
      product: VALID_PRODUCTS.has(item.product) ? item.product : '',
    }));
    const incomingIds = new Set(taggedItems.map(t => t.id));

    const existingGroup = (appState.momUploads ?? []).find(u =>
      u.filename === filename && u.projectId === appState.activeProjectId
    );

    let updatedUploads: MOMUpload[];
    if (existingGroup) {
      const prevVersions: MOMUploadVersion[] = existingGroup.versions ?? [
        { version: 1, savedAt: existingGroup.uploadedAt, parsedItems: existingGroup.parsedItems },
      ];
      const updatedGroup: MOMUpload = {
        ...existingGroup,
        rawText,
        parsedItems: taggedItems,
        versions: [...prevVersions, { version: prevVersions.length + 1, savedAt: new Date().toISOString(), parsedItems: taggedItems }],
      };
      updatedUploads = [updatedGroup, ...(appState.momUploads ?? []).filter(u => u.id !== existingGroup.id)];
    } else {
      const newUpload: MOMUpload = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
        filename, uploadedAt: new Date().toISOString(),
        projectId: appState.activeProjectId, rawText,
        parsedItems: taggedItems,
        versions: [{ version: 1, savedAt: new Date().toISOString(), parsedItems: taggedItems }],
      };
      updatedUploads = [newUpload, ...(appState.momUploads ?? [])];
    }

    const newState: AppState = {
      ...appState,
      actionItems: [...appState.actionItems.filter(a => !incomingIds.has(a.id)), ...taggedItems],
      momUploads: updatedUploads,
    };
    saveState(newState);
    setAppState(newState);
    setSaved(true);
  }, [appState, parsedItems, filename, rawText]);

  // Duplicate resolver callbacks
  function handleDuplicateDelete(which: 'incoming' | 'existing', item: ActionItem) {
    if (which === 'incoming') {
      setParsedItems(prev => prev.filter(p => p.id !== item.id));
    } else {
      const state = loadState();
      const updated = { ...state, actionItems: state.actionItems.filter(a => a.id !== item.id) };
      saveState(updated);
      setAppState(updated);
    }
    setDuplicates(prev => prev.filter(d => d.incoming.id !== item.id && d.existing.id !== item.id));
    if (duplicates.filter(d => d.incoming.id !== item.id && d.existing.id !== item.id).length === 0) {
      setShowResolver(false);
    }
  }

  function handleMergeOpen(pair: DuplicatePair) {
    setMergeTarget(pair);
  }

  function handleMergeConfirm(merged: ActionItem) {
    if (!mergeTarget) return;
    // Replace in parsedItems
    setParsedItems(prev => prev.map(p => p.id === mergeTarget.incoming.id ? merged : p));
    // Remove existing from state
    const state = loadState();
    const updated = { ...state, actionItems: state.actionItems.filter(a => a.id !== mergeTarget.existing.id) };
    saveState(updated);
    setAppState(updated);
    setDuplicates(prev => prev.filter(d => d.incoming.id !== mergeTarget.incoming.id));
    if (duplicates.filter(d => d.incoming.id !== mergeTarget.incoming.id).length === 0) setShowResolver(false);
    setMergeTarget(null);
    setSaved(false);
  }

  // Group uploads by filename+project for the sidebar
  const uploadGroups = (() => {
    const uploads = appState?.momUploads ?? [];
    const seen = new Set<string>();
    const groups: MOMUpload[] = [];
    for (const u of uploads) {
      const key = `${u.filename}::${u.projectId}`;
      if (!seen.has(key)) { seen.add(key); groups.push(u); }
    }
    return groups.slice(0, 8);
  })();

  const cardStyle: React.CSSProperties = { background: p.cardBg, border:`1px solid ${p.border}`, borderRadius:16, padding:24 };
  const dropzoneStyle: React.CSSProperties = {
    border: dragging ? `2px dashed ${p.violet}` : `2px dashed ${p.borderTint}`,
    borderRadius:14, padding:'36px 24px', textAlign:'center', cursor:'pointer',
    transition:'all 0.2s', background: dragging ? p.inputBg : 'transparent',
    boxShadow: dragging && p.glow ? p.glowStr(p.violet, 28) : 'none',
    marginBottom: rawText ? 20 : 0,
  };
  const primaryBtnStyle: React.CSSProperties = {
    display:'inline-flex', alignItems:'center', gap:8, padding:'10px 22px',
    borderRadius:10, fontWeight:600, fontSize:14, color:'#EEEDFE',
    background:'linear-gradient(135deg,#534AB7,#7F77DD)',
    boxShadow: p.glow ? '0 0 20px rgba(83,74,183,0.45)' : 'none',
    border:'none', cursor:'pointer', fontFamily:"'Space Grotesk',sans-serif", transition:'all 0.2s',
  };

  return (
    <div style={{ background: p.pageBg, minHeight:'100vh', padding:'32px 40px', color: p.textPrimary }}>

      {/* Header */}
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:32,
          letterSpacing:'-1px', color: p.textPrimary, margin:0, marginBottom:6,
          textShadow: p.glow ? p.glowStr(p.violet, 24) : undefined }}>
          Workbench
          <span style={{ marginLeft:12, display:'inline-block', width:8, height:8, borderRadius:4,
            background: p.lime, boxShadow: p.glow ? p.glowStr(p.lime, 10) : 'none', verticalAlign:'middle' }} />
        </h1>
        <p style={{ fontFamily:"'Inter',sans-serif", fontSize:14, color: p.textMuted, margin:0 }}>
          Upload a meeting notes file, parse it with AI, and turn actions into a live tracker.
        </p>
      </div>

      {/* Upload + Recent grid */}
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:20, alignItems:'start' }}>

        {/* Drop Zone */}
        <div style={cardStyle}>
          <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:600, fontSize:15,
            color: p.textPrimary, marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ width:6, height:6, borderRadius:3, background: p.violet,
              boxShadow: p.glow ? p.glowStr(p.violet, 8) : 'none', display:'inline-block' }} />
            Upload MOM File
          </div>

          <div style={dropzoneStyle} onDragOver={handleDragOver} onDragLeave={handleDragLeave}
            onDrop={handleDrop} onClick={() => fileRef.current?.click()}>
            <div style={{ fontSize:32, marginBottom:10 }}>📄</div>
            <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:600, fontSize:15,
              color: dragging ? p.violet : p.textPrimary, marginBottom:6 }}>
              {dragging ? 'Drop to upload' : 'Drag & drop your meeting file'}
            </div>
            <div style={{ fontFamily:"'Inter',sans-serif", fontSize:12, color: p.textMuted }}>
              or click to browse — PDF, DOCX, XLSX, TXT, JSON and more
            </div>
          </div>
          <input ref={fileRef} type="file" accept=".txt,.md,.pdf,.doc,.docx,.xlsx,.xls,.csv,.json" style={{ display:'none' }} onChange={handleFileInput} />

          {parseError && (
            <div style={{ marginTop:12, padding:'10px 14px', borderRadius:10,
              background:'rgba(240,153,123,0.12)', border:'1px solid rgba(240,153,123,0.3)',
              color: p.coral, fontFamily:"'JetBrains Mono',monospace", fontSize:12 }}>
              {parseError}
            </div>
          )}

          {rawText && (
            <div style={{ marginTop:20 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color: p.coral }}>{filename}</span>
                  <span style={{ fontSize:10, color: p.textMuted, fontFamily:"'JetBrains Mono',monospace" }}>
                    {rawText.length.toLocaleString()} chars
                  </span>
                </div>
                <button onClick={handleParseWithAI} disabled={parsing}
                  style={{ ...primaryBtnStyle, opacity: parsing ? 0.7 : 1, cursor: parsing ? 'not-allowed' : 'pointer' }}>
                  {parsing
                    ? <><span style={{ display:'inline-block', width:14, height:14, border:'2px solid rgba(255,255,255,0.3)',
                          borderTopColor:'#EEEDFE', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />Parsing…</>
                    : <>✦ Parse with AI</>}
                </button>
              </div>
              <div style={{ maxHeight:220, overflowY:'auto', padding:'14px 16px', borderRadius:10,
                background: p.cardBg, border:`1px solid ${p.borderTint}`,
                fontFamily:"'JetBrains Mono',monospace", fontSize:11, color: p.textBody,
                lineHeight:1.65, whiteSpace:'pre-wrap', wordBreak:'break-word' }}>
                {rawText}
              </div>
            </div>
          )}

          {!rawText && (
            <div style={{ marginTop:16, display:'flex', justifyContent:'center' }}>
              <button disabled style={{ ...primaryBtnStyle, opacity:0.35, cursor:'not-allowed' }}>✦ Parse with AI</button>
            </div>
          )}
        </div>

        {/* Recent Uploads — grouped with version history */}
        <div style={cardStyle}>
          <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:600, fontSize:15,
            color: p.textPrimary, marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ width:6, height:6, borderRadius:3, background: p.coral,
              boxShadow: p.glow ? p.glowStr(p.coral, 8) : 'none', display:'inline-block' }} />
            Recent Uploads
          </div>

          {uploadGroups.length === 0 ? (
            <div style={{ textAlign:'center', padding:'32px 16px',
              fontFamily:"'Inter',sans-serif", fontSize:13, color: p.textMuted }}>
              <div style={{ fontSize:24, marginBottom:8 }}>📂</div>
              No uploads yet. Parse a MOM file to get started.
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {uploadGroups.map(upload => {
                const versions = upload.versions ?? [
                  { version:1, savedAt: upload.uploadedAt, parsedItems: upload.parsedItems },
                ];
                const latest = versions[versions.length - 1];
                const isExpanded = expandedUploadId === upload.id;
                const latestDate = new Date(latest.savedAt);

                return (
                  <div key={upload.id} style={{
                    borderRadius:10, border:`1px solid ${p.borderTint}`,
                    overflow:'hidden', background: p.rowBg,
                  }}>
                    {/* Header row */}
                    <div style={{ padding:'12px 14px', cursor:'pointer', transition:'background 0.15s' }}
                      onClick={() => setExpandedUploadId(isExpanded ? null : upload.id)}
                      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = p.inputBg}
                      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
                    >
                      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8 }}>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color: p.coral,
                            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:3 }}>
                            {upload.filename}
                          </div>
                          <div style={{ fontFamily:"'Inter',sans-serif", fontSize:11, color: p.textMuted }}>
                            {latest.parsedItems.length} actions · {fmtDateTime(latest.savedAt)}
                          </div>
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
                          <span style={{ padding:'2px 7px', borderRadius:6, fontSize:10,
                            fontFamily:"'JetBrains Mono',monospace", background: p.inputBg, color: p.violet }}>
                            {versions.length} version{versions.length > 1 ? 's' : ''}
                          </span>
                          <span style={{ color: p.textMuted, fontSize:12, transition:'transform 0.2s',
                            display:'inline-block', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                            ▾
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Versions list */}
                    {isExpanded && (
                      <div style={{ borderTop:`1px solid ${p.borderTint}`, background: p.cardBg }}>
                        {[...versions].reverse().map(v => (
                          <div key={v.version}
                            onClick={() => {
                              setFilename(upload.filename);
                              setRawText(upload.rawText);
                              setParsedItems(v.parsedItems);
                              setSaved(true);
                              setParseError('');
                              setDuplicates([]);
                              setShowResolver(false);
                            }}
                            style={{ padding:'10px 16px', borderBottom:`1px solid ${p.borderTint}`,
                              cursor:'pointer', display:'flex', alignItems:'center', gap:12,
                              transition:'background 0.12s' }}
                            onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = p.inputBg}
                            onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
                          >
                            <span style={{ fontSize:10, fontWeight:700, color: p.violet,
                              fontFamily:"'JetBrains Mono',monospace", background:`${p.violet}14`,
                              border:`1px solid ${p.violet}30`, borderRadius:4, padding:'2px 7px',
                              flexShrink:0 }}>
                              V{v.version}
                            </span>
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ fontSize:11, color: p.textPrimary,
                                fontFamily:"'JetBrains Mono',monospace" }}>
                                {v.parsedItems.length} action{v.parsedItems.length !== 1 ? 's' : ''}
                              </div>
                              <div style={{ fontSize:10, color: p.textMuted, fontFamily:"'Inter',sans-serif", marginTop:1 }}>
                                {fmtDateTime(v.savedAt)}
                              </div>
                            </div>
                            {v.version === versions.length && (
                              <span style={{ fontSize:9, color: p.lime, fontFamily:"'JetBrains Mono',monospace",
                                background:`${p.lime}14`, border:`1px solid ${p.lime}30`,
                                borderRadius:4, padding:'2px 6px', flexShrink:0 }}>
                                LATEST
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Action Table */}
      {parsedItems.length > 0 && (
        <div style={{ marginTop:32 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <h2 style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:22,
                  letterSpacing:'-0.5px', color: p.textPrimary, margin:0 }}>
                  {parsedItems.length} action{parsedItems.length !== 1 ? 's' : ''}
                </h2>
                {duplicates.length > 0 && (
                  <button onClick={() => setShowResolver(v => !v)}
                    style={{ padding:'5px 14px', borderRadius:100, fontSize:11, fontWeight:700, cursor:'pointer',
                      fontFamily:"'JetBrains Mono',monospace", letterSpacing:'0.04em',
                      background:`${p.amber}18`, border:`1px solid ${p.amber}40`, color: p.amber }}>
                    ⚠ {duplicates.length} duplicate{duplicates.length > 1 ? 's' : ''} found
                  </button>
                )}
              </div>
              <p style={{ fontFamily:"'Inter',sans-serif", fontSize:13, color: p.textMuted, margin:'4px 0 0' }}>
                Click any cell to edit inline · add or delete rows below
              </p>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              {saved && (
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color: p.lime,
                  display:'flex', alignItems:'center', gap:5 }}>
                  <span style={{ width:6, height:6, borderRadius:3, background: p.lime,
                    boxShadow: p.glow ? p.glowStr(p.lime, 6) : 'none', display:'inline-block' }} />
                  Saved to dashboard
                </span>
              )}
              <button onClick={handleSave}
                style={{ ...primaryBtnStyle,
                  background: saved ? `linear-gradient(135deg,${p.lime}33,${p.lime}22)` : 'linear-gradient(135deg,#534AB7,#7F77DD)',
                  boxShadow: saved ? (p.glow ? p.glowStr(p.lime, 20) : 'none') : (p.glow ? '0 0 20px rgba(83,74,183,0.45)' : 'none'),
                  color: saved ? p.lime : '#EEEDFE',
                  border: saved ? `1px solid ${p.lime}4D` : 'none',
                }}>
                {saved ? '✓ Actions saved' : '↓ Save actions'}
              </button>
            </div>
          </div>

          <ActionTable items={parsedItems} onEdit={handleEditItem}
            onDelete={handleDeleteRow} onAddRow={handleAddRow} />

          <div style={{ marginTop:10, fontFamily:"'JetBrains Mono',monospace", fontSize:10, color: p.textMuted, textAlign:'right' }}>
            {parsedItems.length} rows · {TABLE_COLS.length} columns · click cell to edit
          </div>

          {/* Duplicate resolver */}
          {showResolver && duplicates.length > 0 && (
            <DuplicateResolver
              pairs={duplicates}
              onDelete={handleDuplicateDelete}
              onMerge={handleMergeOpen}
              onDismiss={() => setShowResolver(false)}
            />
          )}
        </div>
      )}

      {/* Merge modal */}
      {mergeTarget && (
        <MergeModal
          pair={mergeTarget}
          onConfirm={handleMergeConfirm}
          onCancel={() => setMergeTarget(null)}
        />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        select option { background: ${p.cardSolid}; color: ${p.textPrimary}; }
        input[type="date"]::-webkit-calendar-picker-indicator {
          filter: ${p.glow ? 'invert(0.45) sepia(1) hue-rotate(230deg)' : 'none'}; cursor: pointer;
        }
      `}</style>
    </div>
  );
}
