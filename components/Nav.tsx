'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { loadState, saveState, onUserChange } from '@/lib/store';
import { useTheme } from '@/lib/theme';
import { loadProfile, getInitials } from '@/lib/userProfile';
import type { Project } from '@/lib/types';

const NAV_ITEMS = [
  { href: '/workbench', label: 'Workbench' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/tasks', label: 'Tasks' },
  { href: '/activity', label: 'Activity' },
  { href: '/summary', label: 'Summary' },
];

function ShantanuMark({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" aria-hidden="true">
      <circle cx="30" cy="30" r="24" fill="#26215C" />
      <circle cx="30" cy="30" r="17.5" fill="#1e1a4e" />
      <path d="M 22.3 24.2 C 22.3 19 26.1 16.6 30.5 16.6 C 34.9 16.6 37.2 20.8 37.2 25 C 37.2 29.2 33.9 31.3 30.5 33 C 27.1 34.7 23.7 37 23.7 41.5 C 23.7 45.1 27.6 47.5 32 47.5 C 36.4 47.5 38.9 44.5 40.7 41.4"
        fill="none" stroke="#EEEDFE" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="22.3" cy="24.2" r="2.2" fill="#F0997B" />
      <circle cx="40.7" cy="41.4" r="2.2" fill="#F0997B" />
    </svg>
  );
}

export default function Nav() {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const { data: session } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeId, setActiveId] = useState('viasat');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [addingProject, setAddingProject] = useState(false);
  const [newName, setNewName] = useState('');
  const [userInitials, setUserInitials] = useState('ST');
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const newNameRef = useRef<HTMLInputElement>(null);

  const dark = theme === 'dark';

  useEffect(() => {
    if (session?.user?.id) {
      const profile = loadProfile(session.user.id);
      if (profile) {
        setUserInitials(profile.initials);
      } else if (session.user.name) {
        setUserInitials(getInitials(session.user.name));
      }
      if (session.user.image) setUserAvatar(session.user.image);
    }
  }, [session?.user?.id, session?.user?.name, session?.user?.image]);

  useEffect(() => {
    const sync = () => {
      const state = loadState();
      setProjects(state.projects);
      setActiveId(state.activeProjectId);
    };
    sync();
    window.addEventListener('shantanu-project-change', sync);
    const unsub = onUserChange(sync);
    return () => {
      window.removeEventListener('shantanu-project-change', sync);
      unsub();
    };
  }, []);

  const activeProject = projects.find(p => p.id === activeId);
  const healthColor = (h: string) => h === 'On Track' ? '#B6FF6E' : h === 'At Risk' ? '#FFCB5C' : '#F0997B';

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

  const dropdownBg = dark ? '#19163a' : '#FFFFFF';
  const dropdownBorder = dark ? 'rgba(139,124,255,0.25)' : 'rgba(83,74,183,0.15)';
  const dropdownText = dark ? '#B7B3DC' : '#3D3960';

  return (
    <header style={{
      height: 64, padding: '0 36px', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', borderBottom: `1px solid ${dark ? 'rgba(139,124,255,0.18)' : 'rgba(83,74,183,0.12)'}`,
      background: dark ? 'rgba(28,28,36,0.6)' : 'rgba(242,241,252,0.85)',
      backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 50,
      transition: 'background 0.25s ease, border-color 0.25s ease',
    }}>

      {/* Logo + project picker */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <ShantanuMark size={34} />
          <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 900, fontSize: 15,
            letterSpacing: '-1.5px', color: dark ? '#EEEDFE' : '#1C1C24', lineHeight: 1 }}>
            SHAN<span style={{ color: '#7F77DD' }}>TANU</span>
            <span style={{ display: 'inline-block', width: 5, height: 5, borderRadius: '50%',
              background: '#F0997B', marginLeft: 1, verticalAlign: 'super' }} />
          </span>
        </Link>

        <div style={{ width: 1, height: 22, background: dark ? 'rgba(139,124,255,0.2)' : 'rgba(83,74,183,0.15)' }} />

        {/* Project picker */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => { setPickerOpen(!pickerOpen); setAvatarOpen(false); }}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 12px', borderRadius: 10,
              cursor: 'pointer', background: dark ? 'rgba(139,124,255,0.08)' : 'rgba(83,74,183,0.06)',
              border: `1px solid ${dark ? 'rgba(139,124,255,0.18)' : 'rgba(83,74,183,0.15)'}`,
              color: dark ? '#EEEDFE' : '#1C1C24', fontFamily: "'Space Grotesk',sans-serif", fontSize: 13, fontWeight: 500 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
              background: activeProject ? healthColor(activeProject.health) : '#B6FF6E',
              boxShadow: dark ? `0 0 7px ${activeProject ? healthColor(activeProject.health) : '#B6FF6E'}` : 'none' }} />
            <span style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {activeProject?.name || 'Select project'}
            </span>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          {pickerOpen && (
            <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, minWidth: 220,
              borderRadius: 14, padding: '6px 0', zIndex: 60, background: dropdownBg,
              border: `1px solid ${dropdownBorder}`, boxShadow: '0 16px 40px rgba(0,0,0,0.25)' }}>
              {projects.map(p => (
                <button key={p.id} onClick={() => selectProject(p.id)}
                  style={{ width: '100%', textAlign: 'left', padding: '9px 16px',
                    display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer',
                    background: 'none', border: 'none',
                    color: p.id === activeId ? '#8B7CFF' : dropdownText,
                    fontSize: 13, fontFamily: "'Inter',sans-serif" }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                    background: healthColor(p.health),
                    boxShadow: dark ? `0 0 6px ${healthColor(p.health)}` : 'none' }} />
                  {p.name}
                  {p.id === activeId && <span style={{ marginLeft: 'auto', fontSize: 10, color: '#8B7CFF' }}>✓</span>}
                </button>
              ))}
              <div style={{ height: 1, margin: '5px 0', background: dropdownBorder }} />
              {addingProject ? (
                <div style={{ padding: '8px 12px', display: 'flex', gap: 6 }}>
                  <input ref={newNameRef} value={newName} onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') confirmAddProject(); if (e.key === 'Escape') setAddingProject(false); }}
                    placeholder="Project name…"
                    style={{ flex: 1, background: dark ? 'rgba(139,124,255,0.12)' : 'rgba(83,74,183,0.06)',
                      border: `1px solid ${dropdownBorder}`, borderRadius: 7, padding: '5px 9px',
                      color: dark ? '#EEEDFE' : '#1C1C24', fontSize: 12, fontFamily: "'Inter',sans-serif", outline: 'none' }} />
                  <button onClick={confirmAddProject}
                    style={{ padding: '5px 10px', borderRadius: 7, fontSize: 12, color: '#EEEDFE',
                      cursor: 'pointer', background: 'linear-gradient(135deg,#534AB7,#7F77DD)', border: 'none', fontWeight: 600 }}>
                    Add
                  </button>
                </div>
              ) : (
                <button onClick={startAddProject}
                  style={{ width: '100%', textAlign: 'left', padding: '9px 16px', cursor: 'pointer',
                    background: 'none', border: 'none', color: '#7B7796', fontSize: 12,
                    fontFamily: "'Inter',sans-serif", display: 'flex', alignItems: 'center', gap: 8 }}>
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
                color: active ? (dark ? '#EEEDFE' : '#1C1C24') : '#7B7796',
                fontFamily: "'Inter',sans-serif", paddingBottom: 4 }}>
              {item.label}
              {active && <span style={{ position: 'absolute', bottom: -20, left: 0, right: 0,
                height: 2, borderRadius: 1, background: '#F0997B' }} />}
            </Link>
          );
        })}
      </nav>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '5px 12px', borderRadius: 100,
          background: dark ? 'rgba(28,28,36,0.8)' : 'rgba(182,255,110,0.1)',
          border: `1px solid ${dark ? 'rgba(139,124,255,0.18)' : 'rgba(182,255,110,0.3)'}`,
          fontSize: 11, color: '#B6FF6E', fontFamily: "'JetBrains Mono',monospace" }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#B6FF6E',
            boxShadow: dark ? '0 0 8px #B6FF6E' : 'none', display: 'inline-block' }} />
          Live
        </div>

        {/* Avatar — click for dropdown */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => { setAvatarOpen(!avatarOpen); setPickerOpen(false); }}
            style={{ width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none',
              background: userAvatar ? 'transparent' : 'linear-gradient(135deg,#534AB7,#7F77DD)',
              color: '#EEEDFE', fontFamily: "'Space Grotesk',sans-serif", overflow: 'hidden',
              boxShadow: dark ? '0 0 18px rgba(139,124,255,0.5)' : '0 2px 8px rgba(83,74,183,0.3)' }}>
            {userAvatar
              ? <img src={userAvatar} alt="" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }} />
              : userInitials}
          </button>

          {avatarOpen && (
            <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 210,
              borderRadius: 14, padding: '6px 0', zIndex: 60, background: dropdownBg,
              border: `1px solid ${dropdownBorder}`, boxShadow: '0 16px 40px rgba(0,0,0,0.25)' }}>

              {/* User info */}
              {session?.user && (
                <>
                  <div style={{ padding: '10px 16px 8px' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: dropdownText, fontFamily: "'Space Grotesk',sans-serif" }}>
                      {session.user.name}
                    </div>
                    <div style={{ fontSize: 11, color: dark ? '#7B7796' : '#7B7796', fontFamily: "'JetBrains Mono',monospace", marginTop: 2 }}>
                      {session.user.email}
                    </div>
                  </div>
                  <div style={{ height: 1, margin: '4px 0', background: dropdownBorder }} />
                </>
              )}

              {/* Theme toggle */}
              <button onClick={() => { toggle(); setAvatarOpen(false); }}
                style={{ width: '100%', textAlign: 'left', padding: '10px 16px', cursor: 'pointer',
                  background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: 10,
                  color: dropdownText, fontSize: 13, fontFamily: "'Inter',sans-serif" }}>
                <span style={{ fontSize: 15 }}>{dark ? '☀️' : '🌙'}</span>
                {dark ? 'Light' : 'Dark'} mode
              </button>

              {/* Invite */}
              <Link href="/invite" onClick={() => setAvatarOpen(false)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
                  textDecoration: 'none', color: dropdownText, fontSize: 13, fontFamily: "'Inter',sans-serif" }}>
                <span style={{ fontSize: 15 }}>✉️</span>
                Invite team
              </Link>

              {/* Settings */}
              <Link href="/settings" onClick={() => setAvatarOpen(false)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
                  textDecoration: 'none', color: dropdownText, fontSize: 13, fontFamily: "'Inter',sans-serif" }}>
                <span style={{ fontSize: 15 }}>⚙️</span>
                Settings
              </Link>

              <div style={{ height: 1, margin: '4px 0', background: dropdownBorder }} />

              {/* Sign out */}
              <button onClick={async () => {
                  await signOut({ redirect: false });
                  window.location.replace('/');
                }}
                style={{ width: '100%', textAlign: 'left', padding: '10px 16px', cursor: 'pointer',
                  background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: 10,
                  color: dark ? '#F0997B' : '#D9614A', fontSize: 13, fontFamily: "'Inter',sans-serif" }}>
                <span style={{ fontSize: 15 }}>→</span>
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Close overlays */}
      {(pickerOpen || avatarOpen) && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 55 }}
          onClick={() => { setPickerOpen(false); setAvatarOpen(false); setAddingProject(false); }} />
      )}
    </header>
  );
}
