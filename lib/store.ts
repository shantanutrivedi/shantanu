'use client';
import type { AppState, Project, ActionItem, DailyActivity, MOMUpload } from './types';

const DEFAULT_PROJECTS: Project[] = [
  { id: 'viasat', name: 'Viasat', goLiveDate: '', health: 'On Track', description: '' },
];

const DEFAULT_ACTIONS: ActionItem[] = [];

function getKey(key: string) {
  if (typeof window === 'undefined') return null;
  try { return localStorage.getItem(key); } catch { return null; }
}

function setKey(key: string, value: string) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(key, value); } catch {}
}

export function loadState(): AppState {
  const raw = getKey('shantanu_state');
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
  setKey('shantanu_state', JSON.stringify(state));
}

export function getActiveProject(state: AppState): Project | undefined {
  return state.projects.find(p => p.id === state.activeProjectId);
}

export function getProjectActions(state: AppState, projectId?: string): ActionItem[] {
  const pid = projectId || state.activeProjectId;
  return state.actionItems.filter(a => a.product.toLowerCase().includes(pid) || pid === 'all');
}
