import { createClient } from '@supabase/supabase-js';
import type { AgentPendingItem, AgentRiskCard, WebhookRegistration } from './types';

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

// Returns null if env vars are not configured (feature disabled gracefully)
export const supabase = url && anonKey ? createClient(url, anonKey) : null;

export function supabaseEnabled(): boolean {
  return !!supabase;
}

// ── Agent helpers ─────────────────────────────────────────────────────────────

export async function getPendingItems(userId: string): Promise<AgentPendingItem[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from('agent_pending_items')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  return (data ?? []) as AgentPendingItem[];
}

export async function insertPendingItem(item: Omit<AgentPendingItem, 'id' | 'createdAt'>): Promise<void> {
  if (!supabase) return;
  await supabase.from('agent_pending_items').insert({
    user_id:           item.userId,
    project_id:        item.projectId,
    meeting_id:        item.meetingId,
    meeting_title:     item.meetingTitle,
    items:             item.items,
    duplicates:        item.duplicates,
    transcript_source: item.transcriptSource,
    status:            item.status,
  });
}

export async function updatePendingItemStatus(id: string, status: AgentPendingItem['status']): Promise<void> {
  if (!supabase) return;
  await supabase.from('agent_pending_items').update({ status }).eq('id', id);
}

export async function getTodayRiskCard(userId: string, projectId: string, date: string): Promise<AgentRiskCard | null> {
  if (!supabase) return null;
  const { data } = await supabase
    .from('agent_risk_cards')
    .select('*')
    .eq('user_id', userId)
    .eq('project_id', projectId)
    .eq('date', date)
    .maybeSingle();
  return data as AgentRiskCard | null;
}

export async function upsertRiskCard(card: Omit<AgentRiskCard, 'id' | 'createdAt'>): Promise<void> {
  if (!supabase) return;
  await supabase.from('agent_risk_cards').upsert({
    user_id:    card.userId,
    project_id: card.projectId,
    date:       card.date,
    raw_risks:  card.rawRisks,
    narrative:  card.narrative,
  }, { onConflict: 'user_id,project_id,date' });
}

export async function getWebhookRegistration(userId: string): Promise<WebhookRegistration | null> {
  if (!supabase) return null;
  const { data } = await supabase
    .from('webhook_registrations')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  return data as WebhookRegistration | null;
}

export async function upsertWebhookRegistration(reg: Omit<WebhookRegistration, 'id' | 'createdAt'>): Promise<void> {
  if (!supabase) return;
  await supabase.from('webhook_registrations').upsert({
    user_id:     reg.userId,
    channel_id:  reg.channelId,
    resource_id: reg.resourceId,
    expiration:  reg.expiration,
  }, { onConflict: 'user_id' });
}

export async function deleteWebhookRegistration(userId: string): Promise<void> {
  if (!supabase) return;
  await supabase.from('webhook_registrations').delete().eq('user_id', userId);
}

export async function getPendingItemCount(userId: string): Promise<number> {
  if (!supabase) return 0;
  const { count } = await supabase
    .from('agent_pending_items')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'pending');
  return count ?? 0;
}

/*
  Required Supabase schema (run in your Supabase SQL editor):

  -- ── Existing tables (unchanged) ──────────────────────────────────────────

  create table if not exists public.shared_projects (
    id            uuid primary key default gen_random_uuid(),
    project_id    text not null,
    owner_id      text not null,
    owner_email   text not null,
    project_name  text not null,
    project_data  jsonb not null,
    created_at    timestamptz default now()
  );

  create table if not exists public.project_invites (
    id                uuid primary key default gen_random_uuid(),
    shared_project_id uuid references public.shared_projects(id) on delete cascade,
    invitee_email     text not null,
    status            text not null default 'pending',
    invited_at        timestamptz default now()
  );

  alter table public.shared_projects enable row level security;
  alter table public.project_invites  enable row level security;

  create policy "owners read" on public.shared_projects
    for select using (owner_id = auth.uid()::text);
  create policy "invitees read" on public.project_invites
    for select using (invitee_email = auth.jwt() ->> 'email');

  -- ── Agent tables (new) ────────────────────────────────────────────────────

  create table if not exists public.agent_pending_items (
    id                uuid primary key default gen_random_uuid(),
    user_id           text not null,
    project_id        text not null,
    meeting_id        text not null,
    meeting_title     text,
    items             jsonb not null,
    duplicates        jsonb default '[]',
    transcript_source text not null default 'manual',
    status            text not null default 'pending',
    created_at        timestamptz default now()
  );

  create table if not exists public.agent_risk_cards (
    id          uuid primary key default gen_random_uuid(),
    user_id     text not null,
    project_id  text not null,
    date        date not null,
    raw_risks   jsonb not null,
    narrative   jsonb not null,
    created_at  timestamptz default now(),
    unique (user_id, project_id, date)
  );

  create table if not exists public.webhook_registrations (
    id           uuid primary key default gen_random_uuid(),
    user_id      text not null unique,
    channel_id   text not null,
    resource_id  text not null,
    expiration   bigint not null,
    created_at   timestamptz default now()
  );

  alter table public.agent_pending_items   enable row level security;
  alter table public.agent_risk_cards      enable row level security;
  alter table public.webhook_registrations enable row level security;

  create policy "user owns pending items" on public.agent_pending_items
    for all using (user_id = auth.uid()::text);
  create policy "user owns risk cards" on public.agent_risk_cards
    for all using (user_id = auth.uid()::text);
  create policy "user owns webhook reg" on public.webhook_registrations
    for all using (user_id = auth.uid()::text);

  Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your
  .env.local and Vercel environment variables to enable this feature.
*/
