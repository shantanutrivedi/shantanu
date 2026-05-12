'use client';

import { useEffect, useState } from 'react';
import { loadState, onUserChange } from '@/lib/store';
import type { AppState, Project, ActionItem } from '@/lib/types';
import KPICard from '@/components/KPICard';
import StatusPill from '@/components/StatusPill';
import PriorityBadge from '@/components/PriorityBadge';
import { usePalette } from '@/lib/palette';

// ── Palette ──────────────────────────────────────────────────────────────────
const PROJECT_COLORS = ['#8B7CFF', '#56E0FF', '#FFB089', '#B6FF6E'];

// ── Helpers ──────────────────────────────────────────────────────────────────
function healthColor(h: Project['health']) {
  return h === 'On Track' ? '#B6FF6E' : h === 'At Risk' ? '#FFCB5C' : '#F0997B';
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function daysFromNow(iso: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(iso);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / 86400000);
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  const p = usePalette();
  return (
    <div style={{ marginBottom: 32 }}>
      <h1 style={{
        fontFamily: "'Space Grotesk',sans-serif",
        fontWeight: 700,
        fontSize: 34,
        letterSpacing: '-1px',
        color: p.textPrimary,
        margin: 0,
        lineHeight: 1.1,
      }}>
        {title}
      </h1>
      <p style={{ margin: '6px 0 0', fontSize: 14, color: p.textMuted, fontFamily: "'Inter',sans-serif" }}>
        {subtitle}
      </p>
    </div>
  );
}

function ProjectHealthBanner({ project }: { project: Project | undefined }) {
  const p = usePalette();
  if (!project) return null;
  const hc = healthColor(project.health);
  const days = daysFromNow(project.goLiveDate);
  const overdue = days < 0;

  return (
    <div style={{
      borderRadius: 14,
      padding: '18px 24px',
      marginBottom: 28,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: p.cardBg,
      border: `1px solid ${hc}30`,
      boxShadow: p.glow ? `0 0 32px ${hc}10` : 'none',
      gap: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: hc,
          boxShadow: p.glow ? `0 0 12px ${hc}` : 'none',
          flexShrink: 0,
        }} />
        <div>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 18, color: p.textPrimary, letterSpacing: '-0.4px' }}>
            {project.name}
          </div>
          <div style={{ fontSize: 12, color: p.textMuted, marginTop: 2, fontFamily: "'Inter',sans-serif" }}>
            {project.description}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexShrink: 0 }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: p.textMuted, fontFamily: "'JetBrains Mono',monospace", letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Go-live
          </div>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 15, color: p.textPrimary, marginTop: 2 }}>
            {fmtDate(project.goLiveDate)}
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: p.textMuted, fontFamily: "'JetBrains Mono',monospace", letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {overdue ? 'Overdue by' : 'Days left'}
          </div>
          <div style={{
            fontFamily: "'Space Grotesk',sans-serif",
            fontWeight: 700,
            fontSize: 22,
            color: overdue ? p.coral : hc,
            textShadow: p.glow ? `0 0 14px ${overdue ? p.coral : hc}` : 'none',
            marginTop: 2,
          }}>
            {Math.abs(days)}
          </div>
        </div>

        <div style={{
          padding: '6px 16px',
          borderRadius: 100,
          background: `${hc}18`,
          border: `1px solid ${hc}40`,
          fontFamily: "'JetBrains Mono',monospace",
          fontWeight: 600,
          fontSize: 12,
          color: hc,
          letterSpacing: '0.04em',
          whiteSpace: 'nowrap',
        }}>
          {project.health}
        </div>
      </div>
    </div>
  );
}

function KPIGrid({ total, done, blocked, pct }: { total: number; done: number; blocked: number; pct: number }) {
  const p = usePalette();
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
      <KPICard label="Total Actions" value={total} sub="across active project" color={p.violet} />
      <KPICard label="Done" value={done} sub={`${total > 0 ? Math.round((done / total) * 100) : 0}% complete`} color={p.lime} />
      <KPICard label="Blocked" value={blocked} sub={blocked > 0 ? 'needs attention' : 'all clear'} color={p.coral} />
      <KPICard label="On-track %" value={`${pct}%`} sub="done / total" color={pct >= 70 ? p.lime : pct >= 40 ? p.amber : p.coral} />
    </div>
  );
}

function ActionSummaryTable({ actions }: { actions: ActionItem[] }) {
  const p = usePalette();
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div style={{
      background: p.cardBg,
      border: `1px solid ${p.border}`,
      borderRadius: 14,
      overflow: 'hidden',
    }}>
      <div style={{ padding: '18px 22px 14px', borderBottom: `1px solid ${p.borderTint}` }}>
        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 18, color: p.textPrimary, letterSpacing: '-0.5px' }}>
          Action Items
        </div>
        <div style={{ fontSize: 12, color: p.textMuted, marginTop: 2 }}>
          {actions.length} item{actions.length !== 1 ? 's' : ''} · active project
        </div>
      </div>

      {actions.length === 0 ? (
        <div style={{ padding: '32px 22px', textAlign: 'center', color: p.textMuted, fontSize: 13, fontFamily: "'Inter',sans-serif" }}>
          No actions for this project yet.
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: p.inputBg }}>
              {['Action', 'Owner', 'ETA', 'Priority', 'Status'].map(h => (
                <th key={h} style={{
                  padding: '8px 14px',
                  textAlign: 'left',
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: '0.07em',
                  textTransform: 'uppercase',
                  color: p.textMuted,
                  fontFamily: "'JetBrains Mono',monospace",
                  borderBottom: `1px solid ${p.borderTint}`,
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {actions.map((a, i) => (
              <tr
                key={a.id}
                onMouseEnter={() => setHovered(a.id)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  borderBottom: i < actions.length - 1 ? `1px solid ${p.rowBg}` : 'none',
                  background: hovered === a.id ? p.inputBg : i % 2 === 0 ? 'transparent' : p.rowBg,
                  transition: 'background 0.15s',
                  cursor: 'default',
                }}
              >
                <td style={{ padding: '9px 14px', fontSize: 12, color: p.textPrimary, fontFamily: "'Inter',sans-serif", maxWidth: 220 }}>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.action}</div>
                  {a.comment && (
                    <div style={{ fontSize: 10, color: p.textMuted, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {a.comment}
                    </div>
                  )}
                </td>
                <td style={{ padding: '9px 14px', fontSize: 11, color: p.textBody, fontFamily: "'JetBrains Mono',monospace", whiteSpace: 'nowrap' }}>
                  {a.assignee}
                </td>
                <td style={{ padding: '9px 14px', fontSize: 11, color: p.textBody, fontFamily: "'JetBrains Mono',monospace", whiteSpace: 'nowrap' }}>
                  {fmtDate(a.eta)}
                </td>
                <td style={{ padding: '9px 14px' }}>
                  <PriorityBadge priority={a.priority} />
                </td>
                <td style={{ padding: '9px 14px' }}>
                  <StatusPill status={a.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function GoLiveCalendar({ projects }: { projects: Project[] }) {
  const p = usePalette();
  const sorted = [...projects].sort((a, b) => new Date(a.goLiveDate).getTime() - new Date(b.goLiveDate).getTime());

  return (
    <div style={{
      background: p.cardBg,
      border: `1px solid ${p.border}`,
      borderRadius: 14,
      overflow: 'hidden',
    }}>
      <div style={{ padding: '18px 22px 14px', borderBottom: `1px solid ${p.borderTint}` }}>
        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 18, color: p.textPrimary, letterSpacing: '-0.5px' }}>
          Go-live Calendar
        </div>
        <div style={{ fontSize: 12, color: p.textMuted, marginTop: 2 }}>Upcoming project launches</div>
      </div>

      <div style={{ padding: '8px 0' }}>
        {sorted.map((proj, i) => {
          const hc = healthColor(proj.health);
          const days = daysFromNow(proj.goLiveDate);
          const overdue = days < 0;
          return (
            <div
              key={proj.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '12px 22px',
                borderBottom: i < sorted.length - 1 ? `1px solid ${p.rowBg}` : 'none',
              }}
            >
              <div style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: hc,
                boxShadow: p.glow ? `0 0 10px ${hc}` : 'none',
                flexShrink: 0,
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: p.textPrimary, fontFamily: "'Space Grotesk',sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {proj.name}
                </div>
                <div style={{ fontSize: 11, color: p.textMuted, marginTop: 2, fontFamily: "'JetBrains Mono',monospace" }}>
                  {fmtDate(proj.goLiveDate)}
                </div>
              </div>
              <div style={{ flexShrink: 0, textAlign: 'right' }}>
                <div style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: overdue ? p.coral : hc,
                  fontFamily: "'Space Grotesk',sans-serif",
                  textShadow: p.glow ? `0 0 10px ${overdue ? p.coral : hc}` : 'none',
                }}>
                  {overdue ? `${Math.abs(days)}d late` : days === 0 ? 'Today!' : `${days}d`}
                </div>
                <div style={{
                  fontSize: 10,
                  color: hc,
                  fontFamily: "'JetBrains Mono',monospace",
                  marginTop: 1,
                  letterSpacing: '0.04em',
                }}>
                  {proj.health}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GanttChart({ projects }: { projects: Project[] }) {
  const p = usePalette();
  const svgWidth = 680;
  const rowH = 44;
  const labelW = 180;
  const barAreaW = svgWidth - labelW - 24;
  const svgHeight = projects.length * rowH + 48;

  // Reference: span from now to furthest go-live + 14d buffer
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const maxDate = projects.reduce((max, proj) => {
    const d = new Date(proj.goLiveDate);
    return d > max ? d : max;
  }, now);
  const totalDays = Math.max(1, Math.round((maxDate.getTime() - now.getTime()) / 86400000) + 14);

  function xForDays(d: number) {
    return labelW + Math.max(0, Math.min(1, d / totalDays)) * barAreaW;
  }

  // Month tick marks
  const ticks: { label: string; x: number }[] = [];
  const tickDate = new Date(now);
  tickDate.setDate(1);
  tickDate.setMonth(tickDate.getMonth() + 1);
  while (tickDate <= maxDate) {
    const d = Math.round((tickDate.getTime() - now.getTime()) / 86400000);
    ticks.push({
      label: tickDate.toLocaleDateString('en-GB', { month: 'short' }),
      x: xForDays(d),
    });
    tickDate.setMonth(tickDate.getMonth() + 1);
  }

  return (
    <div style={{
      background: p.cardBg,
      border: `1px solid ${p.border}`,
      borderRadius: 14,
      padding: '18px 22px 22px',
      marginBottom: 28,
    }}>
      <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 22, color: p.textPrimary, letterSpacing: '-0.5px', marginBottom: 4 }}>
        Milestone Timeline
      </div>
      <div style={{ fontSize: 12, color: p.textBody, marginBottom: 18 }}>Go-live dates relative to today</div>

      {projects.length === 0 ? (
        <div style={{ color: p.textMuted, fontSize: 13, textAlign: 'center', padding: '24px 0' }}>No projects loaded.</div>
      ) : (
        <svg width="100%" viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ display: 'block', overflow: 'visible' }}>
          {/* Grid lines + month labels */}
          {ticks.map(t => (
            <g key={t.label + t.x}>
              <line x1={t.x} y1={32} x2={t.x} y2={svgHeight - 4} stroke={p.borderTint} strokeWidth={1} strokeDasharray="3 4" />
              <text x={t.x} y={22} fill={p.textMuted} fontSize={10} fontFamily="JetBrains Mono,monospace" textAnchor="middle">{t.label}</text>
            </g>
          ))}

          {/* "Today" line */}
          <line x1={labelW} y1={28} x2={labelW} y2={svgHeight - 4} stroke={p.coral} strokeWidth={1.5} strokeDasharray="4 3" opacity={0.7} />
          <text x={labelW + 4} y={22} fill={p.coral} fontSize={9} fontFamily="JetBrains Mono,monospace">TODAY</text>

          {/* Bars */}
          {projects.map((proj, i) => {
            const cy = 48 + i * rowH;
            const days = daysFromNow(proj.goLiveDate);
            const hc = healthColor(proj.health);
            const barColor = PROJECT_COLORS[i % PROJECT_COLORS.length];
            const barEnd = xForDays(days);
            const barStart = labelW;
            const barW = Math.max(4, barEnd - barStart);
            const overdue = days < 0;

            return (
              <g key={proj.id}>
                {/* Label */}
                <text
                  x={labelW - 10}
                  y={cy + 5}
                  fill={p.textBody}
                  fontSize={11}
                  fontFamily="Inter,sans-serif"
                  textAnchor="end"
                  dominantBaseline="middle"
                >
                  {proj.name.length > 20 ? proj.name.slice(0, 20) + '…' : proj.name}
                </text>

                {/* Bar track */}
                <rect
                  x={labelW}
                  y={cy - 8}
                  width={barAreaW}
                  height={16}
                  rx={8}
                  fill={p.inputBg}
                />

                {/* Bar fill */}
                {!overdue && (
                  <rect
                    x={barStart}
                    y={cy - 7}
                    width={barW}
                    height={14}
                    rx={7}
                    fill={barColor}
                    opacity={0.75}
                  />
                )}

                {/* Overdue bar (full width, red) */}
                {overdue && (
                  <rect
                    x={barStart}
                    y={cy - 7}
                    width={barAreaW}
                    height={14}
                    rx={7}
                    fill={p.coral}
                    opacity={0.35}
                  />
                )}

                {/* Go-live diamond marker */}
                <polygon
                  points={`${barEnd},${cy - 9} ${barEnd + 6},${cy} ${barEnd},${cy + 9} ${barEnd - 6},${cy}`}
                  fill={hc}
                  style={{ filter: p.glow ? `drop-shadow(0 0 5px ${hc})` : 'none' }}
                />

                {/* Days label */}
                <text
                  x={Math.min(barEnd + 14, svgWidth - 4)}
                  y={cy + 5}
                  fill={hc}
                  fontSize={10}
                  fontFamily="JetBrains Mono,monospace"
                  dominantBaseline="middle"
                >
                  {overdue ? `${Math.abs(days)}d late` : `${days}d`}
                </text>
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}

function RiskRegister({ actions }: { actions: ActionItem[] }) {
  const p = usePalette();
  const risks = actions.filter(a => a.status === 'Blocked' || a.type === 'Risk');

  return (
    <div style={{
      background: p.cardBg,
      border: `1px solid ${p.coral}30`,
      borderRadius: 14,
      overflow: 'hidden',
    }}>
      <div style={{ padding: '18px 22px 14px', borderBottom: `1px solid ${p.coral}18` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.coral, boxShadow: p.glow ? `0 0 10px ${p.coral}` : 'none' }} />
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 22, color: p.textPrimary, letterSpacing: '-0.5px' }}>
            Risk Register
          </div>
        </div>
        <div style={{ fontSize: 12, color: p.textMuted, marginTop: 4, marginLeft: 18 }}>
          {risks.length} item{risks.length !== 1 ? 's' : ''} flagged
        </div>
      </div>

      {risks.length === 0 ? (
        <div style={{ padding: '28px 22px', textAlign: 'center', color: p.textMuted, fontSize: 13 }}>
          No blocked or risk items — looking good.
        </div>
      ) : (
        <div style={{ padding: '8px 0' }}>
          {risks.map((a, i) => (
            <div
              key={a.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 16,
                padding: '14px 22px',
                borderLeft: `3px solid ${p.coral}`,
                borderBottom: i < risks.length - 1 ? `1px solid ${p.coral}14` : 'none',
                marginLeft: 0,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: p.textPrimary, fontFamily: "'Space Grotesk',sans-serif", marginBottom: 4 }}>
                  {a.action}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, color: p.textBody, fontFamily: "'JetBrains Mono',monospace" }}>
                    {a.assignee}
                  </span>
                  <span style={{ fontSize: 10, color: p.textMuted, fontFamily: "'JetBrains Mono',monospace" }}>
                    ETA {fmtDate(a.eta)}
                  </span>
                  {a.comment && (
                    <span style={{ fontSize: 11, color: p.textMuted, fontFamily: "'Inter',sans-serif", fontStyle: 'italic' }}>
                      "{a.comment}"
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                <StatusPill status={a.status} />
                <PriorityBadge priority={a.priority} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const p = usePalette();
  const [state, setState] = useState<AppState | null>(null);

  function reload() {
    setState(loadState());
  }

  useEffect(() => {
    reload();
    window.addEventListener('shantanu-project-change', reload);
    const unsub = onUserChange(reload);
    return () => {
      window.removeEventListener('shantanu-project-change', reload);
      unsub();
    };
  }, []);

  if (!state) {
    return (
      <div style={{ padding: '32px 40px', color: p.textMuted, fontFamily: "'JetBrains Mono',monospace", fontSize: 13 }}>
        Loading…
      </div>
    );
  }

  const activeProject = state.projects.find(proj => proj.id === state.activeProjectId);

  // Filter by projectId stamp (set when saved from workbench); fall back to showing all
  const projectActions = state.actionItems.filter(a => {
    if (!activeProject) return true;
    if (a.projectId) return a.projectId === activeProject.id;
    // Legacy items without projectId — show them all
    return true;
  });

  const total = projectActions.length;
  const done = projectActions.filter(a => a.status === 'Done').length;
  const blocked = projectActions.filter(a => a.status === 'Blocked').length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div style={{
      background: p.pageBg,
      minHeight: '100vh',
      padding: '32px 40px',
      maxWidth: 1300,
      margin: '0 auto',
      position: 'relative',
    }}>
      {/* Ambient glow */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 600,
        pointerEvents: 'none',
        zIndex: 0,
        background: p.glow
          ? 'radial-gradient(ellipse at 10% 0%, rgba(139,124,255,0.12), transparent 55%), radial-gradient(ellipse at 90% 10%, rgba(240,153,123,0.08), transparent 45%)'
          : 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <PageHeader title="Dashboard" subtitle="Active project overview" />

        <ProjectHealthBanner project={activeProject} />

        <KPIGrid total={total} done={done} blocked={blocked} pct={pct} />

        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 20, marginBottom: 28 }}>
          <ActionSummaryTable actions={projectActions} />
          <GoLiveCalendar projects={state.projects} />
        </div>

        <GanttChart projects={state.projects} />

        <RiskRegister actions={projectActions} />
      </div>
    </div>
  );
}
