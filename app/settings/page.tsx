'use client';
import { useState, useEffect } from 'react';
import { loadState, saveState } from '@/lib/store';
import { usePalette } from '@/lib/palette';

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
    color: 'lime' as const,
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
    color: 'cyan' as const,
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
    color: 'violet' as const,
  },
];

function MiniBar({ pct, color, trackBg }: { pct: number; color: string; trackBg: string }) {
  return (
    <div style={{ flex: 1, height: 5, borderRadius: 3, background: trackBg, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${pct}%`, borderRadius: 3, background: color, transition: 'width 0.5s ease' }} />
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

  const p = usePalette();

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
    state.projects = state.projects.map(proj => proj.id === id ? { ...proj, [field]: value } : proj);
    saveState(state);
    setProjects(state.projects);
  }

  function deleteProject(id: string) {
    const state = loadState();
    state.projects = state.projects.filter(proj => proj.id !== id);
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
    background: p.inputBg,
    border: `1px solid ${p.border}`,
    borderRadius: 8,
    padding: '8px 12px',
    color: p.textPrimary,
    fontSize: 13,
    fontFamily: "'Inter',sans-serif",
    outline: 'none',
    width: '100%',
  };

  return (
    <div style={{ background: p.pageBg, minHeight: '100vh' }}>
      <div style={{ padding: '32px 40px', maxWidth: 860, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
            color: p.violet, fontFamily: "'JetBrains Mono',monospace", marginBottom: 8 }}>Configuration</div>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 36,
            letterSpacing: '-1.2px', color: p.textPrimary, margin: 0 }}>Settings</h1>
          <p style={{ color: p.textMuted, fontSize: 14, marginTop: 8 }}>Manage your AI model, projects, and preferences.</p>
        </div>

        {/* ── AI Model ──────────────────────────────────────────────── */}
        <section style={{ marginBottom: 48 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 20, color: p.textPrimary, margin: 0 }}>
              AI Model
            </h2>
            {saved && (
              <span style={{ fontSize: 12, color: p.lime, fontFamily: "'JetBrains Mono',monospace",
                padding: '4px 12px', borderRadius: 100, background: `${p.lime}1A`, border: `1px solid ${p.lime}40` }}>
                ✓ Saved
              </span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
            {MODELS.map(m => {
              const active = selectedModel === m.id;
              const color = p[m.color];
              return (
                <button key={m.id} onClick={() => saveModel(m.id)}
                  style={{ textAlign: 'left', padding: 20, borderRadius: 16, cursor: 'pointer',
                    background: active ? `${color}12` : p.cardBg,
                    border: `2px solid ${active ? color : p.border}`,
                    boxShadow: active ? (p.glow ? `0 0 24px ${color}25` : 'none') : 'none',
                    transition: 'all 0.2s', position: 'relative' }}>

                  {active && (
                    <div style={{ position: 'absolute', top: 14, right: 14, width: 8, height: 8, borderRadius: '50%',
                      background: color, boxShadow: p.glow ? `0 0 8px ${color}` : 'none' }} />
                  )}

                  <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 18,
                    color: active ? color : p.textPrimary, marginBottom: 2 }}>{m.name}</div>
                  <div style={{ fontSize: 11, color: active ? color : p.textMuted, marginBottom: 12,
                    fontFamily: "'JetBrains Mono',monospace" }}>{m.tagline}</div>
                  <div style={{ fontSize: 12, color: p.textMuted, lineHeight: 1.5, marginBottom: 16 }}>{m.description}</div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 10, color: p.textMuted, fontFamily: "'JetBrains Mono',monospace", width: 44 }}>Speed</span>
                      <MiniBar pct={m.speedPct} color={color} trackBg={p.inputBg} />
                      <span style={{ fontSize: 10, color: color, fontFamily: "'JetBrains Mono',monospace", width: 52, textAlign: 'right' }}>{m.speed}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 10, color: p.textMuted, fontFamily: "'JetBrains Mono',monospace", width: 44 }}>Quality</span>
                      <MiniBar pct={m.qualityPct} color={color} trackBg={p.inputBg} />
                      <span style={{ fontSize: 10, color: color, fontFamily: "'JetBrains Mono',monospace", width: 52, textAlign: 'right' }}>{m.quality}</span>
                    </div>
                  </div>

                  <div style={{ marginTop: 14, fontSize: 11, color: p.textMuted, fontFamily: "'JetBrains Mono',monospace",
                    paddingTop: 12, borderTop: `1px solid ${p.borderTint}` }}>{m.costPer}</div>
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Projects ─────────────────────────────────────────────── */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 20, color: p.textPrimary, margin: 0 }}>
              Projects
            </h2>
            <button onClick={() => setShowAddProject(true)}
              style={{ padding: '8px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                color: '#EEEDFE', cursor: 'pointer', background: 'linear-gradient(135deg,#534AB7,#7F77DD)',
                border: 'none', fontFamily: "'Space Grotesk',sans-serif",
                boxShadow: p.glow ? '0 0 16px rgba(83,74,183,0.4)' : 'none' }}>
              + Add Project
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {projects.map(proj => (
              <div key={proj.id} style={{ background: p.cardBg, border: `1px solid ${p.border}`,
                borderRadius: 14, padding: '16px 20px' }}>
                {editingProject === proj.id ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <input value={proj.name} onChange={e => updateProject(proj.id, 'name', e.target.value)} style={inputStyle} placeholder="Project name" />
                    <input value={proj.description} onChange={e => updateProject(proj.id, 'description', e.target.value)} style={inputStyle} placeholder="Description" />
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <label style={{ fontSize: 12, color: p.textMuted, whiteSpace: 'nowrap' }}>Go-live date</label>
                      <input type="date" value={proj.goLiveDate} onChange={e => updateProject(proj.id, 'goLiveDate', e.target.value)}
                        style={{ ...inputStyle, colorScheme: p.glow ? 'dark' : 'light' }} />
                      <select value={proj.health} onChange={e => updateProject(proj.id, 'health', e.target.value)}
                        style={{ ...inputStyle, width: 'auto' }}>
                        <option>On Track</option>
                        <option>At Risk</option>
                        <option>Behind</option>
                      </select>
                      <button onClick={() => setEditingProject(null)}
                        style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, color: p.lime, cursor: 'pointer',
                          background: `${p.lime}1A`, border: `1px solid ${p.lime}40`, whiteSpace: 'nowrap' }}>
                        Done
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, display: 'inline-block',
                      background: proj.health === 'On Track' ? p.lime : proj.health === 'At Risk' ? p.amber : p.coral,
                      boxShadow: p.glow ? `0 0 6px ${proj.health === 'On Track' ? p.lime : proj.health === 'At Risk' ? p.amber : p.coral}` : 'none' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 14, color: p.textPrimary }}>{proj.name}</div>
                      {proj.description && <div style={{ fontSize: 12, color: p.textMuted, marginTop: 2 }}>{proj.description}</div>}
                    </div>
                    {proj.goLiveDate && (
                      <div style={{ fontSize: 11, color: p.textMuted, fontFamily: "'JetBrains Mono',monospace" }}>
                        Go-live: {new Date(proj.goLiveDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    )}
                    <button onClick={() => setEditingProject(proj.id)}
                      style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, color: p.textBody, cursor: 'pointer',
                        background: p.inputBg, border: `1px solid ${p.border}` }}>
                      Edit
                    </button>
                    <button onClick={() => deleteProject(proj.id)}
                      style={{ padding: '6px 12px', borderRadius: 8, fontSize: 12, color: p.coral, cursor: 'pointer',
                        background: `${p.coral}14`, border: `1px solid ${p.coral}33` }}>
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Add project form */}
          {showAddProject && (
            <div style={{ marginTop: 14, background: p.inputBg, border: `1px solid ${p.border}`,
              borderRadius: 14, padding: 20 }}>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 14, color: p.textPrimary, marginBottom: 14 }}>
                New Project
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input value={newProject.name} onChange={e => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                  style={inputStyle} placeholder="Project name (e.g. Atlas · Web Rebuild)" />
                <input value={newProject.description} onChange={e => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                  style={inputStyle} placeholder="Short description (optional)" />
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <label style={{ fontSize: 12, color: p.textMuted, whiteSpace: 'nowrap' }}>Go-live date</label>
                  <input type="date" value={newProject.goLiveDate} onChange={e => setNewProject(prev => ({ ...prev, goLiveDate: e.target.value }))}
                    style={{ ...inputStyle, colorScheme: p.glow ? 'dark' : 'light' }} />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={addProject}
                    style={{ padding: '9px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, color: '#EEEDFE', cursor: 'pointer',
                      background: 'linear-gradient(135deg,#534AB7,#7F77DD)', border: 'none', fontFamily: "'Space Grotesk',sans-serif" }}>
                    Add Project
                  </button>
                  <button onClick={() => setShowAddProject(false)}
                    style={{ padding: '9px 20px', borderRadius: 10, fontSize: 13, color: p.textMuted, cursor: 'pointer',
                      background: 'none', border: `1px solid ${p.border}` }}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
