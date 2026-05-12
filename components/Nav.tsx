'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
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

export default function Nav() {
  const pathname = usePathname();
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeId, setActiveId] = useState('atlas');
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    const state = loadState();
    setProjects(state.projects);
    setActiveId(state.activeProjectId);
  }, []);

  const activeProject = projects.find(p => p.id === activeId);

  function selectProject(id: string) {
    setActiveId(id);
    const state = loadState();
    state.activeProjectId = id;
    saveState(state);
    setPickerOpen(false);
    window.dispatchEvent(new Event('shantanu-project-change'));
  }

  return (
    <header className="relative h-16 px-9 flex items-center justify-between border-b"
      style={{ borderColor: 'rgba(139,124,255,0.18)', background: 'rgba(28,28,36,0.6)', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 50 }}>

      {/* Logo + project picker */}
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#534AB7,#7F77DD)' }}>
            <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 13, color: '#EEEDFE' }}>S</span>
          </div>
          <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 16, color: '#EEEDFE', letterSpacing: '-0.3px' }}>Shantanu</span>
        </Link>

        <div style={{ width: 1, height: 20, background: 'rgba(139,124,255,0.2)' }} />

        {/* Project picker */}
        <div className="relative">
          <button onClick={() => setPickerOpen(!pickerOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors"
            style={{ background: 'rgba(139,124,255,0.08)', border: '1px solid rgba(139,124,255,0.18)', color: '#EEEDFE', fontFamily: "'Space Grotesk',sans-serif" }}>
            <span style={{ width: 6, height: 6, borderRadius: 3, background: '#B6FF6E', boxShadow: '0 0 8px #B6FF6E', flexShrink: 0, display: 'inline-block' }} />
            <span className="max-w-[180px] truncate">{activeProject?.name || 'Select project'}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          {pickerOpen && (
            <div className="absolute top-full left-0 mt-2 w-64 rounded-xl py-1 z-50"
              style={{ background: '#19163a', border: '1px solid rgba(139,124,255,0.25)', boxShadow: '0 16px 40px rgba(0,0,0,0.5)' }}>
              {projects.map(p => (
                <button key={p.id} onClick={() => selectProject(p.id)}
                  className="w-full text-left px-4 py-2.5 flex items-center gap-2 transition-colors hover:bg-white/5"
                  style={{ color: p.id === activeId ? '#8B7CFF' : '#B7B3DC', fontSize: 13 }}>
                  <span style={{ width: 6, height: 6, borderRadius: 3, flexShrink: 0, display: 'inline-block',
                    background: p.health === 'On Track' ? '#B6FF6E' : p.health === 'At Risk' ? '#FFCB5C' : '#F0997B',
                    boxShadow: p.health === 'On Track' ? '0 0 6px #B6FF6E' : p.health === 'At Risk' ? '0 0 6px #FFCB5C' : '0 0 6px #F0997B' }} />
                  {p.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Nav links */}
      <nav className="hidden md:flex items-center gap-7">
        {NAV_ITEMS.map(item => {
          const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}
              className="text-sm font-medium transition-colors relative"
              style={{ color: active ? '#EEEDFE' : '#7B7796', fontFamily: "'Inter',sans-serif" }}>
              {item.label}
              {active && <span className="absolute -bottom-5 left-0 right-0 h-0.5 rounded-full" style={{ background: '#F0997B' }} />}
            </Link>
          );
        })}
      </nav>

      {/* Right side */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs"
          style={{ background: 'rgba(28,28,36,0.8)', border: '1px solid rgba(139,124,255,0.18)', color: '#B6FF6E', fontFamily: "'JetBrains Mono',monospace" }}>
          <span style={{ width: 6, height: 6, borderRadius: 3, background: '#B6FF6E', boxShadow: '0 0 8px #B6FF6E', display: 'inline-block' }} />
          Live
        </div>
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
          style={{ background: 'linear-gradient(135deg,#534AB7,#7F77DD)', color: '#EEEDFE', fontFamily: "'Space Grotesk',sans-serif", boxShadow: '0 0 18px rgba(139,124,255,0.5)' }}>
          RM
        </div>
      </div>

      {pickerOpen && <div className="fixed inset-0 z-40" onClick={() => setPickerOpen(false)} />}
    </header>
  );
}
