'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { loadState, saveState } from '@/lib/store';
import type { ActionItem, MOMUpload, AppState } from '@/lib/types';

const STATUS_COLORS: Record<ActionItem['status'], string> = {
  'Done': '#B6FF6E',
  'In Progress': '#56E0FF',
  'Blocked': '#FFB089',
  'Pending': '#8B7CFF',
};

const PRIORITY_COLORS: Record<ActionItem['priority'], string> = {
  High: '#FFB089',
  Medium: '#FFCB5C',
  Low: '#B7B3DC',
};

const TYPE_COLORS: Record<ActionItem['type'], string> = {
  Feature: '#56E0FF',
  Bug: '#FFB089',
  Config: '#FFCB5C',
  Risk: '#FF6FD8',
  Decision: '#8B7CFF',
  Other: '#7B7796',
};

const STATUS_OPTIONS: ActionItem['status'][] = ['Pending', 'In Progress', 'Done', 'Blocked'];
const PRIORITY_OPTIONS: ActionItem['priority'][] = ['High', 'Medium', 'Low'];
const TYPE_OPTIONS: ActionItem['type'][] = ['Feature', 'Bug', 'Config', 'Risk', 'Decision', 'Other'];

const TABLE_COLS = [
  { key: 'action', label: 'Action Item', width: 220 },
  { key: 'assignee', label: 'Assignee', width: 100 },
  { key: 'eta', label: 'ETA', width: 100 },
  { key: 'product', label: 'Product', width: 90 },
  { key: 'priority', label: 'Priority', width: 90 },
  { key: 'type', label: 'Type', width: 90 },
  { key: 'status', label: 'Status', width: 110 },
  { key: 'comment', label: 'Comment', width: 160 },
  { key: 'jiraUrl', label: 'Jira URL', width: 130 },
] as const;

type ColKey = (typeof TABLE_COLS)[number]['key'];

function StatusPill({ status }: { status: ActionItem['status'] }) {
  const color = STATUS_COLORS[status];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 100, fontSize: 10,
      fontFamily: "'JetBrains Mono',monospace",
      background: `${color}18`, color, border: `1px solid ${color}30`,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, boxShadow: `0 0 5px ${color}`, display: 'inline-block' }} />
      {status}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: ActionItem['priority'] }) {
  const color = PRIORITY_COLORS[priority];
  const icon = priority === 'High' ? '▲' : priority === 'Medium' ? '●' : '▽';
  return (
    <span style={{ color, fontFamily: "'JetBrains Mono',monospace", fontSize: 11 }}>
      {icon} {priority}
    </span>
  );
}

function TypeBadge({ type }: { type: ActionItem['type'] }) {
  const color = TYPE_COLORS[type];
  return (
    <span style={{
      display: 'inline-block', padding: '2px 7px', borderRadius: 6, fontSize: 10,
      fontFamily: "'JetBrains Mono',monospace",
      background: `${color}18`, color, border: `1px solid ${color}30`,
    }}>
      {type}
    </span>
  );
}

interface EditableCellProps {
  value: string;
  col: ColKey;
  rowId: string;
  onEdit: (id: string, col: ColKey, value: string) => void;
}

function EditableCell({ value, col, rowId, onEdit }: EditableCellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);

  useEffect(() => { setDraft(value); }, [value]);

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  const commit = useCallback(() => {
    setEditing(false);
    if (draft !== value) onEdit(rowId, col, draft);
  }, [draft, value, rowId, col, onEdit]);

  const cellStyle: React.CSSProperties = {
    padding: '6px 10px', fontSize: 11, fontFamily: "'JetBrains Mono',monospace",
    color: '#EEEDFE', verticalAlign: 'middle', whiteSpace: 'nowrap',
    cursor: 'pointer', minWidth: 60,
  };

  const inputStyle: React.CSSProperties = {
    background: 'rgba(139,124,255,0.1)', border: '1px solid rgba(139,124,255,0.4)',
    borderRadius: 6, color: '#EEEDFE', fontFamily: "'JetBrains Mono',monospace",
    fontSize: 11, padding: '2px 6px', outline: 'none', width: '100%', boxSizing: 'border-box',
  };

  if (col === 'status') {
    return (
      <td style={cellStyle} onClick={() => setEditing(true)}>
        {editing ? (
          <select
            ref={inputRef as React.RefObject<HTMLSelectElement>}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commit}
            style={{ ...inputStyle, cursor: 'pointer' }}
          >
            {STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : (
          <StatusPill status={draft as ActionItem['status']} />
        )}
      </td>
    );
  }

  if (col === 'priority') {
    return (
      <td style={cellStyle} onClick={() => setEditing(true)}>
        {editing ? (
          <select
            ref={inputRef as React.RefObject<HTMLSelectElement>}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commit}
            style={{ ...inputStyle, cursor: 'pointer' }}
          >
            {PRIORITY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : (
          <PriorityBadge priority={draft as ActionItem['priority']} />
        )}
      </td>
    );
  }

  if (col === 'type') {
    return (
      <td style={cellStyle} onClick={() => setEditing(true)}>
        {editing ? (
          <select
            ref={inputRef as React.RefObject<HTMLSelectElement>}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commit}
            style={{ ...inputStyle, cursor: 'pointer' }}
          >
            {TYPE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : (
          <TypeBadge type={draft as ActionItem['type']} />
        )}
      </td>
    );
  }

  if (col === 'jiraUrl') {
    return (
      <td style={cellStyle} onClick={() => setEditing(true)}>
        {editing ? (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(value); setEditing(false); } }}
            style={inputStyle}
            placeholder="https://..."
          />
        ) : draft ? (
          <a href={draft} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
            style={{ color: '#8B7CFF', textDecoration: 'underline', fontSize: 11, fontFamily: "'JetBrains Mono',monospace" }}>
            {draft.replace(/^https?:\/\//, '').slice(0, 24)}{draft.length > 30 ? '…' : ''}
          </a>
        ) : (
          <span style={{ color: '#7B7796', fontSize: 10 }}>+ add</span>
        )}
      </td>
    );
  }

  return (
    <td style={cellStyle} onClick={() => setEditing(true)}>
      {editing ? (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(value); setEditing(false); } }}
          style={inputStyle}
        />
      ) : (
        <span style={{ color: col === 'action' ? '#EEEDFE' : '#B7B3DC' }}>
          {draft || <span style={{ color: '#7B7796', fontSize: 10 }}>—</span>}
        </span>
      )}
    </td>
  );
}

interface ActionTableProps {
  items: ActionItem[];
  onEdit: (id: string, col: ColKey, value: string) => void;
}

function ActionTable({ items, onEdit }: ActionTableProps) {
  return (
    <div style={{ overflowX: 'auto', borderRadius: 14, border: '1px solid rgba(139,124,255,0.18)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
        <thead>
          <tr style={{ background: 'rgba(139,124,255,0.06)', borderBottom: '1px solid rgba(139,124,255,0.15)' }}>
            {TABLE_COLS.map(col => (
              <th key={col.key} style={{
                padding: '10px 10px', textAlign: 'left', fontSize: 10, fontWeight: 600,
                letterSpacing: '0.07em', textTransform: 'uppercase', color: '#7B7796',
                fontFamily: "'JetBrains Mono',monospace", whiteSpace: 'nowrap',
                minWidth: col.width,
              }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={item.id} style={{
              borderBottom: '1px solid rgba(139,124,255,0.08)',
              background: i % 2 === 0 ? 'transparent' : 'rgba(139,124,255,0.02)',
              transition: 'background 0.15s',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(139,124,255,0.07)')}
              onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(139,124,255,0.02)')}
            >
              {TABLE_COLS.map(col => (
                <EditableCell
                  key={col.key}
                  value={String(item[col.key] ?? '')}
                  col={col.key}
                  rowId={item.id}
                  onEdit={onEdit}
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function WorkbenchPage() {
  const [appState, setAppState] = useState<AppState | null>(null);
  const [rawText, setRawText] = useState('');
  const [filename, setFilename] = useState('');
  const [parsedItems, setParsedItems] = useState<ActionItem[]>([]);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setAppState(loadState());
  }, []);

  const readFile = useCallback((file: File) => {
    if (!file.name.endsWith('.txt')) {
      setParseError('Only .txt files are supported.');
      return;
    }
    setParseError('');
    setParsedItems([]);
    setSaved(false);
    const reader = new FileReader();
    reader.onload = e => {
      setRawText((e.target?.result as string) || '');
      setFilename(file.name);
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) readFile(file);
  }, [readFile]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragging(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) readFile(file);
  }, [readFile]);

  const handleParseWithAI = useCallback(async () => {
    if (!rawText.trim()) return;
    setParsing(true);
    setParseError('');
    try {
      const res = await fetch('/api/parse-mom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: rawText, filename, model: loadState().selectedModel }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.items)) {
        const items: ActionItem[] = data.items.map((item: Partial<ActionItem>) => ({
          id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Date.now().toString() + Math.random(),
          action: item.action ?? '',
          assignee: item.assignee ?? '',
          eta: item.eta ?? '',
          product: item.product ?? '',
          priority: (['High', 'Medium', 'Low'].includes(item.priority ?? '') ? item.priority : 'Medium') as ActionItem['priority'],
          type: (['Feature', 'Bug', 'Config', 'Risk', 'Decision', 'Other'].includes(item.type ?? '') ? item.type : 'Other') as ActionItem['type'],
          status: (['Pending', 'In Progress', 'Done', 'Blocked'].includes(item.status ?? '') ? item.status : 'Pending') as ActionItem['status'],
          comment: item.comment ?? '',
          jiraUrl: item.jiraUrl ?? '',
        }));
        setParsedItems(items);
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

  const handleSave = useCallback(() => {
    if (!appState || parsedItems.length === 0) return;
    const upload: MOMUpload = {
      id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Date.now().toString(),
      filename,
      uploadedAt: new Date().toISOString(),
      projectId: appState.activeProjectId,
      rawText,
      parsedItems,
    };
    const newState: AppState = {
      ...appState,
      actionItems: [...appState.actionItems, ...parsedItems],
      momUploads: [upload, ...(appState.momUploads || [])],
    };
    saveState(newState);
    setAppState(newState);
    setSaved(true);
  }, [appState, parsedItems, filename, rawText]);

  const recentUploads = appState?.momUploads?.slice(0, 6) ?? [];

  const cardStyle: React.CSSProperties = {
    background: 'rgba(28,28,36,0.8)',
    border: '1px solid rgba(139,124,255,0.18)',
    borderRadius: 16,
    padding: 24,
  };

  const dropzoneStyle: React.CSSProperties = {
    border: dragging
      ? '2px dashed rgba(139,124,255,0.7)'
      : '2px dashed rgba(139,124,255,0.3)',
    borderRadius: 14,
    padding: '36px 24px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
    background: dragging ? 'rgba(139,124,255,0.07)' : 'rgba(139,124,255,0.02)',
    boxShadow: dragging ? '0 0 28px rgba(139,124,255,0.18)' : 'none',
    marginBottom: rawText ? 20 : 0,
  };

  const primaryBtnStyle: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '10px 22px', borderRadius: 10, fontWeight: 600, fontSize: 14,
    color: '#EEEDFE', background: 'linear-gradient(135deg,#534AB7,#7F77DD)',
    boxShadow: '0 0 20px rgba(83,74,183,0.45)', border: 'none', cursor: 'pointer',
    fontFamily: "'Space Grotesk',sans-serif", transition: 'all 0.2s',
  };

  return (
    <div style={{ background: '#1C1C24', minHeight: '100vh', padding: '32px 40px', color: '#EEEDFE' }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{
          fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 32,
          letterSpacing: '-1px', color: '#EEEDFE', margin: 0, marginBottom: 6,
        }}>
          Workbench
          <span style={{ marginLeft: 12, display: 'inline-block', width: 8, height: 8, borderRadius: 4, background: '#B6FF6E', boxShadow: '0 0 10px #B6FF6E', verticalAlign: 'middle' }} />
        </h1>
        <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, color: '#7B7796', margin: 0 }}>
          Upload a meeting notes file, parse it with AI, and turn actions into a live tracker.
        </p>
      </div>

      {/* Upload + Recent grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, alignItems: 'start' }}>

        {/* Drop Zone */}
        <div style={cardStyle}>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 15, color: '#EEEDFE', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 6, height: 6, borderRadius: 3, background: '#8B7CFF', boxShadow: '0 0 8px #8B7CFF', display: 'inline-block' }} />
            Upload MOM File
          </div>

          <div
            style={dropzoneStyle}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
          >
            <div style={{ fontSize: 32, marginBottom: 10 }}>📄</div>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 15, color: dragging ? '#8B7CFF' : '#EEEDFE', marginBottom: 6 }}>
              {dragging ? 'Drop to upload' : 'Drag & drop a .txt file'}
            </div>
            <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: '#7B7796' }}>
              or click to browse — .txt files only
            </div>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept=".txt"
            style={{ display: 'none' }}
            onChange={handleFileInput}
          />

          {parseError && (
            <div style={{
              marginTop: 12, padding: '10px 14px', borderRadius: 10,
              background: 'rgba(240,153,123,0.12)', border: '1px solid rgba(240,153,123,0.3)',
              color: '#F0997B', fontFamily: "'JetBrains Mono',monospace", fontSize: 12,
            }}>
              {parseError}
            </div>
          )}

          {rawText && (
            <div style={{ marginTop: rawText ? 20 : 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: '#F0997B' }}>
                    {filename}
                  </span>
                  <span style={{ fontSize: 10, color: '#7B7796', fontFamily: "'JetBrains Mono',monospace" }}>
                    {rawText.length.toLocaleString()} chars
                  </span>
                </div>
                <button
                  onClick={handleParseWithAI}
                  disabled={parsing}
                  style={{
                    ...primaryBtnStyle,
                    opacity: parsing ? 0.7 : 1,
                    cursor: parsing ? 'not-allowed' : 'pointer',
                  }}
                >
                  {parsing ? (
                    <>
                      <span style={{
                        display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)',
                        borderTopColor: '#EEEDFE', borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                      }} />
                      Parsing…
                    </>
                  ) : (
                    <>✦ Parse with AI</>
                  )}
                </button>
              </div>

              <div style={{
                maxHeight: 220, overflowY: 'auto', padding: '14px 16px', borderRadius: 10,
                background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(139,124,255,0.12)',
                fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: '#7B7796',
                lineHeight: 1.65, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              }}>
                {rawText}
              </div>
            </div>
          )}

          {!rawText && (
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
              <button
                onClick={handleParseWithAI}
                disabled
                style={{ ...primaryBtnStyle, opacity: 0.35, cursor: 'not-allowed' }}
              >
                ✦ Parse with AI
              </button>
            </div>
          )}
        </div>

        {/* Recent Uploads */}
        <div style={cardStyle}>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 15, color: '#EEEDFE', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 6, height: 6, borderRadius: 3, background: '#F0997B', boxShadow: '0 0 8px #F0997B', display: 'inline-block' }} />
            Recent Uploads
          </div>

          {recentUploads.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '32px 16px',
              fontFamily: "'Inter',sans-serif", fontSize: 13, color: '#7B7796',
            }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>📂</div>
              No uploads yet. Parse a MOM file to get started.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recentUploads.map(upload => {
                const date = new Date(upload.uploadedAt);
                const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                return (
                  <div key={upload.id} style={{
                    padding: '12px 14px', borderRadius: 10,
                    background: 'rgba(139,124,255,0.05)', border: '1px solid rgba(139,124,255,0.12)',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLDivElement).style.background = 'rgba(139,124,255,0.1)';
                      (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(139,124,255,0.25)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLDivElement).style.background = 'rgba(139,124,255,0.05)';
                      (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(139,124,255,0.12)';
                    }}
                    onClick={() => {
                      setFilename(upload.filename);
                      setRawText(upload.rawText);
                      setParsedItems(upload.parsedItems);
                      setSaved(true);
                      setParseError('');
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: '#F0997B', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {upload.filename}
                        </div>
                        <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: '#7B7796' }}>
                          {upload.parsedItems.length} action{upload.parsedItems.length !== 1 ? 's' : ''} · {dateStr} {timeStr}
                        </div>
                      </div>
                      <span style={{
                        flexShrink: 0, padding: '2px 7px', borderRadius: 6, fontSize: 10,
                        fontFamily: "'JetBrains Mono',monospace",
                        background: 'rgba(139,124,255,0.15)', color: '#8B7CFF',
                      }}>
                        {upload.projectId}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Action Table */}
      {parsedItems.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h2 style={{
                fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 22,
                letterSpacing: '-0.5px', color: '#EEEDFE', margin: 0, marginBottom: 4,
              }}>
                {parsedItems.length} action{parsedItems.length !== 1 ? 's' : ''} extracted
              </h2>
              <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: '#7B7796', margin: 0 }}>
                Click any cell to edit inline. Save when ready.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {saved && (
                <span style={{
                  fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: '#B6FF6E',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: 3, background: '#B6FF6E', boxShadow: '0 0 6px #B6FF6E', display: 'inline-block' }} />
                  Saved to dashboard
                </span>
              )}
              <button
                onClick={handleSave}
                style={{
                  ...primaryBtnStyle,
                  background: saved
                    ? 'linear-gradient(135deg,rgba(182,255,110,0.2),rgba(182,255,110,0.15))'
                    : 'linear-gradient(135deg,#534AB7,#7F77DD)',
                  boxShadow: saved ? '0 0 20px rgba(182,255,110,0.2)' : '0 0 20px rgba(83,74,183,0.45)',
                  color: saved ? '#B6FF6E' : '#EEEDFE',
                  border: saved ? '1px solid rgba(182,255,110,0.3)' : 'none',
                }}
              >
                {saved ? '✓ Actions saved' : '↓ Save actions'}
              </button>
            </div>
          </div>

          <div style={{
            background: 'rgba(28,28,36,0.8)',
            border: '1px solid rgba(139,124,255,0.18)',
            borderRadius: 16,
            overflow: 'hidden',
          }}>
            <ActionTable items={parsedItems} onEdit={handleEditItem} />
          </div>

          <div style={{ marginTop: 12, fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: '#7B7796', textAlign: 'right' }}>
            {parsedItems.length} rows · {TABLE_COLS.length} columns · click cell to edit
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        select option {
          background: #1C1C24;
          color: #EEEDFE;
        }
      `}</style>
    </div>
  );
}
