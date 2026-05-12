'use client';
import { useState, useEffect } from 'react';
import { loadState, saveState } from '@/lib/store';

const MODELS = [
  {
    id: 'claude-haiku-4-5',
    name: 'Haiku',
    tagline: 'Fastest & cheapest',
    description: 'Best for simple, well-structured meeting notes. Responses in under a second.',
    costPer: '~$0.002 per MOM',
    speed: 'Very fast',
    quality: 'Good',
    speedPct: 100,
    qualityPct: 60,
    color: '#B6FF6E',
  },
  {
    id: 'claude-sonnet-4-6',
    name: 'Sonnet',
    tagline: 'Best balance',
    description: 'Handles complex notes and ambiguous language well. Recommended for most teams.',
    costPer: '~$0.01 per MOM',
    speed: 'Fast',
    quality: 'Great',
    speedPct: 75,
    qualityPct: 85,
    color: '#56E0FF',
  },
  {
    id: 'claude-opus-4-7',
    name: 'Opus',
    tagline: 'Most capable',
    description: 'Best for long, messy, or technical meeting notes. Catches subtle action items.',
    costPer: '~$0.03 per MOM',
    speed: 'Slower',
    quality: 'Best',
    speedPct: 45,
    qualityPct: 100,
    color: '#8B7CFF',
  },
];

function MiniBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div style={{ flex: 1, height: 5, borderRadius: 3, background: 'rgba(139,124,255,0.1)', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${pct}%`, borderRadius: 3, background: color, boxShadow: `0 0 6px ${color}80`, transition: 'width 0.5s ease' }} />
    </div>
  );
}

export default function SettingsPage() {
  const [selectedModel, setSelectedModel] = useState('claude-haiku-4-5');
  const [saved, setSaved] = useState(false);
  const [projects, setProjects] = useState<{ id: string; name: string; goLiveDate: string; health: string; description: string }[]>([]);
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [newProject, setNewProject] = useState({ name: '', goLiveDate: '', description: '' });
  const [showAddProject, setShowAddProject] = useState(false);

  useEffect(() => {
    const state = loadState();
    setSelectedModel(state.selectedModel || 'claude-haiku-4-5');
    setProjects(state.projects);
  }, []);

  function saveModel(modelId: string) {
    setSelectedModel(modelId);
    const state = loadState();
    state.selectedModel = modelId;
    saveState(state);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function updateProject(id: string, field: string, value: string) {
    const state = loadState();
    state.projects = state.projects.map(p => p.id === id ? { ...p, [field]: value } : p);
    saveState(state);
    setProjects(state.projects);
  }

  function deleteProject(id: string) {
    const state = loadState();
    state.projects = state.projects.filter(p => p.id !== id);
    if (state.activeProjectId === id) state.activeProjectId = state.projects[0]?.id || '';
    saveState(state);
    setProjects(state.projects);
  }

  function addProject() {
    if (!newProject.name.trim()) return;
    const state = loadState();
    const id = newProject.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const project = { id, name: newProject.name, goLiveDate: newProject.goLiveDate, health: 'On Track' as const, description: newProject.description };
    state.projects.push(project);
    saveState(state);
    setProjects(state.projects);
    setNewProject({ name: '', goLiveDate: '', description: '' });
    setShowAddProject(false);
  }

  const inputStyle: React.CSSProperties = {
    background: 'rgba(139,124,255,0.06)',
    border: '1px solid rgba(139,124,255,0.2)',
    borderRadius: 8,
    padding: '8px 12px',
    color: '#EEEDFE',
    fontSize: 13,
    fontFamily: "'Inter',sans-serif",
    outline: 'none',
    width: '100%',
  };

  return (
    <div style={{ padding: '32px 40px', maxWidth: 860, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
          color: '#8B7CFF', fontFamily: "'JetBrains Mono',monospace", marginBottom: 8 }}>Configuration</div>
        <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 36,
          letterSpacing: '-1.2px', color: '#EEEDFE', margin: 0 }}>Settings</h1>
        <p style={{ color: '#7B7796', fontSize: 14, marginTop: 8 }}>Manage your AI model, projects, and preferences.</p>
      </div>

      {/* ── AI Model ──────────────────────────────────────────────── */}
      <section style={{ marginBottom: 48 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 20, color: '#EEEDFE', margin: 0 }}>
            AI Model
          </h2>
          {saved && (
            <span style={{ fontSize: 12, color: '#B6FF6E', fontFamily: "'JetBrains Mono',monospace",
              padding: '4px 12px', borderRadius: 100, background: 'rgba(182,255,110,0.1)', border: '1px solid rgba(182,255,110,0.25)' }}>
              ✓ Saved
            </span>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
          {MODELS.map(m => {
            const active = selectedModel === m.id;
            return (
              <button key={m.id} onClick={() => saveModel(m.id)}
                style={{ textAlign: 'left', padding: 20, borderRadius: 16, cursor: 'pointer',
                  background: active ? `${m.color}10` : 'rgba(28,28,36,0.8)',
                  border: `2px solid ${active ? m.color : 'rgba(139,124,255,0.15)'}`,
                  boxShadow: active ? `0 0 24px ${m.color}25` : 'none',
                  transition: 'all 0.2s', position: 'relative' }}>

                {active && (
                  <div style={{ position: 'absolute', top: 14, right: 14, width: 8, height: 8, borderRadius: '50%',
                    background: m.color, boxShadow: `0 0 8px ${m.color}` }} />
                )}

                <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 18,
                  color: active ? m.color : '#EEEDFE', marginBottom: 2 }}>{m.name}</div>
                <div style={{ fontSize: 11, color: active ? m.color : '#7B7796', marginBottom: 12,
                  fontFamily: "'JetBrains Mono',monospace" }}>{m.tagline}</div>
                <div style={{ fontSize: 12, color: '#7B7796', lineHeight: 1.5, marginBottom: 16 }}>{m.description}</div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 10, color: '#7B7796', fontFamily: "'JetBrains Mono',monospace", width: 44 }}>Speed</span>
                    <MiniBar pct={m.speedPct} color={m.color} />
                    <span style={{ fontSize: 10, color: m.color, fontFamily: "'JetBrains Mono',monospace", width: 52, textAlign: 'right' }}>{m.speed}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 10, color: '#7B7796', fontFamily: "'JetBrains Mono',monospace", width: 44 }}>Quality</span>
                    <MiniBar pct={m.qualityPct} color={m.color} />
                    <span style={{ fontSize: 10, color: m.color, fontFamily: "'JetBrains Mono',monospace", width: 52, textAlign: 'right' }}>{m.quality}</span>
                  </div>
                </div>

                <div style={{ marginTop: 14, fontSize: 11, color: '#7B7796', fontFamily: "'JetBrains Mono',monospace",
                  paddingTop: 12, borderTop: '1px solid rgba(139,124,255,0.1)' }}>{m.costPer}</div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Projects ─────────────────────────────────────────────── */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 20, color: '#EEEDFE', margin: 0 }}>
            Projects
          </h2>
          <button onClick={() => setShowAddProject(true)}
            style={{ padding: '8px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600,
              color: '#EEEDFE', cursor: 'pointer', background: 'linear-gradient(135deg,#534AB7,#7F77DD)',
              border: 'none', fontFamily: "'Space Grotesk',sans-serif", boxShadow: '0 0 16px rgba(83,74,183,0.4)' }}>
            + Add Project
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {projects.map(p => (
            <div key={p.id} style={{ background: 'rgba(28,28,36,0.8)', border: '1px solid rgba(139,124,255,0.15)',
              borderRadius: 14, padding: '16px 20px' }}>
              {editingProject === p.id ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <input value={p.name} onChange={e => updateProject(p.id, 'name', e.target.value)} style={inputStyle} placeholder="Project name" />
                  <input value={p.description} onChange={e => updateProject(p.id, 'description', e.target.value)} style={inputStyle} placeholder="Description" />
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <label style={{ fontSize: 12, color: '#7B7796', whiteSpace: 'nowrap' }}>Go-live date</label>
                    <input type="date" value={p.goLiveDate} onChange={e => updateProject(p.id, 'goLiveDate', e.target.value)} style={{ ...inputStyle, colorScheme: 'dark' }} />
                    <select value={p.health} onChange={e => updateProject(p.id, 'health', e.target.value)}
                      style={{ ...inputStyle, width: 'auto' }}>
                      <option>On Track</option>
                      <option>At Risk</option>
                      <option>Behind</option>
                    </select>
                    <button onClick={() => setEditingProject(null)}
                      style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, color: '#B6FF6E', cursor: 'pointer',
                        background: 'rgba(182,255,110,0.1)', border: '1px solid rgba(182,255,110,0.25)', whiteSpace: 'nowrap' }}>
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, display: 'inline-block',
                    background: p.health === 'On Track' ? '#B6FF6E' : p.health === 'At Risk' ? '#FFCB5C' : '#F0997B',
                    boxShadow: `0 0 6px ${p.health === 'On Track' ? '#B6FF6E' : p.health === 'At Risk' ? '#FFCB5C' : '#F0997B'}` }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 14, color: '#EEEDFE' }}>{p.name}</div>
                    {p.description && <div style={{ fontSize: 12, color: '#7B7796', marginTop: 2 }}>{p.description}</div>}
                  </div>
                  {p.goLiveDate && (
                    <div style={{ fontSize: 11, color: '#7B7796', fontFamily: "'JetBrains Mono',monospace" }}>
                      Go-live: {new Date(p.goLiveDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  )}
                  <button onClick={() => setEditingProject(p.id)}
                    style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, color: '#B7B3DC', cursor: 'pointer',
                      background: 'rgba(139,124,255,0.08)', border: '1px solid rgba(139,124,255,0.2)' }}>
                    Edit
                  </button>
                  <button onClick={() => deleteProject(p.id)}
                    style={{ padding: '6px 12px', borderRadius: 8, fontSize: 12, color: '#F0997B', cursor: 'pointer',
                      background: 'rgba(240,153,123,0.08)', border: '1px solid rgba(240,153,123,0.2)' }}>
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add project form */}
        {showAddProject && (
          <div style={{ marginTop: 14, background: 'rgba(139,124,255,0.06)', border: '1px solid rgba(139,124,255,0.25)',
            borderRadius: 14, padding: 20 }}>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 14, color: '#EEEDFE', marginBottom: 14 }}>
              New Project
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input value={newProject.name} onChange={e => setNewProject(p => ({ ...p, name: e.target.value }))}
                style={inputStyle} placeholder="Project name (e.g. Atlas · Web Rebuild)" />
              <input value={newProject.description} onChange={e => setNewProject(p => ({ ...p, description: e.target.value }))}
                style={inputStyle} placeholder="Short description (optional)" />
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <label style={{ fontSize: 12, color: '#7B7796', whiteSpace: 'nowrap' }}>Go-live date</label>
                <input type="date" value={newProject.goLiveDate} onChange={e => setNewProject(p => ({ ...p, goLiveDate: e.target.value }))}
                  style={{ ...inputStyle, colorScheme: 'dark' }} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={addProject}
                  style={{ padding: '9px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, color: '#EEEDFE', cursor: 'pointer',
                    background: 'linear-gradient(135deg,#534AB7,#7F77DD)', border: 'none', fontFamily: "'Space Grotesk',sans-serif" }}>
                  Add Project
                </button>
                <button onClick={() => setShowAddProject(false)}
                  style={{ padding: '9px 20px', borderRadius: 10, fontSize: 13, color: '#7B7796', cursor: 'pointer',
                    background: 'none', border: '1px solid rgba(139,124,255,0.2)' }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
