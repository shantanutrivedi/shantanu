'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { loadState, saveState } from '@/lib/store';
import { usePalette } from '@/lib/palette';
import {
  loadAIConfig, saveAIConfig, loadJiraConfig, saveJiraConfig,
  ANTHROPIC_MODELS, OPENAI_MODELS, GEMINI_MODELS,
  type AIConfig, type JiraConfig, type AIProvider,
} from '@/lib/userConfig';

// ── Sidebar nav ───────────────────────────────────────────────────────────────

type Section = 'ai' | 'connectors' | 'projects';

const SECTIONS: { id: Section; label: string; icon: string }[] = [
  { id: 'ai',         label: 'AI Configuration', icon: '✦' },
  { id: 'connectors', label: 'Connectors',        icon: '⟳' },
  { id: 'projects',   label: 'Projects',          icon: '◈' },
];

// ── Shared input style hook ───────────────────────────────────────────────────

function useInputStyle() {
  const p = usePalette();
  return {
    background: p.inputBg,
    border: `1px solid ${p.border}`,
    borderRadius: 8,
    padding: '9px 13px',
    color: p.textPrimary,
    fontSize: 13,
    fontFamily: "'Inter',sans-serif",
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.15s',
  };
}

// ── AI Configuration section ──────────────────────────────────────────────────

const PROVIDERS: { id: AIProvider; label: string; color: string; lightColor: string }[] = [
  { id: 'anthropic', label: 'Anthropic Claude', color: '#8B7CFF', lightColor: '#5548D9' },
  { id: 'openai',    label: 'OpenAI',           color: '#56E0FF', lightColor: '#007FAA' },
  { id: 'gemini',    label: 'Google Gemini',    color: '#B6FF6E', lightColor: '#4A9200' },
];

function AISection({ userId }: { userId: string }) {
  const p = usePalette();
  const inputStyle = useInputStyle();
  const [cfg, setCfg] = useState<AIConfig | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setCfg(loadAIConfig(userId)); }, [userId]);

  if (!cfg) return null;

  function update(patch: Partial<AIConfig>) {
    setCfg(prev => prev ? { ...prev, ...patch } : prev);
  }

  function save() {
    if (!cfg) return;
    const state = loadState();
    // Sync selected model into app state so existing MOM parsing still works
    const modelMap: Record<AIProvider, string> = {
      anthropic: cfg.anthropicModel,
      openai: cfg.openaiModel,
      gemini: cfg.geminiModel,
    };
    state.selectedModel = modelMap[cfg.provider];
    saveState(state);
    saveAIConfig(userId, cfg);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const models = cfg.provider === 'anthropic' ? ANTHROPIC_MODELS
    : cfg.provider === 'openai' ? OPENAI_MODELS
    : GEMINI_MODELS;

  const keyField = cfg.provider === 'anthropic' ? 'anthropicKey'
    : cfg.provider === 'openai' ? 'openaiKey'
    : 'geminiKey';

  const modelField = cfg.provider === 'anthropic' ? 'anthropicModel'
    : cfg.provider === 'openai' ? 'openaiModel'
    : 'geminiModel';

  const currentKey = cfg[keyField as keyof AIConfig] as string;
  const currentModel = cfg[modelField as keyof AIConfig] as string;

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em',
    textTransform: 'uppercase', color: p.textMuted,
    fontFamily: "'JetBrains Mono',monospace", marginBottom: 6,
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 22, color: p.textPrimary, margin: 0, letterSpacing: '-0.4px' }}>
            AI Configuration
          </h2>
          <p style={{ color: p.textMuted, fontSize: 13, marginTop: 4, fontFamily: "'Inter',sans-serif" }}>
            Your own API credentials — never shared with other users.
          </p>
        </div>
        {saved && (
          <span style={{ fontSize: 12, color: p.lime, fontFamily: "'JetBrains Mono',monospace",
            padding: '4px 12px', borderRadius: 100, background: `${p.lime}1A`, border: `1px solid ${p.lime}40` }}>
            ✓ Saved
          </span>
        )}
      </div>

      {/* Provider selector */}
      <div style={{ marginBottom: 24 }}>
        <label style={labelStyle}>AI Provider</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
          {PROVIDERS.map(prov => {
            const active = cfg.provider === prov.id;
            const color = p.glow ? prov.color : prov.lightColor;
            return (
              <button key={prov.id} onClick={() => update({ provider: prov.id })}
                style={{
                  padding: '14px 12px', borderRadius: 12, cursor: 'pointer',
                  border: `2px solid ${active ? color : p.border}`,
                  background: active ? `${color}12` : p.cardBg,
                  color: active ? color : p.textBody,
                  fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 13,
                  boxShadow: active && p.glow ? `0 0 20px ${color}20` : 'none',
                  transition: 'all 0.15s', textAlign: 'center',
                }}>
                {prov.label}
                {active && <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, margin: '6px auto 0',
                  boxShadow: p.glow ? `0 0 8px ${color}` : 'none' }} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Model selection */}
      <div style={{ marginBottom: 18 }}>
        <label style={labelStyle}>Model</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {models.map(m => {
            const active = currentModel === m.id;
            const color = p.violet;
            return (
              <button key={m.id} onClick={() => update({ [modelField]: m.id } as Partial<AIConfig>)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 16px', borderRadius: 10, cursor: 'pointer',
                  border: `1px solid ${active ? color : p.border}`,
                  background: active ? `${color}10` : p.cardBg,
                  transition: 'all 0.15s',
                }}>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: active ? color : p.textPrimary,
                    fontFamily: "'Space Grotesk',sans-serif" }}>{m.label}</div>
                  <div style={{ fontSize: 11, color: p.textMuted, fontFamily: "'JetBrains Mono',monospace", marginTop: 2 }}>{m.note}</div>
                </div>
                {active && <span style={{ width: 8, height: 8, borderRadius: '50%', background: color,
                  boxShadow: p.glow ? `0 0 8px ${color}` : 'none', flexShrink: 0 }} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* API Key */}
      <div style={{ marginBottom: 24 }}>
        <label style={labelStyle}>API Key</label>
        <input
          type="password"
          value={currentKey}
          onChange={e => update({ [keyField]: e.target.value } as Partial<AIConfig>)}
          placeholder={`Enter your ${PROVIDERS.find(pr => pr.id === cfg.provider)?.label} API key`}
          style={inputStyle}
        />
        <div style={{ fontSize: 11, color: p.textMuted, marginTop: 6, fontFamily: "'Inter',sans-serif" }}>
          Stored locally in your browser only. Not sent to any server except the AI provider.
        </div>
      </div>

      <button onClick={save}
        style={{
          padding: '10px 28px', borderRadius: 10, fontSize: 14, fontWeight: 600,
          color: '#EEEDFE', cursor: 'pointer',
          background: 'linear-gradient(135deg,#534AB7,#7F77DD)', border: 'none',
          fontFamily: "'Space Grotesk',sans-serif",
          boxShadow: p.glow ? '0 0 20px rgba(83,74,183,0.4)' : 'none',
        }}>
        Save AI Config
      </button>
    </div>
  );
}

// ── Connectors section (Jira) ─────────────────────────────────────────────────

function ConnectorsSection({ userId }: { userId: string }) {
  const p = usePalette();
  const inputStyle = useInputStyle();
  const [cfg, setCfg] = useState<JiraConfig | null>(null);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => { setCfg(loadJiraConfig(userId)); }, [userId]);

  if (!cfg) return null;

  function update(patch: Partial<JiraConfig>) {
    setCfg(prev => prev ? { ...prev, ...patch } : prev);
    setTestResult(null);
  }

  function save() {
    if (!cfg) return;
    saveJiraConfig(userId, cfg);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function testConnection() {
    if (!cfg?.baseUrl || !cfg?.email || !cfg?.apiToken) {
      setTestResult({ ok: false, msg: 'Fill in all fields before testing.' });
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/jira-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseUrl: cfg.baseUrl, email: cfg.email, apiToken: cfg.apiToken }),
      });
      const data = await res.json();
      setTestResult(data.ok
        ? { ok: true, msg: `Connected as ${data.displayName}` }
        : { ok: false, msg: data.error || 'Connection failed' });
    } catch {
      setTestResult({ ok: false, msg: 'Network error — check the URL' });
    } finally {
      setTesting(false);
    }
  }

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em',
    textTransform: 'uppercase', color: p.textMuted,
    fontFamily: "'JetBrains Mono',monospace", marginBottom: 6,
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 22, color: p.textPrimary, margin: 0, letterSpacing: '-0.4px' }}>
            Connectors
          </h2>
          <p style={{ color: p.textMuted, fontSize: 13, marginTop: 4, fontFamily: "'Inter',sans-serif" }}>
            Connect external tools to sync data automatically.
          </p>
        </div>
        {saved && (
          <span style={{ fontSize: 12, color: p.lime, fontFamily: "'JetBrains Mono',monospace",
            padding: '4px 12px', borderRadius: 100, background: `${p.lime}1A`, border: `1px solid ${p.lime}40` }}>
            ✓ Saved
          </span>
        )}
      </div>

      {/* Jira connector card */}
      <div style={{
        background: p.cardBg, border: `1px solid ${p.border}`,
        borderRadius: 16, padding: 24, marginBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, flexShrink: 0,
            background: 'linear-gradient(135deg,#0052CC,#2684FF)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
          }}>
            J
          </div>
          <div>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 16, color: p.textPrimary }}>
              Jira
            </div>
            <div style={{ fontSize: 12, color: p.textMuted, fontFamily: "'Inter',sans-serif" }}>
              Atlassian Jira Cloud — sync ticket status from task URLs
            </div>
          </div>
          {cfg.baseUrl && cfg.email && cfg.apiToken && (
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 11, color: p.lime, fontFamily: "'JetBrains Mono',monospace" }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: p.lime,
                boxShadow: p.glow ? `0 0 6px ${p.lime}` : 'none', display: 'inline-block' }} />
              Configured
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>Jira Base URL</label>
            <input value={cfg.baseUrl} onChange={e => update({ baseUrl: e.target.value })}
              placeholder="https://yourcompany.atlassian.net"
              style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Atlassian Email</label>
            <input value={cfg.email} onChange={e => update({ email: e.target.value })}
              placeholder="you@yourcompany.com" type="email"
              style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>API Token</label>
            <input value={cfg.apiToken} onChange={e => update({ apiToken: e.target.value })}
              placeholder="Generate at id.atlassian.com/manage-profile/security/api-tokens"
              type="password" style={inputStyle} />
            <div style={{ fontSize: 11, color: p.textMuted, marginTop: 6, fontFamily: "'Inter',sans-serif" }}>
              Stored locally. Never sent to any third-party except Jira.
            </div>
          </div>
        </div>

        {testResult && (
          <div style={{
            marginTop: 14, padding: '10px 14px', borderRadius: 8,
            background: testResult.ok ? `${p.lime}12` : `${p.coral}12`,
            border: `1px solid ${testResult.ok ? p.lime : p.coral}30`,
            fontSize: 12, color: testResult.ok ? p.lime : p.coral,
            fontFamily: "'JetBrains Mono',monospace",
          }}>
            {testResult.ok ? '✓' : '✗'} {testResult.msg}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button onClick={save}
            style={{
              padding: '9px 22px', borderRadius: 10, fontSize: 13, fontWeight: 600,
              color: '#EEEDFE', cursor: 'pointer',
              background: 'linear-gradient(135deg,#534AB7,#7F77DD)', border: 'none',
              fontFamily: "'Space Grotesk',sans-serif",
            }}>
            Save
          </button>
          <button onClick={testConnection} disabled={testing}
            style={{
              padding: '9px 22px', borderRadius: 10, fontSize: 13, fontWeight: 600,
              color: p.cyan, cursor: testing ? 'not-allowed' : 'pointer',
              background: `${p.cyan}10`, border: `1px solid ${p.cyan}30`,
              fontFamily: "'Space Grotesk',sans-serif", opacity: testing ? 0.7 : 1,
            }}>
            {testing ? 'Testing…' : 'Test Connection'}
          </button>
        </div>
      </div>

      {/* Future connectors placeholder */}
      <div style={{
        background: p.rowBg, border: `1px dashed ${p.borderTint}`,
        borderRadius: 14, padding: '20px 24px', textAlign: 'center',
      }}>
        <div style={{ fontSize: 13, color: p.textMuted, fontFamily: "'Inter',sans-serif" }}>
          More connectors coming — Slack, Linear, GitHub, and more.
        </div>
      </div>
    </div>
  );
}

// ── Projects section (preserved from before) ──────────────────────────────────

function ProjectsSection() {
  const p = usePalette();
  const [projects, setProjects] = useState<{ id: string; name: string; goLiveDate: string; health: string; description: string }[]>([]);
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [newProject, setNewProject] = useState({ name: '', goLiveDate: '', description: '' });
  const [showAddProject, setShowAddProject] = useState(false);
  const inputStyle = useInputStyle();

  useEffect(() => { setProjects(loadState().projects); }, []);

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

  const healthColor = (h: string) => h === 'On Track' ? p.lime : h === 'At Risk' ? p.amber : p.coral;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 22, color: p.textPrimary, margin: 0, letterSpacing: '-0.4px' }}>
            Projects
          </h2>
          <p style={{ color: p.textMuted, fontSize: 13, marginTop: 4, fontFamily: "'Inter',sans-serif" }}>
            Manage your projects and go-live dates.
          </p>
        </div>
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
          <div key={proj.id} style={{ background: p.cardBg, border: `1px solid ${p.border}`, borderRadius: 14, padding: '16px 20px' }}>
            {editingProject === proj.id ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input value={proj.name} onChange={e => updateProject(proj.id, 'name', e.target.value)} style={inputStyle} placeholder="Project name" />
                <input value={proj.description} onChange={e => updateProject(proj.id, 'description', e.target.value)} style={inputStyle} placeholder="Description" />
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <label style={{ fontSize: 12, color: p.textMuted, whiteSpace: 'nowrap' }}>Go-live date</label>
                  <input type="date" value={proj.goLiveDate} onChange={e => updateProject(proj.id, 'goLiveDate', e.target.value)}
                    style={{ ...inputStyle, colorScheme: p.glow ? 'dark' : 'light' }} />
                  <select value={proj.health} onChange={e => updateProject(proj.id, 'health', e.target.value)} style={{ ...inputStyle, width: 'auto' }}>
                    <option>On Track</option><option>At Risk</option><option>Behind</option>
                  </select>
                  <button onClick={() => setEditingProject(null)}
                    style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, color: p.lime, cursor: 'pointer',
                      background: `${p.lime}1A`, border: `1px solid ${p.lime}40`, whiteSpace: 'nowrap' }}>Done</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, display: 'inline-block',
                  background: healthColor(proj.health), boxShadow: p.glow ? `0 0 6px ${healthColor(proj.health)}` : 'none' }} />
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
                    background: p.inputBg, border: `1px solid ${p.border}` }}>Edit</button>
                <button onClick={() => deleteProject(proj.id)}
                  style={{ padding: '6px 12px', borderRadius: 8, fontSize: 12, color: p.coral, cursor: 'pointer',
                    background: `${p.coral}14`, border: `1px solid ${p.coral}33` }}>Delete</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {showAddProject && (
        <div style={{ marginTop: 14, background: p.inputBg, border: `1px solid ${p.border}`, borderRadius: 14, padding: 20 }}>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 14, color: p.textPrimary, marginBottom: 14 }}>
            New Project
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input value={newProject.name} onChange={e => setNewProject(prev => ({ ...prev, name: e.target.value }))} style={inputStyle} placeholder="Project name (e.g. Atlas · Web Rebuild)" />
            <input value={newProject.description} onChange={e => setNewProject(prev => ({ ...prev, description: e.target.value }))} style={inputStyle} placeholder="Short description (optional)" />
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
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const p = usePalette();
  const { data: session } = useSession();
  const [activeSection, setActiveSection] = useState<Section>('ai');

  const userId = session?.user?.id || 'guest';

  return (
    <div style={{ background: p.pageBg, minHeight: '100vh' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '36px 32px 80px', display: 'flex', gap: 32 }}>

        {/* Left sidebar */}
        <aside style={{
          width: 210, flexShrink: 0,
          position: 'sticky', top: 80, alignSelf: 'flex-start',
        }}>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, fontWeight: 600, letterSpacing: '0.12em',
            textTransform: 'uppercase', color: p.textMuted, marginBottom: 12 }}>
            Settings
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {SECTIONS.map(s => {
              const active = activeSection === s.id;
              return (
                <button key={s.id} onClick={() => setActiveSection(s.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 14px', borderRadius: 10, cursor: 'pointer', textAlign: 'left', width: '100%',
                    background: active ? `${p.violet}14` : 'none',
                    border: `1px solid ${active ? p.violet + '30' : 'transparent'}`,
                    color: active ? p.violet : p.textBody,
                    fontFamily: "'Inter',sans-serif", fontSize: 13, fontWeight: active ? 600 : 400,
                    transition: 'all 0.15s',
                  }}>
                  <span style={{ fontSize: 14, opacity: active ? 1 : 0.6 }}>{s.icon}</span>
                  {s.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main content */}
        <main style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            background: p.cardBg, border: `1px solid ${p.border}`,
            borderRadius: 18, padding: '32px 36px',
          }}>
            {activeSection === 'ai'         && <AISection userId={userId} />}
            {activeSection === 'connectors' && <ConnectorsSection userId={userId} />}
            {activeSection === 'projects'   && <ProjectsSection />}
          </div>
        </main>
      </div>

      <style>{`
        input[type="date"]::-webkit-calendar-picker-indicator {
          filter: ${p.glow ? 'invert(0.45) sepia(1) hue-rotate(230deg)' : 'none'};
          cursor: pointer;
        }
        input::placeholder { color: ${p.textMuted}; opacity: 0.6; }
        input:focus, select:focus { outline: none; border-color: ${p.violet}80 !important; }
        select option { background: ${p.cardSolid || '#1C1C24'}; color: ${p.textPrimary}; }
      `}</style>
    </div>
  );
}
