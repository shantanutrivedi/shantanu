'use client';

import { useState, useEffect, useCallback } from 'react';
import { loadState, saveState } from '@/lib/store';
import type { AppState, DailyActivity, Project } from '@/lib/types';

// ── Palette ───────────────────────────────────────────────────────────────────
const TYPE_COLORS: Record<DailyActivity['type'], string> = {
  Feature: '#56E0FF',
  Bug:     '#FFB089',
  Config:  '#FFCB5C',
  Meeting: '#8B7CFF',
  Other:   '#B7B3DC',
};

const ACTIVITY_TYPES: DailyActivity['type'][] = ['Feature', 'Bug', 'Config', 'Meeting', 'Other'];

// ── Helpers ───────────────────────────────────────────────────────────────────
function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  d.setDate(d.getDate() - ((day + 6) % 7)); // Mon-start week
  return d;
}

function isThisWeek(dateStr: string): boolean {
  const d = new Date(dateStr + 'T00:00:00');
  const weekStart = getWeekStart(new Date());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);
  return d >= weekStart && d < weekEnd;
}

function formatDateGroupLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.getTime() === today.getTime()) return 'TODAY';
  if (d.getTime() === yesterday.getTime()) return 'YESTERDAY';
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase();
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: DailyActivity['type'] }) {
  const color = TYPE_COLORS[type];
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 9px',
      borderRadius: 100,
      fontSize: 11,
      fontFamily: "'JetBrains Mono',monospace",
      fontWeight: 600,
      letterSpacing: '0.04em',
      background: `${color}18`,
      color,
      border: `1px solid ${color}38`,
      whiteSpace: 'nowrap',
    }}>
      {type}
    </span>
  );
}

function StatCard({
  label,
  value,
  color = '#8B7CFF',
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div style={{
      background: 'rgba(28,28,36,0.8)',
      border: `1px solid ${color}22`,
      borderRadius: 12,
      padding: '14px 18px',
      flex: 1,
      minWidth: 0,
    }}>
      <div style={{
        fontFamily: "'JetBrains Mono',monospace",
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: '#7B7796',
        marginBottom: 6,
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: "'Space Grotesk',sans-serif",
        fontWeight: 700,
        fontSize: 28,
        letterSpacing: '-0.5px',
        color,
        textShadow: `0 0 18px ${color}60`,
        lineHeight: 1,
      }}>
        {value}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ActivityPage() {
  const [appState, setAppState] = useState<AppState | null>(null);

  // Form fields
  const [date, setDate] = useState<string>(todayISO());
  const [team, setTeam] = useState<string>('');
  const [activity, setActivity] = useState<string>('');
  const [type, setType] = useState<DailyActivity['type']>('Feature');
  const [hours, setHours] = useState<number>(1);
  const [productInput, setProductInput] = useState<string>('');

  const [submitting, setSubmitting] = useState(false);
  const [flash, setFlash] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const state = loadState();
    setAppState(state);
    const active = state.projects.find((p: Project) => p.id === state.activeProjectId);
    if (active) setProductInput(active.name);

    function onProjectChange() {
      const s = loadState();
      setAppState(s);
      const p = s.projects.find((pr: Project) => pr.id === s.activeProjectId);
      if (p) setProductInput(p.name);
    }
    window.addEventListener('shantanu-project-change', onProjectChange);
    return () => window.removeEventListener('shantanu-project-change', onProjectChange);
  }, []);

  const activeProject = appState?.projects.find((p: Project) => p.id === appState.activeProjectId);

  const projectActivities: DailyActivity[] = (appState?.activities ?? [])
    .filter((a: DailyActivity) => a.projectId === appState?.activeProjectId)
    .sort((a: DailyActivity, b: DailyActivity) => b.date.localeCompare(a.date));

  // Stats — current week
  const weekActivities = projectActivities.filter(a => isThisWeek(a.date));
  const weekBugs     = weekActivities.filter(a => a.type === 'Bug').length;
  const weekFeatures = weekActivities.filter(a => a.type === 'Feature').length;
  const weekHours    = weekActivities.reduce((sum, a) => sum + a.hours, 0);

  // Group by date
  const grouped = projectActivities.reduce<Record<string, DailyActivity[]>>((acc, a) => {
    if (!acc[a.date]) acc[a.date] = [];
    acc[a.date].push(a);
    return acc;
  }, {});
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  const validate = useCallback((): boolean => {
    const errs: Record<string, string> = {};
    if (!team.trim())     errs.team = 'Required';
    if (!activity.trim()) errs.activity = 'Required';
    if (!date)            errs.date = 'Required';
    if (hours <= 0)       errs.hours = 'Must be > 0';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }, [team, activity, date, hours]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !appState) return;
    setSubmitting(true);

    const newEntry: DailyActivity = {
      id: Date.now().toString(),
      date,
      projectId: appState.activeProjectId,
      team: team.trim(),
      activity: activity.trim(),
      type,
      hours,
      createdAt: new Date().toISOString(),
    };

    const updated: AppState = {
      ...appState,
      activities: [...(appState.activities ?? []), newEntry],
    };
    saveState(updated);
    setAppState(updated);

    // Reset form
    setDate(todayISO());
    setTeam('');
    setActivity('');
    setType('Feature');
    setHours(1);
    setFieldErrors({});
    setSubmitting(false);
    setFlash(true);
    setTimeout(() => setFlash(false), 1500);
  }, [validate, appState, date, team, activity, type, hours]);

  // ── Styles ──────────────────────────────────────────────────────────────────

  const inputBase: React.CSSProperties = {
    background: 'rgba(139,124,255,0.06)',
    border: '1px solid rgba(139,124,255,0.18)',
    borderRadius: 8,
    padding: '8px 12px',
    color: '#EEEDFE',
    width: '100%',
    fontFamily: "'Inter',sans-serif",
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  };

  const errorInputStyle: React.CSSProperties = {
    borderColor: 'rgba(240,153,123,0.55)',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontFamily: "'JetBrains Mono',monospace",
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#7B7796',
    marginBottom: 6,
  };

  const errMsgStyle: React.CSSProperties = {
    fontFamily: "'JetBrains Mono',monospace",
    fontSize: 10,
    color: '#F0997B',
    marginTop: 4,
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ background: '#1C1C24', minHeight: '100vh', color: '#EEEDFE', position: 'relative' }}>
      {/* Ambient glow */}
      <div style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        background: 'radial-gradient(ellipse at 10% 0%, rgba(139,124,255,0.22), transparent 50%), radial-gradient(ellipse at 90% 80%, rgba(240,153,123,0.1), transparent 45%)',
      }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 920, margin: '0 auto', padding: '36px 32px 80px' }}>

        {/* Page header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{
            fontFamily: "'JetBrains Mono',monospace",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#8B7CFF',
            marginBottom: 8,
          }}>
            {activeProject ? activeProject.name : 'Project'} · Daily Log
          </div>
          <h1 style={{
            fontFamily: "'Space Grotesk',sans-serif",
            fontWeight: 700,
            fontSize: 32,
            letterSpacing: '-0.8px',
            color: '#EEEDFE',
            margin: 0,
          }}>
            Activity Log
          </h1>
          <p style={{ fontSize: 14, color: '#7B7796', marginTop: 6, fontFamily: "'Inter',sans-serif" }}>
            Record what the team shipped, fixed, and discussed each day.
          </p>
        </div>

        {/* ── Form card ─────────────────────────────────────────────────────── */}
        <form
          onSubmit={handleSubmit}
          noValidate
          style={{
            background: 'rgba(28,28,36,0.8)',
            border: '1px solid rgba(139,124,255,0.18)',
            borderRadius: 16,
            padding: 28,
            marginBottom: 32,
            boxShadow: '0 8px 40px rgba(0,0,0,0.35)',
          }}
        >
          <div style={{
            fontFamily: "'Space Grotesk',sans-serif",
            fontWeight: 600,
            fontSize: 15,
            color: '#EEEDFE',
            marginBottom: 22,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <span style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              background: '#8B7CFF',
              boxShadow: '0 0 9px #8B7CFF',
              display: 'inline-block',
            }} />
            Log an Activity
          </div>

          {/* Row 1: Date · Member · Hours */}
          <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr 120px', gap: 14, marginBottom: 14 }}>
            <div>
              <label style={labelStyle}>Date</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
                style={{ ...inputBase, colorScheme: 'dark', ...(fieldErrors.date ? errorInputStyle : {}) }}
              />
              {fieldErrors.date && <div style={errMsgStyle}>{fieldErrors.date}</div>}
            </div>

            <div>
              <label style={labelStyle}>Team Member</label>
              <input
                type="text"
                value={team}
                onChange={e => setTeam(e.target.value)}
                placeholder="e.g. Riya"
                style={{ ...inputBase, ...(fieldErrors.team ? errorInputStyle : {}) }}
              />
              {fieldErrors.team && <div style={errMsgStyle}>{fieldErrors.team}</div>}
            </div>

            <div>
              <label style={labelStyle}>Hours</label>
              <input
                type="number"
                value={hours}
                onChange={e => setHours(parseFloat(e.target.value) || 0)}
                min={0.5}
                max={24}
                step={0.5}
                style={{ ...inputBase, ...(fieldErrors.hours ? errorInputStyle : {}) }}
              />
              {fieldErrors.hours && <div style={errMsgStyle}>{fieldErrors.hours}</div>}
            </div>
          </div>

          {/* Row 2: Activity description */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Activity Description</label>
            <textarea
              value={activity}
              onChange={e => setActivity(e.target.value)}
              placeholder="What did the team work on? Be specific — this feeds the weekly summary."
              rows={3}
              style={{
                ...inputBase,
                resize: 'vertical',
                lineHeight: 1.55,
                ...(fieldErrors.activity ? errorInputStyle : {}),
              }}
            />
            {fieldErrors.activity && <div style={errMsgStyle}>{fieldErrors.activity}</div>}
          </div>

          {/* Row 3: Type · Product */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
            <div>
              <label style={labelStyle}>Type</label>
              <select
                value={type}
                onChange={e => setType(e.target.value as DailyActivity['type'])}
                style={{ ...inputBase, cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none' }}
              >
                {ACTIVITY_TYPES.map(t => (
                  <option key={t} value={t} style={{ background: '#1C1C24' }}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Product / Project</label>
              <input
                type="text"
                value={productInput}
                onChange={e => setProductInput(e.target.value)}
                placeholder="Which product?"
                style={inputBase}
                list="project-datalist"
              />
              <datalist id="project-datalist">
                {(appState?.projects ?? []).map((p: Project) => (
                  <option key={p.id} value={p.name} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Submit */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              type="submit"
              disabled={submitting}
              style={{
                background: 'linear-gradient(135deg,#534AB7,#7F77DD)',
                border: 'none',
                borderRadius: 12,
                padding: '10px 28px',
                color: '#EEEDFE',
                fontFamily: "'Space Grotesk',sans-serif",
                fontWeight: 700,
                fontSize: 14,
                cursor: submitting ? 'not-allowed' : 'pointer',
                boxShadow: '0 0 22px rgba(83,74,183,0.5)',
                opacity: submitting ? 0.7 : 1,
                transition: 'opacity 0.2s, box-shadow 0.2s',
                letterSpacing: '-0.2px',
              }}
            >
              {submitting ? 'Logging…' : 'Log Activity'}
            </button>

            {flash && (
              <span style={{
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: 12,
                color: '#B6FF6E',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}>
                <span style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  background: '#B6FF6E',
                  boxShadow: '0 0 8px #B6FF6E',
                  display: 'inline-block',
                }} />
                Saved to activity log
              </span>
            )}
          </div>
        </form>

        {/* ── Stats row ─────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
          <StatCard label="Entries this week" value={weekActivities.length} color="#8B7CFF" />
          <StatCard label="Bugs logged"       value={weekBugs}             color={weekBugs > 0 ? '#FFB089' : '#7B7796'} />
          <StatCard label="Features"          value={weekFeatures}         color={weekFeatures > 0 ? '#56E0FF' : '#7B7796'} />
          <StatCard label="Hours this week"   value={`${weekHours % 1 === 0 ? weekHours : weekHours.toFixed(1)}h`} color="#B6FF6E" />
        </div>

        {/* ── Activity log ──────────────────────────────────────────────────── */}
        <div>
          <div style={{
            fontFamily: "'Space Grotesk',sans-serif",
            fontWeight: 600,
            fontSize: 15,
            color: '#EEEDFE',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            Log
            <span style={{
              background: 'rgba(139,124,255,0.15)',
              borderRadius: 100,
              padding: '2px 10px',
              fontSize: 12,
              fontFamily: "'JetBrains Mono',monospace",
              color: '#8B7CFF',
            }}>
              {projectActivities.length}
            </span>
          </div>

          {sortedDates.length === 0 && (
            <div style={{
              background: 'rgba(28,28,36,0.6)',
              border: '1px solid rgba(139,124,255,0.1)',
              borderRadius: 12,
              padding: '36px 24px',
              textAlign: 'center',
              color: '#7B7796',
              fontSize: 14,
              fontFamily: "'Inter',sans-serif",
            }}>
              No activities logged yet. Use the form above to record today's work.
            </div>
          )}

          {sortedDates.map(d => (
            <div key={d} style={{ marginBottom: 26 }}>
              {/* Date group header */}
              <div style={{
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#7B7796',
                marginBottom: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}>
                {formatDateGroupLabel(d)}
                <div style={{ flex: 1, height: 1, background: 'rgba(139,124,255,0.1)' }} />
                <span style={{ color: '#534AB7', fontSize: 10 }}>
                  {grouped[d].reduce((s, a) => s + a.hours, 0).toFixed(1)}h
                </span>
              </div>

              {grouped[d].map(entry => (
                <div
                  key={entry.id}
                  style={{
                    border: '1px solid rgba(139,124,255,0.1)',
                    borderRadius: 10,
                    padding: '12px 16px',
                    marginBottom: 8,
                    background: 'rgba(28,28,36,0.5)',
                    display: 'grid',
                    gridTemplateColumns: 'auto 1fr auto',
                    gap: 14,
                    alignItems: 'center',
                    transition: 'background 0.15s, border-color 0.15s',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.background = 'rgba(139,124,255,0.06)';
                    el.style.borderColor = 'rgba(139,124,255,0.22)';
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.background = 'rgba(28,28,36,0.5)';
                    el.style.borderColor = 'rgba(139,124,255,0.1)';
                  }}
                >
                  <TypeBadge type={entry.type} />

                  <div>
                    <div style={{
                      fontFamily: "'Inter',sans-serif",
                      fontSize: 14,
                      color: '#EEEDFE',
                      lineHeight: 1.45,
                      marginBottom: 3,
                    }}>
                      {entry.activity}
                    </div>
                    <div style={{
                      fontFamily: "'JetBrains Mono',monospace",
                      fontSize: 11,
                      color: '#7B7796',
                    }}>
                      {entry.team}
                    </div>
                  </div>

                  <div style={{
                    fontFamily: "'JetBrains Mono',monospace",
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#B7B3DC',
                    whiteSpace: 'nowrap',
                    textAlign: 'right',
                  }}>
                    {entry.hours % 1 === 0 ? entry.hours : entry.hours.toFixed(1)}h
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <style>{`
        input[type="date"]::-webkit-calendar-picker-indicator {
          filter: invert(0.45) sepia(1) hue-rotate(230deg);
          cursor: pointer;
        }
        select option { background: #1C1C24; color: #EEEDFE; }
        input::placeholder, textarea::placeholder { color: #3D3D52; }
        input:focus, textarea:focus, select:focus {
          border-color: rgba(139,124,255,0.45) !important;
          box-shadow: 0 0 0 3px rgba(139,124,255,0.1);
        }
      `}</style>
    </div>
  );
}
