'use client';
import type { AppState, Project, ActionItem } from './types';

// ─── Per-user key prefix ───────────────────────────────────────────────────
let _userId = 'guest';

export function setCurrentUser(id: string) {
  _userId = id;
}

export function getCurrentUser() {
  return _userId;
}

function stateKey() {
  return `shantanu_state_${_userId}`;
}

// ─── Default data ──────────────────────────────────────────────────────────
const DEFAULT_PROJECTS: Project[] = [
  { id: 'viasat', name: 'Viasat', goLiveDate: '', health: 'On Track', description: '' },
];

const DEFAULT_ACTIONS: ActionItem[] = [];

// ─── Low-level helpers ─────────────────────────────────────────────────────
function getKey(key: string) {
  if (typeof window === 'undefined') return null;
  try { return localStorage.getItem(key); } catch { return null; }
}

function setKey(key: string, value: string) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(key, value); } catch {}
}

// ─── Public API ────────────────────────────────────────────────────────────
export function loadState(): AppState {
  const raw = getKey(stateKey());
  if (raw) {
    try { return JSON.parse(raw); } catch {}
  }
  return {
    projects: DEFAULT_PROJECTS,
    activeProjectId: 'viasat',
    actionItems: DEFAULT_ACTIONS,
    activities: [],
    momUploads: [],
  };
}

export function saveState(state: AppState) {
  setKey(stateKey(), JSON.stringify(state));
}

export function getActiveProject(state: AppState): Project | undefined {
  return state.projects.find(p => p.id === state.activeProjectId);
}

export function getProjectActions(state: AppState, projectId?: string): ActionItem[] {
  const pid = projectId || state.activeProjectId;
  return state.actionItems.filter(a => a.product.toLowerCase().includes(pid) || pid === 'all');
}
