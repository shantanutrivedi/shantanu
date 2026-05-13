import { createClient } from '@supabase/supabase-js';

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

// Returns null if env vars are not configured (feature disabled gracefully)
export const supabase = url && anonKey ? createClient(url, anonKey) : null;

export function supabaseEnabled(): boolean {
  return !!supabase;
}

/*
  Required Supabase schema (run in your Supabase SQL editor):

  -- Projects shared across users
  create table if not exists public.shared_projects (
    id            uuid primary key default gen_random_uuid(),
    project_id    text not null,       -- local project ID of the owner
    owner_id      text not null,       -- Google sub of the owner
    owner_email   text not null,
    project_name  text not null,
    project_data  jsonb not null,      -- serialised Project object
    created_at    timestamptz default now()
  );

  -- Invites linking a shared project to an invitee
  create table if not exists public.project_invites (
    id                uuid primary key default gen_random_uuid(),
    shared_project_id uuid references public.shared_projects(id) on delete cascade,
    invitee_email     text not null,
    status            text not null default 'pending', -- pending | accepted | declined
    invited_at        timestamptz default now()
  );

  -- Row-level security: owners and invitees can read their own rows
  alter table public.shared_projects enable row level security;
  alter table public.project_invites  enable row level security;

  create policy "owners read" on public.shared_projects
    for select using (owner_id = auth.uid()::text);

  create policy "invitees read" on public.project_invites
    for select using (invitee_email = auth.jwt() ->> 'email');

  Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your
  .env.local and Vercel environment variables to enable this feature.
*/
