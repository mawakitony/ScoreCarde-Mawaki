-- Atomic org profile completion after create_organization (owner membership already exists).
-- security definer: writes organization_sensitive without relying on client RLS timing.

create or replace function public.finish_organization_onboarding(
  p_organization_id uuid,
  p_country text,
  p_city text,
  p_sector text,
  p_sector_other text,
  p_headcount_band text,
  p_currency text,
  p_primary_objective text,
  p_referral_source text,
  p_website text,
  p_timezone text,
  p_language text,
  p_use_case text,
  p_job_title text,
  p_phone_e164 text,
  p_legal_id text,
  p_legal_id_type text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  completed_at timestamptz := now();
begin
  if auth.uid() is null then
    raise exception 'Authentification requise';
  end if;

  if not exists (
    select 1
    from public.organization_members
    where organization_id = p_organization_id
      and user_id = auth.uid()
      and role = 'owner'
  ) then
    raise exception 'Permission refusée';
  end if;

  if p_phone_e164 is null or p_phone_e164 !~ '^\+[1-9][0-9]{7,14}$' then
    raise exception 'Téléphone invalide';
  end if;

  if p_currency is null or p_currency not in ('XOF', 'EUR', 'CAD', 'USD') then
    raise exception 'Devise invalide';
  end if;

  update public.organizations
  set
    country = left(trim(coalesce(p_country, '')), 80),
    city = left(trim(coalesce(p_city, '')), 80),
    sector = left(trim(coalesce(p_sector, '')), 80),
    sector_other = nullif(left(trim(coalesce(p_sector_other, '')), 80), ''),
    headcount_band = left(trim(coalesce(p_headcount_band, '')), 40),
    currency = p_currency,
    primary_objective = left(trim(coalesce(p_primary_objective, '')), 80),
    referral_source = nullif(left(trim(coalesce(p_referral_source, '')), 80), ''),
    website = left(trim(coalesce(p_website, '')), 240),
    timezone = left(trim(coalesce(p_timezone, 'UTC')), 80),
    default_language = case when p_language = 'en' then 'en' else 'fr' end,
    use_case = left(trim(coalesce(p_use_case, '')), 160),
    onboarding_completed_at = coalesce(onboarding_completed_at, completed_at),
    profile_completed_at = completed_at
  where id = p_organization_id;

  insert into public.organization_sensitive (
    organization_id, phone_e164, legal_id, legal_id_type, created_at, updated_at
  )
  values (
    p_organization_id,
    p_phone_e164,
    nullif(left(trim(coalesce(p_legal_id, '')), 40), ''),
    case
      when nullif(left(trim(coalesce(p_legal_id, '')), 40), '') is null then null
      else left(trim(coalesce(p_legal_id_type, 'OTHER')), 20)
    end,
    completed_at,
    completed_at
  )
  on conflict (organization_id) do update
  set
    phone_e164 = excluded.phone_e164,
    legal_id = excluded.legal_id,
    legal_id_type = excluded.legal_id_type,
    updated_at = completed_at;

  update public.profiles
  set
    job_title = left(trim(coalesce(p_job_title, '')), 80),
    country_code = left(trim(coalesce(p_country, '')), 8)
  where id = auth.uid();

  return p_organization_id;
end;
$$;

revoke all on function public.finish_organization_onboarding(
  uuid, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text
) from public;
grant execute on function public.finish_organization_onboarding(
  uuid, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text
) to authenticated;

comment on function public.finish_organization_onboarding is
  'Completes org onboarding profile + sensitive phone/legal id atomically for the owner.';
