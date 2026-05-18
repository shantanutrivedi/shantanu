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

// ── Agent types ───────────────────────────────────────────────────────────────

export interface MeetingRef {
  eventId: string;
  meetingTitle: string;
  startTime: string;
  endTime: string;
  platform: 'google-meet' | 'zoom' | 'teams' | 'unknown';
  conferenceUrl?: string;
  description?: string; // raw calendar event description
}

export interface NormalizedTranscript {
  source: 'google-meet' | 'zoom' | 'teams' | 'manual';
  // 'auto' = fetched from API, 'manual' = user-pasted
  confidence: 'auto' | 'manual';
  text: string;
  meetingTitle?: string;
  attendees?: string[];
  meetingId?: string;
}

export interface TranscriptSource {
  name: string;
  isConfigured(userId: string): Promise<boolean>;
  fetch(eventRef: MeetingRef, credentials: string): Promise<NormalizedTranscript | null>;
}

export interface DuplicateFlag {
  incomingId: string;
  existingId: string;
  similarity: number;
}

export interface AgentPendingItem {
  id: string;
  userId: string;
  projectId: string;
  meetingId: string;
  meetingTitle: string;
  items: ActionItem[];
  duplicates: DuplicateFlag[];
  transcriptSource: NormalizedTranscript['source'];
  status: 'pending' | 'approved' | 'dismissed';
  createdAt: string;
}

export interface RiskScanResult {
  slipping: Array<{ id: string; action: string; eta: string; daysOverdue: number }>;
  noEta: Array<{ id: string; action: string; assignee: string }>;
  blocked: Array<{ id: string; action: string; assignee: string; daysSinceBlocked?: number }>;
  riskScore: number; // 0–10
}

export interface AgentRiskCard {
  id: string;
  userId: string;
  projectId: string;
  date: string; // YYYY-MM-DD
  rawRisks: RiskScanResult;
  narrative: {
    headline: string;
    bullets: [string, string, string];
    recommendation: string;
  };
  createdAt: string;
}

export interface WebhookRegistration {
  id: string;
  userId: string;
  channelId: string;
  resourceId: string;
  expiration: number; // Unix ms
  createdAt: string;
}
