-- First-access codes reuse organization_invitations. The code is stored only as a SHA-256 hash.

alter table public.organization_invitations
  add column if not exists invitation_type text not null default 'link',
  add column if not exists first_access_code_hash text,
  add column if not exists first_access_expires_at timestamptz,
  add column if not exists first_access_attempts integer not null default 0,
  add column if not exists first_access_used_at timestamptz,
  add column if not exists cancelled_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'organization_invitations_invitation_type_check'
  ) then
    alter table public.organization_invitations
      add constraint organization_invitations_invitation_type_check
      check (invitation_type in ('link', 'first_access_code'));
  end if;
end $$;

create index if not exists organization_invitations_first_access_email_idx
  on public.organization_invitations (organization_id, email)
  where invitation_type = 'first_access_code' and accepted_at is null;

create or replace function public.accept_organization_invitation(p_token_hash text, p_member_limit integer)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  inv public.organization_invitations%rowtype;
  caller_email text;
  member_count integer;
  enum_role public.org_role;
begin
  if auth.uid() is null then
    raise exception 'Authentification requise';
  end if;

  select * into inv
  from public.organization_invitations
  where token_hash = p_token_hash
    and accepted_at is null
    and cancelled_at is null
    and expires_at > now()
  for update;

  if inv.id is null then
    raise exception 'Invitation invalide';
  end if;

  if inv.invitation_type = 'first_access_code' then
    if inv.first_access_used_at is not null then
      raise exception 'Code déjà utilisé';
    end if;
    if inv.first_access_attempts >= 5 then
      raise exception 'Code temporairement bloqué';
    end if;
    if inv.first_access_expires_at is not null and inv.first_access_expires_at <= now() then
      raise exception 'Code expiré';
    end if;
  end if;

  select lower(email) into caller_email from public.profiles where id = auth.uid();
  if caller_email is null or caller_email <> lower(inv.email) then
    raise exception 'Cette invitation ne correspond pas à ce compte';
  end if;
  if exists (
    select 1 from public.organization_members
    where user_id = auth.uid() and organization_id <> inv.organization_id
  ) then
    raise exception 'Ce compte appartient déjà à une organisation';
  end if;

  select count(*) into member_count
  from public.organization_members
  where organization_id = inv.organization_id;

  if p_member_limit is not null and member_count >= p_member_limit then
    raise exception 'Limite de membres atteinte';
  end if;

  enum_role := case when inv.role = 'admin' then 'admin'::public.org_role else 'member'::public.org_role end;

  insert into public.organization_members (organization_id, user_id, role, access_role)
  values (inv.organization_id, auth.uid(), enum_role, inv.role)
  on conflict (organization_id, user_id) do update
    set role = excluded.role, access_role = excluded.access_role;

  update public.organization_invitations
  set accepted_at = now(),
      first_access_used_at = case
        when invitation_type = 'first_access_code' then now()
        else first_access_used_at
      end
  where id = inv.id;

  insert into public.audit_logs (organization_id, actor_id, action, metadata)
  values (inv.organization_id, auth.uid(), 'member.accepted', jsonb_build_object('role', inv.role));

  return inv.organization_id;
end;
$$;

grant execute on function public.accept_organization_invitation(text, integer) to authenticated;
