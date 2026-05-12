'use client';

import { useState, useEffect, useCallback } from 'react';
import { loadState, saveState, onUserChange } from '@/lib/store';
import { usePalette } from '@/lib/palette';
import type { AppState, DailyActivity, Project } from '@/lib/types';

// ── Type color maps ───────────────────────────────────────────────────────────
const TYPE_COLORS_DARK: Record<DailyActivity['type'], string> = {
  Feature: '#56E0FF',
  Bug:     '#FFB089',
  Config:  '#FFCB5C',
  Meeting: '#8B7CFF',
  Other:   '#B7B3DC',
};

const TYPE_COLORS_LIGHT: Record<DailyActivity['type'], string> = {
  Feature: '#007FAA',
  Bug:     '#D9614A',
  Config:  '#A06800',
  Meeting: '#5548D9',
  Other:   '#7B7796',
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
  const p = usePalette();
  const color = p.glow ? TYPE_COLORS_DARK[type] : TYPE_COLORS_LIGHT[type];
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
  color,
}: {
  label: string;
  value: string | number;
  color: string;
}) {
  const p = usePalette();
  return (
    <div style={{
      background: p.cardBg,
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
        color: p.textMuted,
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
        textShadow: p.glow ? `0 0 18px ${color}60` : undefined,
        lineHeight: 1,
      }}>
        {value}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ActivityPage() {
  const p = usePalette();
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
    function sync() {
      const state = loadState();
      setAppState(state);
      const active = state.projects.find((pr: Project) => pr.id === state.activeProjectId);
      if (active) setProductInput(active.name);
    }
    sync();
    window.addEventListener('shantanu-project-change', sync);
    const unsub = onUserChange(sync);
    return () => {
      window.removeEventListener('shantanu-project-change', sync);
      unsub();
    };
  }, []);

  const activeProject = appState?.projects.find((pr: Project) => pr.id === appState.activeProjectId);

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
    background: p.inputBg,
    border: `1px solid ${p.border}`,
    borderRadius: 8,
    padding: '8px 12px',
    color: p.textPrimary,
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
    color: p.textMuted,
    marginBottom: 6,
  };

  const errMsgStyle: React.CSSProperties = {
    fontFamily: "'JetBrains Mono',monospace",
    fontSize: 10,
    color: p.coral,
    marginTop: 4,
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ background: p.pageBg, minHeight: '100vh', color: p.textPrimary, position: 'relative' }}>
      {/* Ambient glow */}
      {p.glow && (
        <div style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          background: 'radial-gradient(ellipse at 10% 0%, rgba(139,124,255,0.22), transparent 50%), radial-gradient(ellipse at 90% 80%, rgba(240,153,123,0.1), transparent 45%)',
        }} />
      )}

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 920, margin: '0 auto', padding: '36px 32px 80px' }}>

        {/* Page header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{
            fontFamily: "'JetBrains Mono',monospace",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: p.violet,
            marginBottom: 8,
          }}>
            {activeProject ? activeProject.name : 'Project'} · Daily Log
          </div>
          <h1 style={{
            fontFamily: "'Space Grotesk',sans-serif",
            fontWeight: 700,
            fontSize: 32,
            letterSpacing: '-0.8px',
            color: p.textPrimary,
            margin: 0,
            textShadow: p.glow ? p.glowStr(p.violet, 24) : undefined,
          }}>
            Activity Log
          </h1>
          <p style={{ fontSize: 14, color: p.textMuted, marginTop: 6, fontFamily: "'Inter',sans-serif" }}>
            Record what the team shipped, fixed, and discussed each day.
          </p>
        </div>

        {/* ── Form card ─────────────────────────────────────────────────────── */}
        <form
          onSubmit={handleSubmit}
          noValidate
          style={{
            background: p.cardBg,
            border: `1px solid ${p.border}`,
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
            color: p.textPrimary,
            marginBottom: 22,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <span style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              background: p.violet,
              boxShadow: p.glow ? p.glowStr(p.violet, 9) : 'none',
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
                style={{ ...inputBase, colorScheme: p.glow ? 'dark' : 'light', ...(fieldErrors.date ? errorInputStyle : {}) }}
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
                  <option key={t} value={t} style={{ background: p.cardSolid, color: p.textPrimary }}>{t}</option>
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
                {(appState?.projects ?? []).map((pr: Project) => (
                  <option key={pr.id} value={pr.name} />
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
                boxShadow: p.glow ? '0 0 22px rgba(83,74,183,0.5)' : 'none',
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
                color: p.lime,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}>
                <span style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  background: p.lime,
                  boxShadow: p.glow ? p.glowStr(p.lime, 8) : 'none',
                  display: 'inline-block',
                }} />
                Saved to activity log
              </span>
            )}
          </div>
        </form>

        {/* ── Stats row ─────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
          <StatCard label="Entries this week" value={weekActivities.length} color={p.violet} />
          <StatCard label="Bugs logged"       value={weekBugs}             color={weekBugs > 0 ? p.coral : p.textMuted} />
          <StatCard label="Features"          value={weekFeatures}         color={weekFeatures > 0 ? p.cyan : p.textMuted} />
          <StatCard label="Hours this week"   value={`${weekHours % 1 === 0 ? weekHours : weekHours.toFixed(1)}h`} color={p.lime} />
        </div>

        {/* ── Activity log ──────────────────────────────────────────────────── */}
        <div>
          <div style={{
            fontFamily: "'Space Grotesk',sans-serif",
            fontWeight: 600,
            fontSize: 15,
            color: p.textPrimary,
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            Log
            <span style={{
              background: p.inputBg,
              borderRadius: 100,
              padding: '2px 10px',
              fontSize: 12,
              fontFamily: "'JetBrains Mono',monospace",
              color: p.violet,
            }}>
              {projectActivities.length}
            </span>
          </div>

          {sortedDates.length === 0 && (
            <div style={{
              background: p.cardBg,
              border: `1px solid ${p.borderTint}`,
              borderRadius: 12,
              padding: '36px 24px',
              textAlign: 'center',
              color: p.textMuted,
              fontSize: 14,
              fontFamily: "'Inter',sans-serif",
            }}>
              No activities logged yet. Use the form above to record today&apos;s work.
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
                color: p.textMuted,
                marginBottom: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}>
                {formatDateGroupLabel(d)}
                <div style={{ flex: 1, height: 1, background: p.borderTint }} />
                <span style={{ color: p.midViolet, fontSize: 10 }}>
                  {grouped[d].reduce((s, a) => s + a.hours, 0).toFixed(1)}h
                </span>
              </div>

              {grouped[d].map(entry => (
                <div
                  key={entry.id}
                  style={{
                    border: `1px solid ${p.borderTint}`,
                    borderRadius: 10,
                    padding: '12px 16px',
                    marginBottom: 8,
                    background: p.cardBg,
                    display: 'grid',
                    gridTemplateColumns: 'auto 1fr auto',
                    gap: 14,
                    alignItems: 'center',
                    transition: 'background 0.15s, border-color 0.15s',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.background = p.inputBg;
                    el.style.borderColor = p.border;
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.background = p.cardBg;
                    el.style.borderColor = p.borderTint;
                  }}
                >
                  <TypeBadge type={entry.type} />

                  <div>
                    <div style={{
                      fontFamily: "'Inter',sans-serif",
                      fontSize: 14,
                      color: p.textPrimary,
                      lineHeight: 1.45,
                      marginBottom: 3,
                    }}>
                      {entry.activity}
                    </div>
                    <div style={{
                      fontFamily: "'JetBrains Mono',monospace",
                      fontSize: 11,
                      color: p.textMuted,
                    }}>
                      {entry.team}
                    </div>
                  </div>

                  <div style={{
                    fontFamily: "'JetBrains Mono',monospace",
                    fontSize: 13,
                    fontWeight: 600,
                    color: p.textBody,
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
          filter: ${p.glow ? 'invert(0.45) sepia(1) hue-rotate(230deg)' : 'none'};
          cursor: pointer;
        }
        select option { background: ${p.cardSolid}; color: ${p.textPrimary}; }
        input::placeholder, textarea::placeholder { color: ${p.textMuted}; opacity: 0.6; }
        input:focus, textarea:focus, select:focus {
          border-color: ${p.border} !important;
          box-shadow: 0 0 0 3px ${p.inputBg};
        }
      `}</style>
    </div>
  );
}
