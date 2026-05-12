'use client';
import type { AppState, Project, ActionItem, DailyActivity, MOMUpload } from './types';

const DEFAULT_PROJECTS: Project[] = [
  { id: 'atlas', name: 'Atlas · Web Rebuild', goLiveDate: '2024-08-14', health: 'On Track', description: 'Full platform web rebuild with auth cutover' },
  { id: 'helix', name: 'Helix · v2 Beta', goLiveDate: '2024-08-22', health: 'At Risk', description: 'Next-gen Helix platform beta release' },
  { id: 'reporting', name: 'Reporting v2', goLiveDate: '2024-09-03', health: 'On Track', description: 'Analytics and reporting overhaul' },
];

const DEFAULT_ACTIONS: ActionItem[] = [
  { id: '1', action: 'Pricing FAQ landing page', assignee: 'Riya', eta: '2024-07-14', product: 'Atlas', priority: 'High', type: 'Feature', status: 'In Progress', comment: 'Needs design review first', jiraUrl: '' },
  { id: '2', action: 'Resolve infra capacity for staging', assignee: 'Jay', eta: '2024-07-12', product: 'Atlas', priority: 'High', type: 'Bug', status: 'Blocked', comment: 'Waiting on infra team', jiraUrl: '' },
  { id: '3', action: 'Auth dependency report', assignee: 'Riya', eta: '2024-07-15', product: 'Atlas', priority: 'Medium', type: 'Other', status: 'Pending', comment: '', jiraUrl: '' },
  { id: '4', action: 'Schedule advisory for v2 customers', assignee: 'Devika', eta: '2024-07-20', product: 'Helix', priority: 'Medium', type: 'Other', status: 'Pending', comment: '', jiraUrl: '' },
  { id: '5', action: 'Triage Helix risk by Friday', assignee: 'Akash', eta: '2024-07-12', product: 'Helix', priority: 'High', type: 'Risk', status: 'In Progress', comment: '', jiraUrl: '' },
];

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
    activeProjectId: 'atlas',
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
