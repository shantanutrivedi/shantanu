'use client';

import { useState, useEffect, useCallback } from 'react';
import { loadState, onUserChange } from '@/lib/store';
import type { AppState, ActionItem, DailyActivity } from '@/lib/types';
import { usePalette } from '@/lib/palette';

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
  const p = usePalette();
  const pulseStyle = (w: string, h = 18, mb = 14): React.CSSProperties => ({
    width: w,
    height: h,
    borderRadius: 8,
    marginBottom: mb,
    background: p.inputBg,
    animation: 'skpulse 1.5s ease-in-out infinite',
  });

  return (
    <div style={{
      background: p.cardBg,
      border: `1px solid ${p.border}`,
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
        <div style={{ borderRadius: 14, border: `1px solid ${p.borderTint}`, padding: 20 }}>
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
        <div style={{ borderRadius: 14, border: `1px solid ${p.borderTint}`, padding: 20 }}>
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
          <div key={col} style={{ borderRadius: 14, border: `1px solid ${p.borderTint}`, padding: 20 }}>
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
  const p = usePalette();
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        width: 70,
        fontSize: 11,
        color: p.textMuted,
        fontFamily: "'JetBrains Mono',monospace",
        flexShrink: 0,
      }}>
        {label}
      </div>
      <div style={{
        flex: 1,
        height: 6,
        borderRadius: 3,
        background: p.inputBg,
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          borderRadius: 3,
          background: color,
          boxShadow: p.glow ? `0 0 8px ${color}80` : 'none',
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
  const p = usePalette();
  return (
    <div style={{ textAlign: 'center', flex: 1, minWidth: 0 }}>
      <div style={{
        fontFamily: "'Space Grotesk',sans-serif",
        fontWeight: 700,
        fontSize: 30,
        color,
        textShadow: p.glow ? `0 0 18px ${color}70` : 'none',
        lineHeight: 1,
        marginBottom: 4,
      }}>
        {value}
      </div>
      <div style={{
        fontSize: 10,
        color: p.textMuted,
        fontFamily: "'JetBrains Mono',monospace",
        letterSpacing: '0.04em',
      }}>
        {label}
      </div>
    </div>
  );
}

// ── SectionLabel ──────────────────────────────────────────────────────────────

function SectionLabel({ children, color }: { children: React.ReactNode; color?: string }) {
  const p = usePalette();
  return (
    <div style={{
      fontSize: 11,
      textTransform: 'uppercase',
      letterSpacing: '0.07em',
      color: color ?? p.textMuted,
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
  const p = usePalette();
  const [appState, setAppState] = useState<AppState | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const sync = () => setAppState(loadState());
    sync();
    const unsub = onUserChange(sync);
    return unsub;
  }, []);

  const week = getWeekRange(weekOffset);

  const generate = useCallback(async () => {
    if (!appState) return;
    setLoading(true);
    setError('');
    setSummary(null);

    const project = appState.projects.find(proj => proj.id === appState.activeProjectId);

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
    <div style={{ background: p.pageBg, minHeight: '100vh', color: p.textPrimary, position: 'relative' }}>
      {/* Ambient glow */}
      <div style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        background: p.glow
          ? 'radial-gradient(ellipse at 15% 0%, rgba(139,124,255,0.18), transparent 50%), radial-gradient(ellipse at 85% 10%, rgba(240,153,123,0.09), transparent 45%)'
          : 'none',
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
            color: p.violet,
            marginBottom: 8,
          }}>
            Executive Summary
          </div>
          <h1 style={{
            fontFamily: "'Space Grotesk',sans-serif",
            fontWeight: 700,
            fontSize: 34,
            letterSpacing: '-1px',
            color: p.textPrimary,
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
              background: p.coral,
              boxShadow: p.glow ? `0 0 12px ${p.coral}` : 'none',
              verticalAlign: 'middle',
            }} />
          </h1>
          <p style={{ color: p.textMuted, fontSize: 14, margin: 0, fontFamily: "'Inter',sans-serif" }}>
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
            background: p.inputBg,
            border: `1px solid ${p.border}`,
            borderRadius: 12,
            padding: '5px 10px',
          }}>
            <button
              onClick={() => setWeekOffset(o => o - 1)}
              style={{
                background: 'none',
                border: 'none',
                color: p.violet,
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
              color: p.textPrimary,
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
                color: weekOffset < 0 ? p.violet : p.textMuted,
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
              background: loading ? `${p.midViolet}38` : 'linear-gradient(135deg,#534AB7,#7F77DD)',
              border: 'none',
              boxShadow: loading ? 'none' : p.glow ? '0 0 22px rgba(83,74,183,0.5)' : '0 2px 8px rgba(83,74,183,0.3)',
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
                color: copied ? p.lime : p.textBody,
                cursor: 'pointer',
                background: copied ? `${p.lime}12` : p.inputBg,
                border: `1px solid ${copied ? `${p.lime}48` : p.border}`,
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
            background: `${p.coral}18`,
            border: `1px solid ${p.coral}48`,
            color: p.coral,
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
            background: p.cardBg,
            border: `1px solid ${p.border}`,
            borderRadius: 20,
            padding: 36,
            boxShadow: p.glow ? '0 16px 60px rgba(0,0,0,0.4)' : '0 4px 24px rgba(0,0,0,0.08)',
          }}>

            {/* ── Headline banner ──────────────────────────────────────────── */}
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 20,
              marginBottom: 32,
              paddingBottom: 28,
              borderBottom: `1px solid ${p.borderTint}`,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: '0.09em',
                  textTransform: 'uppercase',
                  color: p.textMuted,
                  marginBottom: 10,
                }}>
                  {week.label}
                </div>
                <h2 style={{
                  fontFamily: "'Space Grotesk',sans-serif",
                  fontWeight: 700,
                  fontSize: 28,
                  letterSpacing: '-0.7px',
                  color: p.textPrimary,
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
                boxShadow: p.glow ? `0 0 20px ${HEALTH_COLORS[summary.health]}25` : 'none',
                fontFamily: "'Space Grotesk',sans-serif",
              }}>
                <span style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: HEALTH_COLORS[summary.health],
                  boxShadow: p.glow ? `0 0 8px ${HEALTH_COLORS[summary.health]}` : 'none',
                  display: 'inline-block',
                }} />
                {summary.health}
              </span>
            </div>

            {/* ── Stats grid ───────────────────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>

              {/* Action status */}
              <div style={{
                background: p.inputBg,
                border: `1px solid ${p.borderTint}`,
                borderRadius: 14,
                padding: 20,
              }}>
                <SectionLabel>Action Status</SectionLabel>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
                  <BigStat label="TOTAL"       value={summary.stats.total}      color={p.textBody} />
                  <BigStat label="DONE"        value={summary.stats.done}       color={p.lime} />
                  <BigStat label="IN PROGRESS" value={summary.stats.inProgress} color={p.cyan} />
                  <BigStat label="BLOCKED"     value={summary.stats.blocked}    color={p.coral} />
                </div>
              </div>

              {/* By type bars */}
              <div style={{
                background: p.inputBg,
                border: `1px solid ${p.borderTint}`,
                borderRadius: 14,
                padding: 20,
              }}>
                <SectionLabel>By Type</SectionLabel>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <StatBar label="Features" value={summary.stats.features} max={Math.max(1, summary.stats.total)} color={p.cyan} />
                  <StatBar label="Bugs"     value={summary.stats.bugs}     max={Math.max(1, summary.stats.total)} color="#FFB089" />
                  <StatBar label="Configs"  value={summary.stats.configs}  max={Math.max(1, summary.stats.total)} color={p.amber} />
                  <StatBar label="Risks"    value={summary.stats.risks}    max={Math.max(1, summary.stats.total)} color={p.pink} />
                </div>
              </div>
            </div>

            {/* ── Overview ─────────────────────────────────────────────────── */}
            <div style={{ marginBottom: 28 }}>
              <SectionLabel>Overview</SectionLabel>
              <p style={{
                fontSize: 15,
                lineHeight: 1.7,
                color: p.textBody,
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
                background: p.glow ? 'rgba(182,255,110,0.04)' : 'rgba(74,146,0,0.06)',
                border: `1px solid ${p.glow ? 'rgba(182,255,110,0.14)' : 'rgba(74,146,0,0.18)'}`,
                borderRadius: 14,
                padding: 20,
              }}>
                <SectionLabel color={p.lime}>Highlights</SectionLabel>
                {summary.highlights.length === 0 ? (
                  <div style={{ fontSize: 13, color: p.textMuted, fontStyle: 'italic' }}>
                    No highlights recorded.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {summary.highlights.map((h, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <span style={{ color: p.lime, marginTop: 1, flexShrink: 0, fontSize: 13 }}>✓</span>
                        <span style={{
                          fontSize: 13,
                          color: p.textBody,
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
                background: `${p.coral}08`,
                border: `1px solid ${p.coral}28`,
                borderRadius: 14,
                padding: 20,
              }}>
                <SectionLabel color={p.coral}>Blockers</SectionLabel>
                {summary.blockers.length === 0 ? (
                  <div style={{
                    fontSize: 13,
                    color: p.textMuted,
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
                          borderLeft: `2px solid ${p.coral}70`,
                        }}
                      >
                        <div style={{
                          fontSize: 13,
                          color: p.textPrimary,
                          fontWeight: 500,
                          marginBottom: 3,
                          fontFamily: "'Inter',sans-serif",
                        }}>
                          {b.issue}
                        </div>
                        <div style={{
                          fontSize: 11,
                          color: p.textMuted,
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
                {summary.nextWeek.map((item, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      background: p.inputBg,
                      border: `1px solid ${p.borderTint}`,
                      borderRadius: 10,
                      padding: '11px 16px',
                    }}
                  >
                    <span style={{
                      fontFamily: "'Space Grotesk',sans-serif",
                      fontWeight: 700,
                      fontSize: 15,
                      color: p.violet,
                      minWidth: 22,
                      textAlign: 'center',
                      flexShrink: 0,
                    }}>
                      {i + 1}
                    </span>
                    <span style={{
                      fontSize: 13,
                      color: p.textBody,
                      fontFamily: "'Inter',sans-serif",
                      lineHeight: 1.45,
                    }}>
                      {item}
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
              background: `${p.cyan}10`,
              border: `1px solid ${p.cyan}28`,
              display: 'flex',
              alignItems: 'center',
              gap: 14,
            }}>
              <span style={{
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: p.cyan,
                fontFamily: "'JetBrains Mono',monospace",
                fontWeight: 600,
                flexShrink: 0,
              }}>
                Go-live
              </span>
              <span style={{ fontSize: 14, color: p.textBody, fontFamily: "'Inter',sans-serif" }}>
                {summary.goLiveStatus}
              </span>
            </div>

            {/* ── Recommendation box ────────────────────────────────────────── */}
            <div style={{
              padding: '18px 22px',
              borderRadius: 12,
              background: p.inputBg,
              borderLeft: `3px solid ${p.midViolet}`,
            }}>
              <SectionLabel color={p.violet}>Recommendation</SectionLabel>
              <p style={{
                fontSize: 14,
                lineHeight: 1.65,
                color: p.textPrimary,
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
            background: p.inputBg,
            border: `1px dashed ${p.border}`,
            borderRadius: 20,
          }}>
            <div style={{
              fontSize: 44,
              marginBottom: 16,
              color: p.violet,
              fontFamily: "'Space Grotesk',sans-serif",
              fontWeight: 700,
            }}>
              ✦
            </div>
            <div style={{
              fontFamily: "'Space Grotesk',sans-serif",
              fontWeight: 600,
              fontSize: 20,
              color: p.textPrimary,
              marginBottom: 8,
            }}>
              Ready to generate
            </div>
            <div style={{ color: p.textMuted, fontSize: 14, fontFamily: "'Inter',sans-serif" }}>
              Select a week and click <strong style={{ color: p.violet }}>Generate Summary</strong> to produce an AI-written executive report.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
