-- T8: signup + organization onboarding profile fields (idempotent).
-- Sensitive phone / legal id live in organization_sensitive (owner/admin + service role only).

alter table public.profiles
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists country_code text,
  add column if not exists job_title text,
  add column if not exists terms_accepted_at timestamptz,
  add column if not exists terms_version text,
  add column if not exists privacy_accepted_at timestamptz,
  add column if not exists privacy_version text,
  add column if not exists marketing_consent_at timestamptz,
  add column if not exists marketing_consent_version text;

alter table public.organizations
  add column if not exists city text,
  add column if not exists sector text,
  add column if not exists sector_other text,
  add column if not exists headcount_band text,
  add column if not exists currency text not null default 'XOF',
  add column if not exists primary_objective text,
  add column if not exists referral_source text,
  add column if not exists profile_completed_at timestamptz;

create table if not exists public.organization_sensitive (
  organization_id uuid primary key references public.organizations (id) on delete cascade,
  phone_e164 text,
  legal_id text,
  legal_id_type text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.organization_sensitive enable row level security;

drop policy if exists organization_sensitive_select on public.organization_sensitive;
create policy organization_sensitive_select on public.organization_sensitive
  for select using (public.has_org_role(organization_id, array['owner', 'admin']::public.org_role[]));

drop policy if exists organization_sensitive_insert on public.organization_sensitive;
create policy organization_sensitive_insert on public.organization_sensitive
  for insert with check (public.has_org_role(organization_id, array['owner', 'admin']::public.org_role[]));

drop policy if exists organization_sensitive_update on public.organization_sensitive;
create policy organization_sensitive_update on public.organization_sensitive
  for update using (public.has_org_role(organization_id, array['owner', 'admin']::public.org_role[]));

-- Soft check constraints (nullable for legacy orgs).
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'organizations_currency_check'
  ) then
    alter table public.organizations
      add constraint organizations_currency_check
      check (currency in ('XOF', 'EUR', 'CAD', 'USD'));
  end if;
exception when others then null;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'organization_sensitive_phone_e164_check'
  ) then
    alter table public.organization_sensitive
      add constraint organization_sensitive_phone_e164_check
      check (phone_e164 is null or phone_e164 ~ '^\+[1-9][0-9]{7,14}$');
  end if;
exception when others then null;
end $$;

comment on table public.organization_sensitive is
  'Phone + legal id: visible to org owner/admin via RLS; Platform Admin via service role.';

comment on column public.organizations.profile_completed_at is
  'Set when mandatory onboarding org fields are complete; null → incomplete banner.';

revoke all on public.organization_sensitive from anon;
grant select, insert, update on public.organization_sensitive to authenticated;
