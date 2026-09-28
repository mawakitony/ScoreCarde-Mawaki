-- Soft delete CRM. The lead row stays so assessment results, sessions, reports and metrics are not cascaded away.
alter table public.leads
  add column if not exists deleted_at timestamptz;

create index if not exists leads_not_deleted_org_idx
  on public.leads (organization_id, created_at desc)
  where deleted_at is null;

create or replace function public.list_org_leads(
  p_query text default null,
  p_scorecard uuid default null,
  p_status text default null,
  p_temperature text default null,
  p_country text default null,
  p_tag uuid default null,
  p_range uuid default null,
  p_score_min numeric default null,
  p_score_max numeric default null,
  p_from timestamptz default null,
  p_to timestamptz default null,
  p_utm_source text default null,
  p_utm_campaign text default null,
  p_cta text default null,
  p_sort text default 'newest',
  p_limit integer default 25,
  p_offset integer default 0,
  p_ids uuid[] default null
) returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_limit integer := least(greatest(coalesce(p_limit, 25), 1), 5000);
  v_offset integer := greatest(coalesce(p_offset, 0), 0);
  v_query text := nullif(trim(coalesce(p_query, '')), '');
  v_like text := null;
  v_sort text := case
    when p_sort in ('newest', 'oldest', 'score_desc', 'score_asc', 'name', 'country') then p_sort
    else 'newest'
  end;
begin
  if p_status is not null and p_status not in ('new', 'contacted', 'qualified', 'nurturing', 'converted', 'lost') then
    return jsonb_build_object('total', 0, 'rows', '[]'::jsonb);
  end if;
  if p_temperature is not null and p_temperature not in ('cold', 'warm', 'hot') then
    return jsonb_build_object('total', 0, 'rows', '[]'::jsonb);
  end if;
  if v_query is not null then
    v_like := '%' || replace(replace(replace(v_query, '\', '\\'), '%', '\%'), '_', '\_') || '%';
  end if;

  return (
    with scoped as (
      select
        l.id,
        l.status::text as status,
        l.created_at,
        trim(concat_ws(' ', r.first_name, r.last_name)) as name,
        r.first_name,
        r.last_name,
        r.email,
        r.phone,
        r.whatsapp,
        r.country,
        r.city,
        r.company,
        r.job_title,
        ar.overall_percent as score,
        rr.label as result,
        sc.name as scorecard,
        l.scorecard_id,
        coalesce(nullif(trim(ut.utm_source), ''), nullif(trim(l.source), ''), 'direct') as utm_source,
        ut.utm_medium,
        ut.utm_campaign,
        exists (select 1 from public.cta_clicks c where c.session_id = l.session_id) as cta_clicked,
        case
          when ar.overall_percent >= 75
            or exists (select 1 from public.cta_clicks c where c.session_id = l.session_id)
            then 'hot'
          when ar.overall_percent >= 40 then 'warm'
          else 'cold'
        end as temperature
      from public.leads l
      left join public.respondents r on r.id = l.respondent_id
      left join public.scorecards sc on sc.id = l.scorecard_id
      left join public.assessment_results ar on ar.id = l.result_id
      left join public.result_ranges rr on rr.id = ar.result_range_id
      left join public.utm_tracking ut on ut.session_id = l.session_id
      where public.is_org_member(l.organization_id)
        and l.deleted_at is null
        and (p_scorecard is null or l.scorecard_id = p_scorecard)
        and (p_status is null or l.status::text = p_status)
        and (p_country is null or upper(coalesce(r.country, '')) = upper(p_country))
        and (p_range is null or ar.result_range_id = p_range)
        and (p_score_min is null or ar.overall_percent >= p_score_min)
        and (p_score_max is null or ar.overall_percent <= p_score_max)
        and (p_from is null or l.created_at >= p_from)
        and (p_to is null or l.created_at < p_to)
        and (p_utm_source is null or lower(coalesce(ut.utm_source, l.source, '')) = lower(p_utm_source))
        and (p_utm_campaign is null or lower(coalesce(ut.utm_campaign, '')) = lower(p_utm_campaign))
        and (p_ids is null or l.id = any (p_ids))
        and (
          p_tag is null or exists (
            select 1 from public.lead_tag_assignments a
            where a.lead_id = l.id and a.tag_id = p_tag
          )
        )
        and (
          v_like is null
          or r.first_name ilike v_like escape '\'
          or r.last_name ilike v_like escape '\'
          or r.email ilike v_like escape '\'
          or r.phone ilike v_like escape '\'
          or r.company ilike v_like escape '\'
        )
    ),
    matched as (
      select * from scoped
      where (p_temperature is null or temperature = p_temperature)
        and (
          p_cta is null
          or (p_cta = 'clicked' and cta_clicked)
          or (p_cta = 'not_clicked' and not cta_clicked)
        )
    )
    select jsonb_build_object(
      'total', (select count(*)::int from matched),
      'rows', coalesce((
        select jsonb_agg(to_jsonb(page) order by page.ordinal)
        from (
          select
            row_number() over (
              order by
                case when v_sort = 'oldest' then created_at end asc,
                case when v_sort = 'newest' then created_at end desc,
                case when v_sort = 'score_desc' then score end desc nulls last,
                case when v_sort = 'score_asc' then score end asc nulls last,
                case when v_sort = 'name' then lower(coalesce(name, '')) end asc,
                case when v_sort = 'country' then country end asc nulls last,
                created_at desc
            ) as ordinal,
            id,
            coalesce(nullif(name, ''), '—') as name,
            first_name,
            last_name,
            email,
            phone,
            whatsapp,
            country,
            city,
            company,
            job_title,
            score,
            result,
            temperature,
            status,
            scorecard,
            scorecard_id,
            utm_source,
            utm_medium,
            utm_campaign,
            created_at,
            cta_clicked,
            coalesce((
              select jsonb_agg(jsonb_build_object('id', t.id, 'name', t.name, 'color', t.color) order by t.name)
              from public.lead_tag_assignments a
              join public.lead_tags t on t.id = a.tag_id
              where a.lead_id = matched.id
            ), '[]'::jsonb) as tags
          from matched
          order by
            case when v_sort = 'oldest' then created_at end asc,
            case when v_sort = 'newest' then created_at end desc,
            case when v_sort = 'score_desc' then score end desc nulls last,
            case when v_sort = 'score_asc' then score end asc nulls last,
            case when v_sort = 'name' then lower(coalesce(name, '')) end asc,
            case when v_sort = 'country' then country end asc nulls last,
            created_at desc
          limit v_limit offset v_offset
        ) page
      ), '[]'::jsonb)
    )
  );
end;
$$;

