export interface ActionItem {
  id: string;
  action: string;
  assignee: string;
  startDate: string;   // when work begins (defaults to today when logged)
  eta: string;
  product: string;
  projectId?: string;
  priority: 'High' | 'Medium' | 'Low';
  type: 'Feature' | 'Bug' | 'Config' | 'Risk' | 'Decision' | 'Other';
  status: 'Pending' | 'In Progress' | 'Done' | 'Blocked';
  comment: string;
  jiraUrl: string;
}

export interface Project {
  id: string;
  name: string;
  goLiveDate: string;
  health: 'On Track' | 'At Risk' | 'Behind';
  description: string;
}

export interface DailyActivity {
  id: string;
  date: string;
  projectId: string;
  team: string;       // person / assignee
  activity: string;
  type: 'Feature' | 'Bug' | 'Config' | 'Meeting' | 'Other';
  product?: string;   // AI for Work | Search AI | Agent Platform
  hours: number;
  createdAt: string;
}

export interface MOMUploadVersion {
  version: number;
  savedAt: string;
  parsedItems: ActionItem[];
}

export interface MOMUpload {
  id: string;
  filename: string;
  uploadedAt: string;
  projectId: string;
  rawText: string;
  parsedItems: ActionItem[];
  versions?: MOMUploadVersion[];  // version history; optional for backward compat
}

export interface AppState {
  projects: Project[];
  activeProjectId: string;
  actionItems: ActionItem[];
  activities: DailyActivity[];
  momUploads: MOMUpload[];
  selectedModel?: string;
}
