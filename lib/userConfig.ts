'use client';

// ── AI Configuration ──────────────────────────────────────────────────────────

export type AIProvider = 'anthropic' | 'openai' | 'gemini';

export interface AIConfig {
  provider: AIProvider;
  anthropicKey: string;
  anthropicModel: string;
  openaiKey: string;
  openaiModel: string;
  geminiKey: string;
  geminiModel: string;
}

export const DEFAULT_AI_CONFIG: AIConfig = {
  provider: 'anthropic',
  anthropicKey: '',
  anthropicModel: 'claude-opus-4-7',
  openaiKey: '',
  openaiModel: 'gpt-4o',
  geminiKey: '',
  geminiModel: 'gemini-2.0-flash',
};

export const ANTHROPIC_MODELS = [
  { id: 'claude-haiku-4-5', label: 'Claude Haiku 4.5', note: 'Fastest & cheapest' },
  { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6', note: 'Best balance' },
  { id: 'claude-opus-4-7', label: 'Claude Opus 4.7', note: 'Most capable' },
];

export const OPENAI_MODELS = [
  { id: 'gpt-4o-mini', label: 'GPT-4o Mini', note: 'Fast & affordable' },
  { id: 'gpt-4o', label: 'GPT-4o', note: 'Best balance' },
  { id: 'o1', label: 'o1', note: 'Advanced reasoning' },
];

export const GEMINI_MODELS = [
  { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', note: 'Fast & efficient' },
  { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', note: 'Most capable' },
];

export function loadAIConfig(userId: string): AIConfig {
  if (typeof window === 'undefined') return DEFAULT_AI_CONFIG;
  try {
    const raw = localStorage.getItem(`ai-config-${userId}`);
    if (raw) return { ...DEFAULT_AI_CONFIG, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_AI_CONFIG;
}

export function saveAIConfig(userId: string, config: AIConfig): void {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(`ai-config-${userId}`, JSON.stringify(config)); } catch {}
}

// ── Jira Configuration ────────────────────────────────────────────────────────

export interface JiraConfig {
  baseUrl: string;   // e.g. https://mycompany.atlassian.net
  email: string;     // Atlassian account email
  apiToken: string;  // API token from id.atlassian.com
}

export const DEFAULT_JIRA_CONFIG: JiraConfig = {
  baseUrl: '',
  email: '',
  apiToken: '',
};

export function loadJiraConfig(userId: string): JiraConfig {
  if (typeof window === 'undefined') return DEFAULT_JIRA_CONFIG;
  try {
    const raw = localStorage.getItem(`jira-config-${userId}`);
    if (raw) return { ...DEFAULT_JIRA_CONFIG, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_JIRA_CONFIG;
}

export function saveJiraConfig(userId: string, config: JiraConfig): void {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(`jira-config-${userId}`, JSON.stringify(config)); } catch {}
}
