'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { loadState, saveState } from '@/lib/store';
import type { Project } from '@/lib/types';

const NAV_ITEMS = [
  { href: '/', label: 'Home' },
  { href: '/workbench', label: 'Workbench' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/activity', label: 'Activity' },
  { href: '/summary', label: 'Summary' },
  { href: '/settings', label: 'Settings' },
];

// Brand mark SVG — from design assets
function ShantanuMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" aria-hidden="true">
      <circle cx="30" cy="30" r="24" fill="#26215C" />
      <circle cx="30" cy="30" r="17.5" fill="#1e1a4e" />
      <path
        d="M 22.3 24.2 C 22.3 19 26.1 16.6 30.5 16.6 C 34.9 16.6 37.2 20.8 37.2 25 C 37.2 29.2 33.9 31.3 30.5 33 C 27.1 34.7 23.7 37 23.7 41.5 C 23.7 45.1 27.6 47.5 32 47.5 C 36.4 47.5 38.9 44.5 40.7 41.4"
        fill="none" stroke="#EEEDFE" strokeWidth="2.4" strokeLinecap="round"
      />
      <circle cx="22.3" cy="24.2" r="2.2" fill="#F0997B" />
      <circle cx="40.7" cy="41.4" r="2.2" fill="#F0997B" />
    </svg>
  );
}

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeId, setActiveId] = useState('viasat');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [addingProject, setAddingProject] = useState(false);
  const [newName, setNewName] = useState('');
  const newNameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const sync = () => {
      const state = loadState();
      setProjects(state.projects);
      setActiveId(state.activeProjectId);
    };
    sync();
    window.addEventListener('shantanu-project-change', sync);
    return () => window.removeEventListener('shantanu-project-change', sync);
  }, []);

  const activeProject = projects.find(p => p.id === activeId);

  function selectProject(id: string) {
    setActiveId(id);
    const state = loadState();
    state.activeProjectId = id;
    saveState(state);
    setPickerOpen(false);
    setAddingProject(false);
    window.dispatchEvent(new Event('shantanu-project-change'));
  }

  function startAddProject() {
    setAddingProject(true);
    setNewName('');
    setTimeout(() => newNameRef.current?.focus(), 50);
  }

  function confirmAddProject() {
    const name = newName.trim();
    if (!name) { setAddingProject(false); return; }
    const id = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now().toString().slice(-4);
    const state = loadState();
    const project: Project = { id, name, goLiveDate: '', health: 'On Track', description: '' };
    state.projects.push(project);
    state.activeProjectId = id;
    saveState(state);
    setProjects(state.projects);
    setActiveId(id);
    setAddingProject(false);
    setNewName('');
    window.dispatchEvent(new Event('shantanu-project-change'));
  }

  const healthColor = (h: string) => h === 'On Track' ? '#B6FF6E' : h === 'At Risk' ? '#FFCB5C' : '#F0997B';

  return (
    <header style={{
      height: 64, padding: '0 36px', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', borderBottom: '1px solid rgba(139,124,255,0.18)',
      background: 'rgba(28,28,36,0.6)', backdropFilter: 'blur(10px)',
      position: 'sticky', top: 0, zIndex: 50,
    }}>

      {/* Logo + project picker */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>

        {/* Brand lockup — matches design system exactly */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <ShantanuMark size={34} />
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1, gap: 0 }}>
            <span style={{
              fontFamily: "'Space Grotesk',sans-serif", fontWeight: 900, fontSize: 15,
              letterSpacing: '-1.5px', color: '#EEEDFE', lineHeight: 1,
            }}>
              SHAN<span style={{ color: '#7F77DD' }}>TANU</span>
              <span style={{ display: 'inline-block', width: 5, height: 5, borderRadius: '50%',
                background: '#F0997B', marginLeft: 1, verticalAlign: 'super', transform: 'translateY(2px)' }} />
            </span>
          </div>
        </Link>

        <div style={{ width: 1, height: 22, background: 'rgba(139,124,255,0.2)' }} />

        {/* Project picker */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => { setPickerOpen(!pickerOpen); setAddingProject(false); }}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 12px',
              borderRadius: 10, cursor: 'pointer',
              background: 'rgba(139,124,255,0.08)', border: '1px solid rgba(139,124,255,0.18)',
              color: '#EEEDFE', fontFamily: "'Space Grotesk',sans-serif", fontSize: 13, fontWeight: 500 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, display: 'inline-block',
              background: activeProject ? healthColor(activeProject.health) : '#B6FF6E',
              boxShadow: `0 0 7px ${activeProject ? healthColor(activeProject.health) : '#B6FF6E'}` }} />
            <span style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {activeProject?.name || 'Select project'}
            </span>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          {pickerOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', left: 0, minWidth: 220,
              borderRadius: 14, padding: '6px 0', zIndex: 60,
              background: '#19163a', border: '1px solid rgba(139,124,255,0.25)',
              boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
            }}>
              {projects.map(p => (
                <button key={p.id} onClick={() => selectProject(p.id)}
                  style={{ width: '100%', textAlign: 'left', padding: '9px 16px',
                    display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer',
                    background: 'none', border: 'none',
                    color: p.id === activeId ? '#8B7CFF' : '#B7B3DC', fontSize: 13,
                    fontFamily: "'Inter',sans-serif" }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                    background: healthColor(p.health), boxShadow: `0 0 6px ${healthColor(p.health)}` }} />
                  {p.name}
                  {p.id === activeId && <span style={{ marginLeft: 'auto', fontSize: 10, color: '#8B7CFF' }}>✓</span>}
                </button>
              ))}

              {/* Divider */}
              <div style={{ height: 1, margin: '5px 0', background: 'rgba(139,124,255,0.15)' }} />

              {/* Add project inline */}
              {addingProject ? (
                <div style={{ padding: '8px 12px', display: 'flex', gap: 6 }}>
                  <input
                    ref={newNameRef}
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') confirmAddProject(); if (e.key === 'Escape') setAddingProject(false); }}
                    placeholder="Project name…"
                    style={{ flex: 1, background: 'rgba(139,124,255,0.12)', border: '1px solid rgba(139,124,255,0.3)',
                      borderRadius: 7, padding: '5px 9px', color: '#EEEDFE', fontSize: 12,
                      fontFamily: "'Inter',sans-serif", outline: 'none' }}
                  />
                  <button onClick={confirmAddProject}
                    style={{ padding: '5px 10px', borderRadius: 7, fontSize: 12, color: '#EEEDFE', cursor: 'pointer',
                      background: 'linear-gradient(135deg,#534AB7,#7F77DD)', border: 'none', fontWeight: 600 }}>
                    Add
                  </button>
                </div>
              ) : (
                <button onClick={startAddProject}
                  style={{ width: '100%', textAlign: 'left', padding: '9px 16px', cursor: 'pointer',
                    background: 'none', border: 'none', color: '#7B7796', fontSize: 12,
                    fontFamily: "'Inter',sans-serif", display: 'flex', alignItems: 'center', gap: 8 }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#8B7CFF')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#7B7796')}>
                  <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Add project
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Nav links */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
        {NAV_ITEMS.map(item => {
          const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}
              style={{ fontSize: 13, fontWeight: 500, textDecoration: 'none', position: 'relative',
                color: active ? '#EEEDFE' : '#7B7796', fontFamily: "'Inter',sans-serif", paddingBottom: 4 }}>
              {item.label}
              {active && (
                <span style={{ position: 'absolute', bottom: -20, left: 0, right: 0,
                  height: 2, borderRadius: 1, background: '#F0997B' }} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '5px 12px',
          borderRadius: 100, background: 'rgba(28,28,36,0.8)',
          border: '1px solid rgba(139,124,255,0.18)', fontSize: 11,
          color: '#B6FF6E', fontFamily: "'JetBrains Mono',monospace" }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#B6FF6E',
            boxShadow: '0 0 8px #B6FF6E', display: 'inline-block' }} />
          Live
        </div>
        <div style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex',
          alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700,
          background: 'linear-gradient(135deg,#534AB7,#7F77DD)', color: '#EEEDFE',
          fontFamily: "'Space Grotesk',sans-serif", boxShadow: '0 0 18px rgba(139,124,255,0.5)' }}>
          ST
        </div>
      </div>

      {pickerOpen && <div style={{ position: 'fixed', inset: 0, zIndex: 55 }} onClick={() => { setPickerOpen(false); setAddingProject(false); }} />}
    </header>
  );
}
