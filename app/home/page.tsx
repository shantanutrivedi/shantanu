'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { usePalette } from '@/lib/palette';
import { loadState, saveState, onUserChange } from '@/lib/store';
import type { Project } from '@/lib/types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const HEALTH_COLORS: Record<Project['health'], { bg: string; fg: string; label: string }> = {
  'On Track': { bg: '#B6FF6E20', fg: '#B6FF6E', label: 'On Track' },
  'At Risk':  { bg: '#FFCB5C20', fg: '#FFCB5C', label: 'At Risk' },
  'Behind':   { bg: '#FFB08920', fg: '#FFB089', label: 'Behind' },
};

function daysUntil(dateStr: string): string {
  if (!dateStr) return '—';
  const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
  if (diff < 0)  return 'Overdue';
  if (diff === 0) return 'Today';
  if (diff === 1) return '1 day';
  return `${diff} days`;
}

function formatGoLive(dateStr: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── Add-project modal ─────────────────────────────────────────────────────────

function AddProjectModal({ onClose, onAdd }: {
  onClose: () => void;
  onAdd: (p: Project) => void;
}) {
  const p = usePalette();
  const [name, setName] = useState('');
  const [goLive, setGoLive] = useState('');
  const [desc, setDesc] = useState('');
  const [health, setHealth] = useState<Project['health']>('On Track');

  function submit() {
    if (!name.trim()) return;
    onAdd({
      id: crypto.randomUUID(),
      name: name.trim(),
      goLiveDate: goLive,
      health,
      description: desc.trim(),
    });
    onClose();
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    padding: '10px 14px', borderRadius: 10,
    background: p.inputBg, border: `1px solid ${p.border}`,
    color: p.textPrimary, fontSize: 14,
    fontFamily: "'Inter',sans-serif", outline: 'none',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div style={{
        background: p.cardBg, border: `1px solid ${p.border}`,
        borderRadius: 20, padding: 32, width: '100%', maxWidth: 440,
        boxShadow: p.glow ? `0 0 48px ${p.violet}20` : '0 8px 32px rgba(0,0,0,0.3)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 20,
          color: p.textPrimary, marginBottom: 24, letterSpacing: '-0.5px' }}>
          New Project
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <input style={inputStyle} placeholder="Project name *" value={name} onChange={e => setName(e.target.value)} />
          <input style={inputStyle} type="date" placeholder="Go-live date" value={goLive} onChange={e => setGoLive(e.target.value)} />
          <textarea style={{ ...inputStyle, minHeight: 72, resize: 'vertical' }} placeholder="Description (optional)"
            value={desc} onChange={e => setDesc(e.target.value)} />
          <select style={inputStyle} value={health} onChange={e => setHealth(e.target.value as Project['health'])}>
            <option>On Track</option>
            <option>At Risk</option>
            <option>Behind</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button onClick={submit} style={{
            flex: 1, padding: '11px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg,#534AB7,#7F77DD)',
            color: '#EEEDFE', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 14,
          }}>
            Create Project
          </button>
          <button onClick={onClose} style={{
            padding: '11px 18px', borderRadius: 10, border: `1px solid ${p.border}`,
            background: 'none', cursor: 'pointer', color: p.textMuted,
            fontFamily: "'Inter',sans-serif", fontSize: 14,
          }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Project card ──────────────────────────────────────────────────────────────

function ProjectCard({ project, active, onClick }: {
  project: Project;
  active: boolean;
  onClick: () => void;
}) {
  const p = usePalette();
  const [hovered, setHovered] = useState(false);
  const h = HEALTH_COLORS[project.health];
  const days = daysUntil(project.goLiveDate);
  const overdue = days === 'Overdue';

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: p.cardBg,
        border: `1.5px solid ${active ? p.violet : hovered ? `${p.violet}60` : p.border}`,
        borderRadius: 20,
        padding: '24px 22px',
        cursor: 'pointer',
        transition: 'border-color 0.15s, transform 0.15s, box-shadow 0.15s',
        transform: hovered ? 'translateY(-3px)' : 'none',
        boxShadow: active
          ? (p.glow ? `0 0 28px ${p.violet}30, 0 4px 16px rgba(0,0,0,0.2)` : '0 4px 16px rgba(0,0,0,0.2)')
          : hovered
          ? '0 6px 24px rgba(0,0,0,0.15)'
          : '0 2px 8px rgba(0,0,0,0.08)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Active glow stripe */}
      {active && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: 'linear-gradient(90deg,#534AB7,#7F77DD,#F0997B)',
          borderRadius: '20px 20px 0 0',
        }} />
      )}

      {/* Health badge */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '3px 10px', borderRadius: 100,
        background: h.bg, border: `1px solid ${h.fg}40`,
        marginBottom: 14,
      }}>
        <div style={{ width: 5, height: 5, borderRadius: '50%', background: h.fg,
          boxShadow: p.glow ? `0 0 5px ${h.fg}` : 'none' }} />
        <span style={{ fontSize: 11, fontWeight: 600, color: h.fg,
          fontFamily: "'JetBrains Mono',monospace", letterSpacing: '0.05em' }}>
          {h.label}
        </span>
      </div>

      {/* Project name */}
      <div style={{
        fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 22,
        color: p.textPrimary, letterSpacing: '-0.8px', lineHeight: 1.15, marginBottom: 8,
      }}>
        {project.name}
      </div>

      {/* Description */}
      {project.description && (
        <div style={{
          fontSize: 12, color: p.textMuted, fontFamily: "'Inter',sans-serif",
          lineHeight: 1.5, marginBottom: 16,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {project.description}
        </div>
      )}

      <div style={{ borderTop: `1px solid ${p.borderTint}`, paddingTop: 14, marginTop: project.description ? 0 : 16 }}>
        <div style={{ fontSize: 10, color: p.textMuted, fontFamily: "'JetBrains Mono',monospace",
          textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
          Go Live
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{
            fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 18,
            color: overdue ? '#FFB089' : p.textPrimary, letterSpacing: '-0.5px',
          }}>
            {formatGoLive(project.goLiveDate)}
          </span>
          <span style={{
            fontSize: 11, fontFamily: "'JetBrains Mono',monospace",
            color: overdue ? '#FFB089' : p.cyan,
            fontWeight: 600,
          }}>
            {days}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Add card ──────────────────────────────────────────────────────────────────

function AddCard({ onClick }: { onClick: () => void }) {
  const p = usePalette();
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? `${p.violet}08` : 'transparent',
        border: `1.5px dashed ${hovered ? p.violet : p.border}`,
        borderRadius: 20, padding: '24px 22px',
        cursor: 'pointer',
        transition: 'all 0.15s',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        minHeight: 180, gap: 10,
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: '50%',
        background: hovered ? `${p.violet}15` : p.inputBg,
        border: `1px solid ${hovered ? p.violet : p.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22, color: hovered ? p.violet : p.textMuted,
        transition: 'all 0.15s',
      }}>+</div>
      <span style={{
        fontSize: 13, fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600,
        color: hovered ? p.violet : p.textMuted, transition: 'color 0.15s',
      }}>
        New Project
      </span>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function HomePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const p = usePalette();
  const dark = p.glow;

  const [appState, setAppState] = useState(() => loadState());
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const sync = () => setAppState(loadState());
    sync();
    return onUserChange(sync);
  }, []);

  const user = session?.user;
  const firstName = user?.name?.split(' ')[0] ?? 'there';
  const greet = greeting();

  function handleProjectClick(project: Project) {
    const state = loadState();
    saveState({ ...state, activeProjectId: project.id });
    router.push('/workbench');
  }

  function handleAddProject(project: Project) {
    const state = loadState();
    saveState({
      ...state,
      projects: [...state.projects, project],
      activeProjectId: project.id,
    });
    setAppState(loadState());
  }

  const projects = appState.projects ?? [];
  const activeId = appState.activeProjectId;

  return (
    <div style={{
      minHeight: 'calc(100vh - 64px)',
      background: p.pageBg,
      padding: '52px 40px 80px',
      maxWidth: 1200, margin: '0 auto',
    }}>

      {/* Greeting + avatar */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 52 }}>
        <div>
          {/* Greeting line */}
          <div style={{
            fontSize: 13, fontFamily: "'JetBrains Mono',monospace",
            color: p.violet, letterSpacing: '0.04em', marginBottom: 8,
            textTransform: 'uppercase',
          }}>
            {greet},
          </div>

          {/* Name in brand typography */}
          <div style={{
            fontFamily: "'Space Grotesk',sans-serif",
            fontWeight: 900, fontSize: 54,
            letterSpacing: '-2.5px', lineHeight: 1,
            color: p.textPrimary,
          }}>
            {firstName.toUpperCase().split('').map((ch, i) => (
              <span key={i} style={{
                color: i === 0 ? p.textPrimary : (i % 3 === 0 ? p.coral : i % 3 === 1 ? p.violet : p.textPrimary),
              }}>{ch}</span>
            ))}
            <span style={{
              display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
              background: p.coral, marginLeft: 4, verticalAlign: 'super', flexShrink: 0,
            }} />
          </div>

          <div style={{
            fontSize: 16, color: p.textMuted, fontFamily: "'Inter',sans-serif",
            marginTop: 10, fontWeight: 400,
          }}>
            Which project do you want to dive into today?
          </div>
        </div>

        {/* User avatar */}
        {user?.image ? (
          <img
            src={user.image}
            alt={user.name ?? 'User'}
            style={{ width: 64, height: 64, borderRadius: '50%', border: `2px solid ${p.violet}40` }}
          />
        ) : (
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'linear-gradient(135deg,#534AB7,#7F77DD)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, fontWeight: 700, color: '#EEEDFE',
            fontFamily: "'Space Grotesk',sans-serif",
          }}>
            {firstName[0]?.toUpperCase()}
          </div>
        )}
      </div>

      {/* My Projects */}
      <div style={{
        fontSize: 11, color: p.textMuted, fontFamily: "'JetBrains Mono',monospace",
        letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 18,
      }}>
        My Projects ({projects.length})
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: 18,
      }}>
        {projects.map(project => (
          <ProjectCard
            key={project.id}
            project={project}
            active={project.id === activeId}
            onClick={() => handleProjectClick(project)}
          />
        ))}
        <AddCard onClick={() => setShowModal(true)} />
      </div>

      {/* Invited projects section */}
      <div style={{ marginTop: 56 }}>
        <div style={{
          fontSize: 11, color: p.textMuted, fontFamily: "'JetBrains Mono',monospace",
          letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 18,
        }}>
          Shared With Me
        </div>
        <div style={{
          background: p.cardBg, border: `1px dashed ${p.border}`,
          borderRadius: 20, padding: '36px 28px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>🔗</div>
          <div style={{
            fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600,
            fontSize: 15, color: p.textPrimary, marginBottom: 6,
          }}>
            No shared projects yet
          </div>
          <div style={{ fontSize: 12, color: p.textMuted, fontFamily: "'Inter',sans-serif", lineHeight: 1.6 }}>
            When a teammate invites you to their project, it will appear here.
            <br />
            Invite sharing requires the Supabase connector to be configured in Settings.
          </div>
        </div>
      </div>

      {showModal && (
        <AddProjectModal onClose={() => setShowModal(false)} onAdd={handleAddProject} />
      )}
    </div>
  );
}
