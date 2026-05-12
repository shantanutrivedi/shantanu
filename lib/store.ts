'use client';
import type { AppState, Project, ActionItem } from './types';

// ─── Per-user key prefix ───────────────────────────────────────────────────
const LAST_USER_KEY = 'shantanu_last_user';
let _userId = 'guest';

// When the user changes, notify listeners so pages can re-load state
type Listener = () => void;
const _listeners: Listener[] = [];

export function onUserChange(fn: Listener): () => void {
  _listeners.push(fn);
  return () => { const i = _listeners.indexOf(fn); if (i > -1) _listeners.splice(i, 1); };
}

export function setCurrentUser(id: string) {
  if (id === _userId) return;

  if (typeof window !== 'undefined') {
    // Migrate any data from the guest key into this user's key (first sign-in)
    const guestKey = 'shantanu_state_guest';
    const userKey  = `shantanu_state_${id}`;
    try {
      const guestRaw = localStorage.getItem(guestKey);
      const userRaw  = localStorage.getItem(userKey);
      if (guestRaw && !userRaw) {
        localStorage.setItem(userKey, guestRaw);
      }
    } catch {}

    // Persist so stateKey() can resolve correctly before the next effect fires
    if (id !== 'guest') {
      try { localStorage.setItem(LAST_USER_KEY, id); } catch {}
    }
  }

  _userId = id;
  // Notify all subscribed pages to reload state
  _listeners.forEach(fn => fn());
}

export function getCurrentUser() {
  return _userId;
}

// Resolves the correct key even before setCurrentUser() is called
// by falling back to the last persisted user ID from localStorage.
function stateKey(): string {
  if (_userId !== 'guest') return `shantanu_state_${_userId}`;
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(LAST_USER_KEY);
      if (cached) return `shantanu_state_${cached}`;
    } catch {}
  }
  return 'shantanu_state_guest';
}

// ─── Default data ──────────────────────────────────────────────────────────
const DEFAULT_PROJECTS: Project[] = [
  { id: 'viasat', name: 'Viasat', goLiveDate: '', health: 'On Track', description: '' },
];

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
    actionItems: [],
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
