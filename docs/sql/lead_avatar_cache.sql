-- DRAFT ONLY — do not apply without explicit authorization.
-- Lot 11B: optional persistence for authorized lead avatar resolutions.
-- Isolation: organization_id + RLS. No production sync until OAuth is validated.

-- alter table public.respondents
--   add column if not exists avatar_url text,
--   add column if not exists avatar_source text
--     check (avatar_source is null or avatar_source in ('stored', 'google', 'microsoft', 'approved', 'upload')),
--   add column if not exists avatar_checked_at timestamptz,
--   add column if not exists avatar_status text
--     check (avatar_status is null or avatar_status in ('AVAILABLE', 'NOT_FOUND', 'NOT_AUTHORIZED', 'NOT_CONFIGURED', 'ERROR'));

create table if not exists public.lead_avatar_cache (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  lead_id uuid references public.leads (id) on delete cascade,
  respondent_id uuid references public.respondents (id) on delete cascade,
  email_key text not null,
  status text not null
    check (status in ('AVAILABLE', 'NOT_FOUND', 'NOT_AUTHORIZED', 'NOT_CONFIGURED', 'ERROR')),
  source text not null
    check (source in ('stored', 'google', 'microsoft', 'approved', 'initials', 'upload')),
  avatar_url text,
  checked_at timestamptz not null default now(),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, email_key)
);

create index if not exists lead_avatar_cache_org_expires_idx
  on public.lead_avatar_cache (organization_id, expires_at);

alter table public.lead_avatar_cache enable row level security;

-- Policies mirror leads_select / leads_update: org members only.
-- create policy lead_avatar_cache_select on public.lead_avatar_cache
--   for select using (public.is_org_member(organization_id));
-- create policy lead_avatar_cache_write on public.lead_avatar_cache
--   for all using (public.is_org_member(organization_id))
--   with check (public.is_org_member(organization_id));

-- Optional: encrypted OAuth tokens per organization (never in Client Components).
-- create table if not exists public.lead_avatar_providers (
--   organization_id uuid primary key references public.organizations (id) on delete cascade,
--   google_refresh_cipher text,
--   microsoft_refresh_cipher text,
--   enabled boolean not null default false,
--   updated_at timestamptz not null default now()
-- );
