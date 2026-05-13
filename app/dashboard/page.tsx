'use client';

import { useEffect, useState } from 'react';
import { loadState, onUserChange } from '@/lib/store';
import type { AppState, Project, ActionItem, DailyActivity } from '@/lib/types';
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

function KPIGrid({ total, done, blocked, pct, activityCount }: { total: number; done: number; blocked: number; pct: number; activityCount: number }) {
  const p = usePalette();
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 16, marginBottom: 28 }}>
      <KPICard label="Total Work" value={total + activityCount} sub="actions + activities" color={p.violet} />
      <KPICard label="Action Items" value={total} sub="from MOM uploads" color={p.cyan} />
      <KPICard label="Done" value={done} sub={`${total > 0 ? Math.round((done / total) * 100) : 0}% complete`} color={p.lime} />
      <KPICard label="Blocked" value={blocked} sub={blocked > 0 ? 'needs attention' : 'all clear'} color={p.coral} />
      <KPICard label="Activities" value={activityCount} sub="logged entries" color={p.amber} />
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

// ── Gantt chart — proper calendar day-view ───────────────────────────────────

const TYPE_GANTT_COLORS: Record<ActionItem['type'], string> = {
  Feature:  '#8B7CFF',
  Bug:      '#FFB089',
  Config:   '#FFCB5C',
  Risk:     '#FF6FD8',
  Decision: '#56E0FF',
  Other:    '#7B7796',
};

const DAY_W  = 34;   // px per day column
const ROW_H  = 48;   // px per task row
const LABEL_W = 230; // px for sticky left panel
const HDR_H  = 54;   // total header height (month row + day row)

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function isWeekend(d: Date) {
  const day = d.getDay();
  return day === 0 || day === 6;
}

function GanttChart({ projects, actions }: { projects: Project[]; actions: ActionItem[] }) {
  const p = usePalette();
  const [tooltip, setTooltip] = useState<{ item: ActionItem; x: number; y: number } | null>(null);

  // Only items that have at least an ETA; use startDate or today as the left edge
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const ganttItems = actions
    .filter(a => a.eta && /^\d{4}-\d{2}-\d{2}$/.test(a.eta))
    .map(a => {
      const start = a.startDate && /^\d{4}-\d{2}-\d{2}$/.test(a.startDate)
        ? new Date(a.startDate)
        : new Date(today);
      const end   = new Date(a.eta);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      return { ...a, startD: start, endD: end < start ? start : end };
    });

  // Date range: earliest start or 3 days before today, latest end or 30 days out — plus padding
  const rangeStart = ganttItems.length
    ? addDays(ganttItems.reduce((m, i) => i.startD < m ? i.startD : m, ganttItems[0].startD), -2)
    : addDays(today, -2);
  const rangeEnd = ganttItems.length
    ? addDays(ganttItems.reduce((m, i) => i.endD > m ? i.endD : m, ganttItems[0].endD), 4)
    : addDays(today, 28);
  rangeStart.setHours(0, 0, 0, 0);
  rangeEnd.setHours(0, 0, 0, 0);

  const totalDays = Math.max(7, daysBetween(rangeStart, rangeEnd) + 1);
  const days: Date[] = Array.from({ length: totalDays }, (_, i) => addDays(rangeStart, i));

  // Build month header spans
  const monthSpans: { label: string; count: number }[] = [];
  days.forEach(d => {
    const label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    if (monthSpans.length === 0 || monthSpans[monthSpans.length - 1].label !== label) {
      monthSpans.push({ label, count: 1 });
    } else {
      monthSpans[monthSpans.length - 1].count++;
    }
  });

  const totalGridW = totalDays * DAY_W;
  const todayOffset = daysBetween(rangeStart, today);

  // Status dot color
  const statusColor = (s: ActionItem['status']) =>
    s === 'Done' ? p.lime : s === 'In Progress' ? p.cyan : s === 'Blocked' ? p.coral : p.textMuted;

  return (
    <div style={{
      background: p.cardBg, border: `1px solid ${p.border}`,
      borderRadius: 16, marginBottom: 28, overflow: 'hidden',
    }}>
      {/* Card header */}
      <div style={{ padding: '18px 24px 14px', borderBottom: `1px solid ${p.borderTint}` }}>
        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 22,
          color: p.textPrimary, letterSpacing: '-0.5px', marginBottom: 3 }}>
          Milestone Timeline
        </div>
        <div style={{ fontSize: 12, color: p.textMuted, fontFamily: "'Inter',sans-serif" }}>
          {ganttItems.length} task{ganttItems.length !== 1 ? 's' : ''} — set Start &amp; ETA dates in Workbench to populate this view
        </div>
      </div>

      {ganttItems.length === 0 ? (
        <div style={{ padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>📅</div>
          <div style={{ fontSize: 13, color: p.textMuted, fontFamily: "'Inter',sans-serif", lineHeight: 1.6 }}>
            No tasks with dates yet.<br />
            Open <strong>Workbench</strong> and set <strong>Start</strong> and <strong>ETA</strong> dates on your features and tasks.
          </div>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', position: 'relative' }}>
          <div style={{ minWidth: LABEL_W + totalGridW, position: 'relative' }}>

            {/* ── HEADER ── */}
            <div style={{ display: 'flex', height: HDR_H, borderBottom: `1px solid ${p.border}`,
              background: p.glow ? 'rgba(28,28,36,0.8)' : 'rgba(250,249,255,0.95)',
              position: 'sticky', top: 0, zIndex: 10 }}>

              {/* Label column header */}
              <div style={{
                width: LABEL_W, flexShrink: 0,
                borderRight: `1px solid ${p.border}`,
                display: 'flex', alignItems: 'center', padding: '0 16px',
                position: 'sticky', left: 0, zIndex: 11,
                background: p.glow ? 'rgba(28,28,36,0.95)' : 'rgba(250,249,255,0.99)',
              }}>
                <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace",
                  color: p.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Task
                </span>
              </div>

              {/* Month + day numbers */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Month row */}
                <div style={{ display: 'flex', height: 22, borderBottom: `1px solid ${p.borderTint}` }}>
                  {monthSpans.map((ms, i) => (
                    <div key={i} style={{
                      width: ms.count * DAY_W, flexShrink: 0,
                      display: 'flex', alignItems: 'center', paddingLeft: 8,
                      borderRight: `1px solid ${p.borderTint}`,
                      fontSize: 10, fontFamily: "'Space Grotesk',sans-serif",
                      fontWeight: 700, color: p.textMuted, letterSpacing: '0.04em',
                    }}>
                      {ms.label}
                    </div>
                  ))}
                </div>
                {/* Day row */}
                <div style={{ display: 'flex', height: 32, alignItems: 'center' }}>
                  {days.map((d, i) => {
                    const isToday = isSameDay(d, today);
                    const weekend = isWeekend(d);
                    return (
                      <div key={i} style={{
                        width: DAY_W, flexShrink: 0, textAlign: 'center',
                        fontSize: 10, fontFamily: "'JetBrains Mono',monospace",
                        fontWeight: isToday ? 700 : 400,
                        color: isToday ? p.coral : weekend ? p.textMuted + '80' : p.textMuted,
                        borderRight: `1px solid ${p.borderTint}20`,
                        position: 'relative',
                      }}>
                        {d.getDate()}
                        {isToday && (
                          <div style={{
                            position: 'absolute', bottom: 0, left: '50%',
                            transform: 'translateX(-50%)',
                            width: 4, height: 4, borderRadius: '50%', background: p.coral,
                          }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── ROWS ── */}
            {ganttItems.map((item, rowIdx) => {
              const barStart = daysBetween(rangeStart, item.startD);
              const barLen   = Math.max(1, daysBetween(item.startD, item.endD));
              const barColor = TYPE_GANTT_COLORS[item.type];
              const sc       = statusColor(item.status);
              const isDone   = item.status === 'Done';

              return (
                <div key={item.id} style={{
                  display: 'flex', height: ROW_H, position: 'relative',
                  borderBottom: `1px solid ${p.borderTint}`,
                  background: rowIdx % 2 === 0 ? 'transparent' : (p.glow ? 'rgba(255,255,255,0.015)' : 'rgba(83,74,183,0.02)'),
                }}>
                  {/* Sticky label */}
                  <div style={{
                    width: LABEL_W, flexShrink: 0,
                    position: 'sticky', left: 0, zIndex: 3,
                    background: rowIdx % 2 === 0
                      ? (p.glow ? '#1C1C24' : '#FAF9FF')
                      : (p.glow ? 'rgba(28,28,36,0.97)' : 'rgba(248,247,255,0.97)'),
                    borderRight: `1px solid ${p.border}`,
                    display: 'flex', alignItems: 'center',
                    padding: '0 14px', gap: 10, overflow: 'hidden',
                  }}>
                    {/* Status dot */}
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                      background: sc, boxShadow: p.glow ? `0 0 6px ${sc}` : 'none',
                    }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{
                        fontSize: 12, fontFamily: "'Inter',sans-serif",
                        fontWeight: 500, color: isDone ? p.textMuted : p.textPrimary,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        textDecoration: isDone ? 'line-through' : 'none',
                      }}>
                        {item.action}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        <span style={{
                          fontSize: 9, padding: '1px 5px', borderRadius: 4,
                          background: `${barColor}20`, color: barColor,
                          fontFamily: "'JetBrains Mono',monospace", fontWeight: 700,
                          letterSpacing: '0.04em', textTransform: 'uppercase',
                        }}>{item.type}</span>
                        {item.assignee && (
                          <span style={{ fontSize: 10, color: p.textMuted,
                            fontFamily: "'Inter',sans-serif",
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.assignee}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Calendar grid + bar */}
                  <div style={{ position: 'relative', width: totalGridW, flexShrink: 0 }}>
                    {/* Weekend shading */}
                    {days.map((d, i) => isWeekend(d) ? (
                      <div key={i} style={{
                        position: 'absolute', left: i * DAY_W, top: 0,
                        width: DAY_W, height: ROW_H,
                        background: p.glow ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.025)',
                        pointerEvents: 'none',
                      }} />
                    ) : null)}

                    {/* Today vertical line */}
                    {todayOffset >= 0 && todayOffset < totalDays && (
                      <div style={{
                        position: 'absolute',
                        left: todayOffset * DAY_W + DAY_W / 2,
                        top: 0, bottom: 0, width: 1.5,
                        background: p.coral, opacity: 0.5, pointerEvents: 'none',
                      }} />
                    )}

                    {/* Bar */}
                    <div
                      onMouseEnter={e => setTooltip({ item, x: e.clientX, y: e.clientY })}
                      onMouseLeave={() => setTooltip(null)}
                      style={{
                        position: 'absolute',
                        left: barStart * DAY_W + 2,
                        top: ROW_H / 2 - 10,
                        width: Math.max(DAY_W - 4, barLen * DAY_W - 4),
                        height: 20,
                        borderRadius: 6,
                        background: isDone
                          ? `${barColor}40`
                          : `linear-gradient(90deg, ${barColor}CC, ${barColor}88)`,
                        border: `1px solid ${barColor}60`,
                        cursor: 'default',
                        boxShadow: p.glow && !isDone ? `0 0 10px ${barColor}30` : 'none',
                        display: 'flex', alignItems: 'center',
                        paddingLeft: 6, overflow: 'hidden',
                        transition: 'opacity 0.15s',
                      }}
                    >
                      {barLen >= 3 && (
                        <span style={{
                          fontSize: 9, fontFamily: "'JetBrains Mono',monospace",
                          color: '#fff', fontWeight: 700, whiteSpace: 'nowrap',
                          overflow: 'hidden', textOverflow: 'ellipsis',
                          opacity: 0.85,
                        }}>
                          {item.action.length > barLen * 2 ? item.action.slice(0, barLen * 2 - 1) + '…' : item.action}
                        </span>
                      )}
                    </div>

                    {/* ETA diamond */}
                    <div style={{
                      position: 'absolute',
                      left: (barStart + barLen) * DAY_W - 5,
                      top: ROW_H / 2 - 6,
                      width: 12, height: 12,
                      background: barColor,
                      transform: 'rotate(45deg)',
                      borderRadius: 2,
                      boxShadow: p.glow ? `0 0 8px ${barColor}` : 'none',
                      zIndex: 2,
                    }} />
                  </div>
                </div>
              );
            })}

            {/* Today label at bottom */}
            {todayOffset >= 0 && todayOffset < totalDays && (
              <div style={{
                position: 'absolute',
                left: LABEL_W + todayOffset * DAY_W + DAY_W / 2 - 20,
                bottom: 6, zIndex: 4,
                fontSize: 9, fontFamily: "'JetBrains Mono',monospace",
                fontWeight: 700, color: p.coral, letterSpacing: '0.06em',
              }}>
                TODAY
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tooltip */}
      {tooltip && (
        <div style={{
          position: 'fixed', left: tooltip.x + 14, top: tooltip.y - 10,
          background: p.dropdownBg, border: `1px solid ${p.border}`,
          borderRadius: 10, padding: '10px 14px', zIndex: 9999,
          pointerEvents: 'none', minWidth: 180,
          boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: p.textPrimary,
            fontFamily: "'Space Grotesk',sans-serif", marginBottom: 6, lineHeight: 1.3 }}>
            {tooltip.item.action}
          </div>
          {[
            ['Type',     tooltip.item.type],
            ['Assignee', tooltip.item.assignee || '—'],
            ['Start',    fmtDate(tooltip.item.startDate ?? '')],
            ['ETA',      fmtDate(tooltip.item.eta)],
            ['Status',   tooltip.item.status],
            ['Priority', tooltip.item.priority],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', gap: 8, marginBottom: 2 }}>
              <span style={{ fontSize: 10, color: p.textMuted,
                fontFamily: "'JetBrains Mono',monospace", minWidth: 52 }}>{k}</span>
              <span style={{ fontSize: 10, color: p.textBody,
                fontFamily: "'Inter',sans-serif" }}>{v}</span>
            </div>
          ))}
        </div>
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

function RecentActivityFeed({ activities }: { activities: DailyActivity[] }) {
  const p = usePalette();
  const [hovered, setHovered] = useState<string | null>(null);
  const recent = [...activities]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8);

  const typeColor = (t: string) => {
    if (t === 'Meeting') return p.violet;
    if (t === 'Feature') return p.cyan;
    if (t === 'Bug') return p.coral;
    if (t === 'Config') return p.amber;
    return p.textMuted;
  };

  return (
    <div style={{
      background: p.cardBg,
      border: `1px solid ${p.border}`,
      borderRadius: 14,
      overflow: 'hidden',
      marginBottom: 28,
    }}>
      <div style={{ padding: '18px 22px 14px', borderBottom: `1px solid ${p.borderTint}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 18, color: p.textPrimary, letterSpacing: '-0.5px' }}>
            Recent Activity
          </div>
          <div style={{ fontSize: 12, color: p.textMuted, marginTop: 2 }}>
            {activities.length} log{activities.length !== 1 ? 's' : ''} · active project
          </div>
        </div>
        <div style={{
          padding: '4px 12px',
          borderRadius: 100,
          background: `${p.amber}18`,
          border: `1px solid ${p.amber}40`,
          fontSize: 10,
          fontWeight: 600,
          color: p.amber,
          fontFamily: "'JetBrains Mono',monospace",
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}>
          Activity Log
        </div>
      </div>

      {recent.length === 0 ? (
        <div style={{ padding: '32px 22px', textAlign: 'center', color: p.textMuted, fontSize: 13, fontFamily: "'Inter',sans-serif" }}>
          No activity logged for this project yet.
        </div>
      ) : (
        <div style={{ padding: '8px 0' }}>
          {recent.map((act, i) => (
            <div
              key={act.id}
              onMouseEnter={() => setHovered(act.id)}
              onMouseLeave={() => setHovered(null)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 14,
                padding: '12px 22px',
                borderBottom: i < recent.length - 1 ? `1px solid ${p.rowBg}` : 'none',
                background: hovered === act.id ? p.inputBg : 'transparent',
                transition: 'background 0.15s',
              }}
            >
              {/* Date bubble */}
              <div style={{
                flexShrink: 0,
                width: 42,
                textAlign: 'center',
                borderRadius: 8,
                background: p.inputBg,
                padding: '5px 0',
              }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: p.textPrimary, fontFamily: "'Space Grotesk',sans-serif", lineHeight: 1 }}>
                  {new Date(act.date).getDate()}
                </div>
                <div style={{ fontSize: 9, color: p.textMuted, fontFamily: "'JetBrains Mono',monospace", textTransform: 'uppercase', marginTop: 2 }}>
                  {new Date(act.date).toLocaleDateString('en-GB', { month: 'short' })}
                </div>
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: p.textPrimary, fontFamily: "'Space Grotesk',sans-serif", marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {act.activity}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, color: p.textBody, fontFamily: "'JetBrains Mono',monospace" }}>
                    {act.team}
                  </span>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: typeColor(act.type),
                    background: `${typeColor(act.type)}18`,
                    border: `1px solid ${typeColor(act.type)}30`,
                    borderRadius: 4,
                    padding: '1px 6px',
                    fontFamily: "'JetBrains Mono',monospace",
                    letterSpacing: '0.04em',
                  }}>
                    {act.type}
                  </span>
                </div>
              </div>

              {/* Hours */}
              <div style={{ flexShrink: 0, textAlign: 'right' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: p.cyan, fontFamily: "'Space Grotesk',sans-serif", textShadow: p.glow ? `0 0 10px ${p.cyan}` : 'none' }}>
                  {act.hours}h
                </div>
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

  const projectActivities = state.activities.filter(a => {
    if (!activeProject) return true;
    if (a.projectId) return a.projectId === activeProject.id;
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

        <GanttChart projects={state.projects} actions={projectActions} />

        <KPIGrid total={total} done={done} blocked={blocked} pct={pct} activityCount={projectActivities.length} />

        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 20, marginBottom: 28 }}>
          <ActionSummaryTable actions={projectActions} />
          <GoLiveCalendar projects={state.projects} />
        </div>

        <RecentActivityFeed activities={projectActivities} />

        <RiskRegister actions={projectActions} />
      </div>
    </div>
  );
}
