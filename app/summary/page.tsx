'use client';

import { useState, useEffect, useCallback } from 'react';
import { loadState } from '@/lib/store';
import type { AppState, ActionItem, DailyActivity } from '@/lib/types';

// ── Types ─────────────────────────────────────────────────────────────────────

interface SummaryStats {
  total: number;
  done: number;
  inProgress: number;
  blocked: number;
  bugs: number;
  features: number;
  configs: number;
  risks: number;
}

interface SummaryData {
  headline: string;
  health: 'On Track' | 'At Risk' | 'Behind';
  overview: string;
  stats: SummaryStats;
  highlights: string[];
  blockers: { issue: string; owner: string; impact: string }[];
  nextWeek: string[];
  goLiveStatus: string;
  recommendation: string;
}

// ── Palette ───────────────────────────────────────────────────────────────────

const HEALTH_COLORS: Record<string, string> = {
  'On Track': '#B6FF6E',
  'At Risk':  '#FFCB5C',
  'Behind':   '#F0997B',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

interface WeekRange {
  label: string;
  monday: Date;
  sunday: Date;
}

function getWeekRange(offset = 0): WeekRange {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7) + offset * 7);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return { label: `${fmt(monday)} – ${fmt(sunday)}`, monday, sunday };
}

function buildCopyText(summary: SummaryData, weekLabel: string): string {
  const lines: string[] = [
    `WEEKLY EXECUTIVE SUMMARY — ${weekLabel}`,
    `Status: ${summary.health}`,
    '',
    summary.headline,
    '',
    'OVERVIEW',
    summary.overview,
    '',
    'STATS',
    `Total: ${summary.stats.total}  |  Done: ${summary.stats.done}  |  In Progress: ${summary.stats.inProgress}  |  Blocked: ${summary.stats.blocked}`,
    `Features: ${summary.stats.features}  |  Bugs: ${summary.stats.bugs}  |  Configs: ${summary.stats.configs}`,
    '',
    'HIGHLIGHTS',
    ...summary.highlights.map(h => `✓ ${h}`),
    '',
    'BLOCKERS',
    ...(summary.blockers.length > 0
      ? summary.blockers.map(b => `⚠ ${b.issue} — ${b.owner} — ${b.impact}`)
      : ['No blockers this week']),
    '',
    'NEXT WEEK PRIORITIES',
    ...summary.nextWeek.map((p, i) => `${i + 1}. ${p}`),
    '',
    `GO-LIVE STATUS: ${summary.goLiveStatus}`,
    '',
    `RECOMMENDATION: ${summary.recommendation}`,
  ];
  return lines.join('\n');
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton() {
  const pulseStyle = (w: string, h = 18, mb = 14): React.CSSProperties => ({
    width: w,
    height: h,
    borderRadius: 8,
    marginBottom: mb,
    background: 'rgba(139,124,255,0.1)',
    animation: 'skpulse 1.5s ease-in-out infinite',
  });

  return (
    <div style={{
      background: 'rgba(28,28,36,0.8)',
      border: '1px solid rgba(139,124,255,0.2)',
      borderRadius: 20,
      padding: 36,
    }}>
      {/* Headline area */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div style={{ flex: 1 }}>
          <div style={pulseStyle('30%', 12, 10)} />
          <div style={pulseStyle('75%', 34, 6)} />
          <div style={pulseStyle('55%', 34, 0)} />
        </div>
        <div style={{ ...pulseStyle('110px', 36, 0), borderRadius: 100 }} />
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
        <div style={{ borderRadius: 14, border: '1px solid rgba(139,124,255,0.1)', padding: 20 }}>
          <div style={pulseStyle('40%', 12, 16)} />
          <div style={{ display: 'flex', gap: 20 }}>
            {['25%', '20%', '20%', '20%'].map((w, i) => (
              <div key={i}>
                <div style={pulseStyle(w, 32, 6)} />
                <div style={pulseStyle('60%', 10, 0)} />
              </div>
            ))}
          </div>
        </div>
        <div style={{ borderRadius: 14, border: '1px solid rgba(139,124,255,0.1)', padding: 20 }}>
          <div style={pulseStyle('40%', 12, 16)} />
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'center' }}>
              <div style={{ ...pulseStyle('70px', 10, 0), flexShrink: 0 }} />
              <div style={{ ...pulseStyle('100%', 6, 0), flex: 1 }} />
            </div>
          ))}
        </div>
      </div>

      {/* Overview */}
      <div style={pulseStyle('20%', 12, 12)} />
      <div style={pulseStyle('100%', 14, 8)} />
      <div style={pulseStyle('90%', 14, 8)} />
      <div style={pulseStyle('70%', 14, 24)} />

      {/* Highlights / Blockers */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {[0, 1].map(col => (
          <div key={col} style={{ borderRadius: 14, border: '1px solid rgba(139,124,255,0.1)', padding: 20 }}>
            <div style={pulseStyle('45%', 12, 14)} />
            {[1, 2, 3].map(i => (
              <div key={i} style={{ marginBottom: 10 }}>
                <div style={pulseStyle(`${70 + i * 10}%`, 13, 4)} />
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Next week */}
      <div style={pulseStyle('30%', 12, 12)} />
      {[1, 2, 3].map(i => (
        <div key={i} style={pulseStyle('85%', 40, 10)} />
      ))}

      {/* Go-live + Recommendation */}
      <div style={pulseStyle('100%', 44, 12)} />
      <div style={pulseStyle('100%', 64, 0)} />

      <style>{`@keyframes skpulse { 0%,100%{opacity:1} 50%{opacity:0.35} }`}</style>
    </div>
  );
}

// ── StatBar ───────────────────────────────────────────────────────────────────

function StatBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        width: 70,
        fontSize: 11,
        color: '#7B7796',
        fontFamily: "'JetBrains Mono',monospace",
        flexShrink: 0,
      }}>
        {label}
      </div>
      <div style={{
        flex: 1,
        height: 6,
        borderRadius: 3,
        background: 'rgba(139,124,255,0.1)',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          borderRadius: 3,
          background: color,
          boxShadow: `0 0 8px ${color}80`,
          transition: 'width 0.7s cubic-bezier(0.25,1,0.5,1)',
        }} />
      </div>
      <div style={{
        width: 22,
        textAlign: 'right',
        fontSize: 12,
        fontWeight: 600,
        color,
        fontFamily: "'JetBrains Mono',monospace",
      }}>
        {value}
      </div>
    </div>
  );
}

// ── BigStat ───────────────────────────────────────────────────────────────────

function BigStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ textAlign: 'center', flex: 1, minWidth: 0 }}>
      <div style={{
        fontFamily: "'Space Grotesk',sans-serif",
        fontWeight: 700,
        fontSize: 30,
        color,
        textShadow: `0 0 18px ${color}70`,
        lineHeight: 1,
        marginBottom: 4,
      }}>
        {value}
      </div>
      <div style={{
        fontSize: 10,
        color: '#7B7796',
        fontFamily: "'JetBrains Mono',monospace",
        letterSpacing: '0.04em',
      }}>
        {label}
      </div>
    </div>
  );
}

// ── SectionLabel ──────────────────────────────────────────────────────────────

function SectionLabel({ children, color = '#7B7796' }: { children: React.ReactNode; color?: string }) {
  return (
    <div style={{
      fontSize: 11,
      textTransform: 'uppercase',
      letterSpacing: '0.07em',
      color,
      fontFamily: "'JetBrains Mono',monospace",
      fontWeight: 600,
      marginBottom: 12,
    }}>
      {children}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SummaryPage() {
  const [appState, setAppState] = useState<AppState | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setAppState(loadState());
  }, []);

  const week = getWeekRange(weekOffset);

  const generate = useCallback(async () => {
    if (!appState) return;
    setLoading(true);
    setError('');
    setSummary(null);

    const project = appState.projects.find(p => p.id === appState.activeProjectId);

    const activities: DailyActivity[] = (appState.activities ?? []).filter(a => {
      const d = new Date(a.date + 'T00:00:00');
      return d >= week.monday && d <= week.sunday && a.projectId === appState.activeProjectId;
    });

    const actionItems: ActionItem[] = appState.actionItems ?? [];

    try {
      const res = await fetch('/api/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName: project?.name ?? 'Project',
          goLiveDate: project?.goLiveDate ?? '',
          actionItems,
          activities,
          weekRange: week.label,
          model: appState?.selectedModel,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSummary(data.summary as SummaryData);
      } else {
        setError(data.error || 'Generation failed. Please try again.');
      }
    } catch {
      setError('Network error — check your API key in .env.local and confirm /api/generate-summary is deployed.');
    } finally {
      setLoading(false);
    }
  }, [appState, week]);

  const copyReport = useCallback(() => {
    if (!summary) return;
    const text = buildCopyText(summary, week.label);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    });
  }, [summary, week.label]);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ background: '#1C1C24', minHeight: '100vh', color: '#EEEDFE', position: 'relative' }}>
      {/* Ambient glow */}
      <div style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        background: 'radial-gradient(ellipse at 15% 0%, rgba(139,124,255,0.18), transparent 50%), radial-gradient(ellipse at 85% 10%, rgba(240,153,123,0.09), transparent 45%)',
      }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1000, margin: '0 auto', padding: '36px 32px 80px' }}>

        {/* Page header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{
            fontFamily: "'JetBrains Mono',monospace",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#8B7CFF',
            marginBottom: 8,
          }}>
            Executive Summary
          </div>
          <h1 style={{
            fontFamily: "'Space Grotesk',sans-serif",
            fontWeight: 700,
            fontSize: 34,
            letterSpacing: '-1px',
            color: '#EEEDFE',
            margin: '0 0 8px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            Weekly Report
            <span style={{
              display: 'inline-block',
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: '#F0997B',
              boxShadow: '0 0 12px #F0997B',
              verticalAlign: 'middle',
            }} />
          </h1>
          <p style={{ color: '#7B7796', fontSize: 14, margin: 0, fontFamily: "'Inter',sans-serif" }}>
            AI-generated summary of project status, action items, and team output.
          </p>
        </div>

        {/* ── Controls: week selector + generate + copy ────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 32, flexWrap: 'wrap' }}>
          {/* Week selector */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            background: 'rgba(139,124,255,0.08)',
            border: '1px solid rgba(139,124,255,0.22)',
            borderRadius: 12,
            padding: '5px 10px',
          }}>
            <button
              onClick={() => setWeekOffset(o => o - 1)}
              style={{
                background: 'none',
                border: 'none',
                color: '#8B7CFF',
                cursor: 'pointer',
                padding: '2px 8px',
                fontSize: 18,
                lineHeight: 1,
                borderRadius: 6,
                transition: 'background 0.15s',
              }}
              title="Previous week"
            >
              ‹
            </button>
            <span style={{
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: 12,
              color: '#EEEDFE',
              minWidth: 168,
              textAlign: 'center',
              userSelect: 'none',
            }}>
              {week.label}
            </span>
            <button
              onClick={() => setWeekOffset(o => Math.min(0, o + 1))}
              style={{
                background: 'none',
                border: 'none',
                color: weekOffset < 0 ? '#8B7CFF' : '#3a3a4e',
                cursor: weekOffset < 0 ? 'pointer' : 'default',
                padding: '2px 8px',
                fontSize: 18,
                lineHeight: 1,
                borderRadius: 6,
                transition: 'background 0.15s',
              }}
              title="Next week"
            >
              ›
            </button>
          </div>

          {/* Generate */}
          <button
            onClick={generate}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 24px',
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 14,
              color: '#EEEDFE',
              cursor: loading ? 'not-allowed' : 'pointer',
              background: loading ? 'rgba(83,74,183,0.35)' : 'linear-gradient(135deg,#534AB7,#7F77DD)',
              border: 'none',
              boxShadow: loading ? 'none' : '0 0 22px rgba(83,74,183,0.5)',
              fontFamily: "'Space Grotesk',sans-serif",
              transition: 'all 0.2s',
              opacity: loading ? 0.8 : 1,
            }}
          >
            {loading ? (
              <>
                <span style={{
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  border: '2px solid rgba(255,255,255,0.25)',
                  borderTopColor: '#fff',
                  display: 'inline-block',
                  animation: 'snspinner 0.8s linear infinite',
                }} />
                Generating…
              </>
            ) : '✦ Generate Summary'}
          </button>

          {/* Copy */}
          {summary && (
            <button
              onClick={copyReport}
              style={{
                padding: '10px 20px',
                borderRadius: 12,
                fontWeight: 500,
                fontSize: 13,
                color: copied ? '#B6FF6E' : '#B7B3DC',
                cursor: 'pointer',
                background: copied ? 'rgba(182,255,110,0.07)' : 'rgba(139,124,255,0.06)',
                border: `1px solid ${copied ? 'rgba(182,255,110,0.3)' : 'rgba(139,124,255,0.2)'}`,
                fontFamily: "'Inter',sans-serif",
                transition: 'all 0.2s',
              }}
            >
              {copied ? '✓ Copied!' : 'Copy report'}
            </button>
          )}
        </div>

        <style>{`
          @keyframes snspinner { to { transform: rotate(360deg); } }
        `}</style>

        {/* Error */}
        {error && (
          <div style={{
            padding: '14px 18px',
            borderRadius: 12,
            marginBottom: 24,
            background: 'rgba(240,153,123,0.1)',
            border: '1px solid rgba(240,153,123,0.3)',
            color: '#F0997B',
            fontSize: 14,
            fontFamily: "'Inter',sans-serif",
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8,
          }}>
            <span style={{ flexShrink: 0 }}>⚠</span>
            {error}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && <Skeleton />}

        {/* ── Summary Report Card ──────────────────────────────────────────── */}
        {summary && !loading && (
          <div style={{
            background: 'rgba(28,28,36,0.8)',
            border: '1px solid rgba(139,124,255,0.2)',
            borderRadius: 20,
            padding: 36,
            boxShadow: '0 16px 60px rgba(0,0,0,0.4)',
          }}>

            {/* ── Headline banner ──────────────────────────────────────────── */}
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 20,
              marginBottom: 32,
              paddingBottom: 28,
              borderBottom: '1px solid rgba(139,124,255,0.12)',
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: '0.09em',
                  textTransform: 'uppercase',
                  color: '#7B7796',
                  marginBottom: 10,
                }}>
                  {week.label}
                </div>
                <h2 style={{
                  fontFamily: "'Space Grotesk',sans-serif",
                  fontWeight: 700,
                  fontSize: 28,
                  letterSpacing: '-0.7px',
                  color: '#EEEDFE',
                  margin: 0,
                  lineHeight: 1.2,
                }}>
                  {summary.headline}
                </h2>
              </div>

              {/* Health badge */}
              <span style={{
                flexShrink: 0,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 18px',
                borderRadius: 100,
                fontSize: 13,
                fontWeight: 600,
                background: `${HEALTH_COLORS[summary.health]}15`,
                color: HEALTH_COLORS[summary.health],
                border: `1px solid ${HEALTH_COLORS[summary.health]}38`,
                boxShadow: `0 0 20px ${HEALTH_COLORS[summary.health]}25`,
                fontFamily: "'Space Grotesk',sans-serif",
              }}>
                <span style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: HEALTH_COLORS[summary.health],
                  boxShadow: `0 0 8px ${HEALTH_COLORS[summary.health]}`,
                  display: 'inline-block',
                }} />
                {summary.health}
              </span>
            </div>

            {/* ── Stats grid ───────────────────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>

              {/* Action status */}
              <div style={{
                background: 'rgba(139,124,255,0.04)',
                border: '1px solid rgba(139,124,255,0.12)',
                borderRadius: 14,
                padding: 20,
              }}>
                <SectionLabel>Action Status</SectionLabel>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
                  <BigStat label="TOTAL"       value={summary.stats.total}      color="#B7B3DC" />
                  <BigStat label="DONE"        value={summary.stats.done}       color="#B6FF6E" />
                  <BigStat label="IN PROGRESS" value={summary.stats.inProgress} color="#56E0FF" />
                  <BigStat label="BLOCKED"     value={summary.stats.blocked}    color="#F0997B" />
                </div>
              </div>

              {/* By type bars */}
              <div style={{
                background: 'rgba(139,124,255,0.04)',
                border: '1px solid rgba(139,124,255,0.12)',
                borderRadius: 14,
                padding: 20,
              }}>
                <SectionLabel>By Type</SectionLabel>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <StatBar label="Features" value={summary.stats.features} max={Math.max(1, summary.stats.total)} color="#56E0FF" />
                  <StatBar label="Bugs"     value={summary.stats.bugs}     max={Math.max(1, summary.stats.total)} color="#FFB089" />
                  <StatBar label="Configs"  value={summary.stats.configs}  max={Math.max(1, summary.stats.total)} color="#FFCB5C" />
                  <StatBar label="Risks"    value={summary.stats.risks}    max={Math.max(1, summary.stats.total)} color="#FF6FD8" />
                </div>
              </div>
            </div>

            {/* ── Overview ─────────────────────────────────────────────────── */}
            <div style={{ marginBottom: 28 }}>
              <SectionLabel>Overview</SectionLabel>
              <p style={{
                fontSize: 15,
                lineHeight: 1.7,
                color: '#B7B3DC',
                margin: 0,
                fontFamily: "'Inter',sans-serif",
              }}>
                {summary.overview}
              </p>
            </div>

            {/* ── Highlights + Blockers ────────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>

              {/* Highlights */}
              <div style={{
                background: 'rgba(182,255,110,0.04)',
                border: '1px solid rgba(182,255,110,0.14)',
                borderRadius: 14,
                padding: 20,
              }}>
                <SectionLabel color="#B6FF6E">Highlights</SectionLabel>
                {summary.highlights.length === 0 ? (
                  <div style={{ fontSize: 13, color: '#7B7796', fontStyle: 'italic' }}>
                    No highlights recorded.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {summary.highlights.map((h, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <span style={{ color: '#B6FF6E', marginTop: 1, flexShrink: 0, fontSize: 13 }}>✓</span>
                        <span style={{
                          fontSize: 13,
                          color: '#B7B3DC',
                          lineHeight: 1.5,
                          fontFamily: "'Inter',sans-serif",
                        }}>
                          {h}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Blockers */}
              <div style={{
                background: 'rgba(240,153,123,0.04)',
                border: '1px solid rgba(240,153,123,0.16)',
                borderRadius: 14,
                padding: 20,
              }}>
                <SectionLabel color="#F0997B">Blockers</SectionLabel>
                {summary.blockers.length === 0 ? (
                  <div style={{
                    fontSize: 13,
                    color: '#7B7796',
                    fontStyle: 'italic',
                    fontFamily: "'Inter',sans-serif",
                  }}>
                    No blockers this week —
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {summary.blockers.map((b, i) => (
                      <div
                        key={i}
                        style={{
                          paddingLeft: 12,
                          borderLeft: '2px solid rgba(240,153,123,0.45)',
                        }}
                      >
                        <div style={{
                          fontSize: 13,
                          color: '#EEEDFE',
                          fontWeight: 500,
                          marginBottom: 3,
                          fontFamily: "'Inter',sans-serif",
                        }}>
                          {b.issue}
                        </div>
                        <div style={{
                          fontSize: 11,
                          color: '#7B7796',
                          fontFamily: "'JetBrains Mono',monospace",
                        }}>
                          {b.owner} · {b.impact}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Next week priorities ──────────────────────────────────────── */}
            <div style={{ marginBottom: 28 }}>
              <SectionLabel>Next Week Priorities</SectionLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {summary.nextWeek.map((p, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      background: 'rgba(139,124,255,0.05)',
                      border: '1px solid rgba(139,124,255,0.1)',
                      borderRadius: 10,
                      padding: '11px 16px',
                    }}
                  >
                    <span style={{
                      fontFamily: "'Space Grotesk',sans-serif",
                      fontWeight: 700,
                      fontSize: 15,
                      color: '#534AB7',
                      minWidth: 22,
                      textAlign: 'center',
                      flexShrink: 0,
                    }}>
                      {i + 1}
                    </span>
                    <span style={{
                      fontSize: 13,
                      color: '#B7B3DC',
                      fontFamily: "'Inter',sans-serif",
                      lineHeight: 1.45,
                    }}>
                      {p}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Go-live status ────────────────────────────────────────────── */}
            <div style={{
              padding: '13px 18px',
              borderRadius: 10,
              marginBottom: 18,
              background: 'rgba(86,224,255,0.06)',
              border: '1px solid rgba(86,224,255,0.16)',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
            }}>
              <span style={{
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#56E0FF',
                fontFamily: "'JetBrains Mono',monospace",
                fontWeight: 600,
                flexShrink: 0,
              }}>
                Go-live
              </span>
              <span style={{ fontSize: 14, color: '#B7B3DC', fontFamily: "'Inter',sans-serif" }}>
                {summary.goLiveStatus}
              </span>
            </div>

            {/* ── Recommendation box ────────────────────────────────────────── */}
            <div style={{
              padding: '18px 22px',
              borderRadius: 12,
              background: 'rgba(139,124,255,0.06)',
              borderLeft: '3px solid #7F77DD',
            }}>
              <SectionLabel color="#8B7CFF">Recommendation</SectionLabel>
              <p style={{
                fontSize: 14,
                lineHeight: 1.65,
                color: '#EEEDFE',
                fontStyle: 'italic',
                margin: 0,
                fontFamily: "'Inter',sans-serif",
              }}>
                {summary.recommendation}
              </p>
            </div>
          </div>
        )}

        {/* ── Empty state ──────────────────────────────────────────────────── */}
        {!summary && !loading && !error && (
          <div style={{
            textAlign: 'center',
            padding: '80px 40px',
            background: 'rgba(139,124,255,0.04)',
            border: '1px dashed rgba(139,124,255,0.22)',
            borderRadius: 20,
          }}>
            <div style={{
              fontSize: 44,
              marginBottom: 16,
              color: '#534AB7',
              fontFamily: "'Space Grotesk',sans-serif",
              fontWeight: 700,
            }}>
              ✦
            </div>
            <div style={{
              fontFamily: "'Space Grotesk',sans-serif",
              fontWeight: 600,
              fontSize: 20,
              color: '#EEEDFE',
              marginBottom: 8,
            }}>
              Ready to generate
            </div>
            <div style={{ color: '#7B7796', fontSize: 14, fontFamily: "'Inter',sans-serif" }}>
              Select a week and click <strong style={{ color: '#8B7CFF' }}>Generate Summary</strong> to produce an AI-written executive report.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
