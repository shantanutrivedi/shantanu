export interface ActionItem {
  id: string;
  action: string;
  assignee: string;
  eta: string;
  product: string;
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
  team: string;
  activity: string;
  type: 'Feature' | 'Bug' | 'Config' | 'Meeting' | 'Other';
  hours: number;
  createdAt: string;
}

export interface MOMUpload {
  id: string;
  filename: string;
  uploadedAt: string;
  projectId: string;
  rawText: string;
  parsedItems: ActionItem[];
}

export interface AppState {
  projects: Project[];
  activeProjectId: string;
  actionItems: ActionItem[];
  activities: DailyActivity[];
  momUploads: MOMUpload[];
  selectedModel?: string;
}
