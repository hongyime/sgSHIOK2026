-- Private moderator identity is an explicit operator allowlist, never user metadata.
-- No identities are enrolled and no resident intake is enabled by this migration.
create table shiok_reports.moderators (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enabled boolean not null default false
);
alter table shiok_reports.moderators enable row level security;
revoke all on shiok_reports.moderators from public, anon, authenticated, service_role;

create table shiok_reports.moderation (
  receipt_id uuid primary key references shiok_reports.reports(receipt_id) on delete cascade,
  from_revision bigint not null check (from_revision between 1 and 9007199254740990),
  to_revision bigint not null check (to_revision = from_revision + 1),
  action text not null check (action in ('accepted', 'rejected', 'duplicate')),
  moderator_id uuid not null,
  moderated_at timestamptz not null,
  reason text not null check (char_length(reason) between 1 and 1000 and
    btrim(reason, U&'\0009\000a\000b\000c\000d\0020\00a0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200a\2028\2029\202f\205f\3000\feff') <> ''),
  duplicate_of uuid,
  check ((action = 'duplicate') = (duplicate_of is not null)),
  check (duplicate_of is distinct from receipt_id)
);
alter table shiok_reports.moderation enable row level security;
revoke all on shiok_reports.moderation from public, anon, authenticated, service_role;

-- Service-only callers supply identity AFTER verifying the token with Auth /user.
-- Independently check current session, ban/expiry and allowlist under row locks.
-- User metadata, stale app_metadata and a deleted/revoked session confer no access.
create function shiok_reports.require_moderator_v1(p_actor uuid, p_session uuid, p_token_expires_at timestamptz)
returns void language plpgsql security definer
set search_path = '' set lock_timeout = '2s'
as $$
declare t timestamptz;
begin
  -- A row lock alone cannot refresh a pre-existing REPEATABLE READ snapshot.
  -- PostgREST uses READ COMMITTED; reject other transaction modes explicitly.
  if current_setting('transaction_isolation') <> 'read committed' then
    raise sqlstate 'PT503' using message = 'moderator_unavailable';
  end if;
  if p_actor is null or p_session is null or p_token_expires_at is null then
    raise sqlstate 'PT403' using message = 'moderator_unavailable';
  end if;
  perform 1 from shiok_reports.moderators m
    join auth.users u on u.id = m.user_id
    join auth.sessions s on s.user_id = u.id
    where m.user_id = p_actor and m.enabled and s.id = p_session
    and not coalesce(u.is_anonymous, true) and u.deleted_at is null
    and (u.banned_until is null or u.banned_until <= clock_timestamp())
    and (s.not_after is null or s.not_after > clock_timestamp())
    for share of m, u, s;
  t := clock_timestamp();
  if not found or p_token_expires_at <= t or p_token_expires_at > t + interval '1 hour'
    or exists (select 1 from auth.sessions where id = p_session and not_after <= t) then
    raise sqlstate 'PT403' using message = 'moderator_unavailable';
  end if;
end;
$$;
revoke all on function shiok_reports.require_moderator_v1(uuid,uuid,timestamptz) from public,anon,authenticated,service_role;

-- Queue is keyset-paged, bounded and excludes expired content. Never return retry
-- proofs, request identities, quota buckets or provider auth/user fields.
create function shiok_reports.moderator_queue_v1(
  p_actor uuid, p_session uuid, p_token_expires_at timestamptz,
  p_state text, p_after_received_at timestamptz, p_after_receipt_id uuid
) returns jsonb language plpgsql security definer
set search_path = '' set lock_timeout = '2s'
as $$
declare result jsonb; t timestamptz;
begin
  perform 1 from shiok_reports.control where singleton for update;
  if not found then raise sqlstate 'PT503' using message = 'moderator_unavailable'; end if;
  perform shiok_reports.require_moderator_v1(p_actor,p_session,p_token_expires_at);
  if p_state is null or p_state not in ('pending','accepted','rejected','duplicate')
    or (p_after_received_at is null) <> (p_after_receipt_id is null)
    or (p_after_received_at is not null and not isfinite(p_after_received_at)) then
    raise sqlstate 'PT400' using message = 'invalid_queue';
  end if;
  t := clock_timestamp();
  select coalesce(jsonb_agg(jsonb_build_object(
    'receipt_id',r.receipt_id,'report_type',r.report_type,'state',r.state,'revision',r.revision,
    'received_at',r.received_at,'expires_at',r.expires_at,'content',r.canonical_content::jsonb,
    'moderation',case when m.receipt_id is null then null else jsonb_build_object(
      'moderated_at',m.moderated_at,'moderator_id',m.moderator_id,'reason',m.reason,'duplicate_of',m.duplicate_of
    ) end) order by r.received_at,r.receipt_id),'[]'::jsonb) into result
  from (select * from shiok_reports.reports where state = p_state and expires_at > t
    and (p_after_received_at is null or (received_at,receipt_id) > (p_after_received_at,p_after_receipt_id))
    order by received_at,receipt_id limit 25) r
    left join shiok_reports.moderation m using (receipt_id);
  return jsonb_build_object('reports',result,'page_limit',25);
end;
$$;
revoke all on function shiok_reports.moderator_queue_v1(uuid,uuid,timestamptz,text,timestamptz,uuid) from public,anon,authenticated,service_role;

-- Resolve one complete chain in the same lock domain as submit/cleanup/decision.
-- This is also the authoritative read set used to reject stale moderator screens.
create function shiok_reports.moderator_chain_v1(p_receipt uuid, p_now timestamptz)
returns jsonb language plpgsql security invoker set search_path = ''
as $$
declare r shiok_reports.reports%rowtype; m shiok_reports.moderation%rowtype;
  seen uuid[] := '{}'; expected uuid := p_receipt; kind text; result jsonb := '[]';
begin
  while expected is not null loop
    if expected = any(seen) or cardinality(seen) >= 32 then
      raise sqlstate 'PT409' using message = 'invalid_duplicate_chain';
    end if;
    select * into r from shiok_reports.reports where receipt_id = expected and expires_at > p_now;
    if not found then raise sqlstate 'PT409' using message = 'duplicate_target_missing'; end if;
    if kind is not null and kind <> r.report_type then
      raise sqlstate 'PT409' using message = 'duplicate_type_mismatch';
    end if;
    kind := r.report_type; seen := array_append(seen,expected);
    select * into m from shiok_reports.moderation where receipt_id = expected;
    if (r.state = 'pending') <> (not found) then
      raise sqlstate 'PT409' using message = 'invalid_duplicate_chain';
    end if;
    if r.state <> 'pending' and (m.action <> r.state or m.to_revision <> r.revision or m.moderated_at < r.received_at) then
      raise sqlstate 'PT409' using message = 'invalid_duplicate_chain';
    end if;
    result := result || jsonb_build_array(jsonb_build_object('receipt_id',r.receipt_id,
      'report_type',r.report_type,'state',r.state,'revision',r.revision,
      'received_at',r.received_at,'moderated_at',m.moderated_at,'moderator_id',m.moderator_id,
      'reason',m.reason,'duplicate_of',m.duplicate_of));
    expected := case when r.state = 'duplicate' then m.duplicate_of else null end;
  end loop;
  return result;
end;
$$;
revoke all on function shiok_reports.moderator_chain_v1(uuid,timestamptz) from public,anon,authenticated,service_role;

create function shiok_reports.moderator_context_v1(
  p_actor uuid,p_session uuid,p_token_expires_at timestamptz,p_receipt uuid,p_duplicate uuid
) returns jsonb language plpgsql security definer set search_path = '' set lock_timeout = '2s'
as $$
declare source jsonb; chain jsonb := '[]'; t timestamptz;
  r shiok_reports.reports%rowtype; m shiok_reports.moderation%rowtype;
begin
  perform 1 from shiok_reports.control where singleton for update;
  if not found then raise sqlstate 'PT503' using message = 'moderator_unavailable'; end if;
  perform shiok_reports.require_moderator_v1(p_actor,p_session,p_token_expires_at);
  t := clock_timestamp();
  if p_receipt is null then raise sqlstate 'PT400' using message = 'invalid_context'; end if;
  select * into r from shiok_reports.reports where receipt_id=p_receipt and expires_at>t;
  if not found then raise sqlstate 'PT409' using message='revision_conflict'; end if;
  select * into m from shiok_reports.moderation where receipt_id=p_receipt;
  if (r.state='pending') <> (not found) or (r.state<>'pending' and
    (m.action<>r.state or m.to_revision<>r.revision or m.moderated_at<r.received_at)) then
    raise sqlstate 'PT409' using message='invalid_duplicate_chain';
  end if;
  -- An expired/deleted target does not hide this source's retained decision.
  source := jsonb_build_object('receipt_id',r.receipt_id,'report_type',r.report_type,'state',r.state,
    'revision',r.revision,'received_at',r.received_at,'moderated_at',m.moderated_at,
    'moderator_id',m.moderator_id,'reason',m.reason,'duplicate_of',m.duplicate_of);
  if p_duplicate is not null then chain := shiok_reports.moderator_chain_v1(p_duplicate,t); end if;
  return jsonb_build_object('source',source,'target_chain',chain,'observed_at',t);
end;
$$;
revoke all on function shiok_reports.moderator_context_v1(uuid,uuid,timestamptz,uuid,uuid) from public,anon,authenticated,service_role;

create function shiok_reports.moderator_decide_v1(
  p_actor uuid,p_session uuid,p_token_expires_at timestamptz,
  p_receipt uuid,p_revision bigint,p_action text,p_reason text,p_duplicate uuid,p_read_set jsonb
) returns jsonb language plpgsql security definer set search_path = '' set lock_timeout = '2s'
as $$
declare r shiok_reports.reports%rowtype; chain jsonb := '[]'; expected jsonb; t timestamptz;
begin
  perform 1 from shiok_reports.control where singleton for update;
  if not found then raise sqlstate 'PT503' using message = 'moderator_unavailable'; end if;
  perform shiok_reports.require_moderator_v1(p_actor,p_session,p_token_expires_at);
  t := clock_timestamp();
  if p_receipt is null or p_revision is null or p_revision not between 1 and 9007199254740990
    or p_action is null or p_action not in ('accepted','rejected','duplicate')
    or p_reason is null or char_length(p_reason) not between 1 and 1000
    or btrim(p_reason,U&'\0009\000a\000b\000c\000d\0020\00a0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200a\2028\2029\202f\205f\3000\feff') = ''
    or (p_action = 'duplicate') <> (p_duplicate is not null)
    or p_read_set is null or jsonb_typeof(p_read_set) <> 'array' then
    raise sqlstate 'PT400' using message = 'invalid_decision';
  end if;
  select * into r from shiok_reports.reports where receipt_id = p_receipt and expires_at > t;
  if not found or r.state <> 'pending' or r.revision <> p_revision then
    raise sqlstate 'PT409' using message = 'revision_conflict';
  end if;
  if t < r.received_at then raise sqlstate 'PT503' using message = 'moderator_unavailable'; end if;
  expected := jsonb_build_array(jsonb_build_object('receipt_id',p_receipt,'revision',p_revision));
  if p_duplicate is not null then
    chain := shiok_reports.moderator_chain_v1(p_duplicate,t);
    if exists(select 1 from jsonb_array_elements(chain) e where (e->>'receipt_id')::uuid = p_receipt)
      or exists(select 1 from jsonb_array_elements(chain) e where e->>'report_type' <> r.report_type) then
      raise sqlstate 'PT409' using message = 'invalid_duplicate_chain';
    end if;
    select expected || coalesce(jsonb_agg(jsonb_build_object('receipt_id',e->'receipt_id','revision',e->'revision') order by ord),'[]'::jsonb)
      into expected from jsonb_array_elements(chain) with ordinality a(e,ord);
  end if;
  if p_read_set <> expected then raise sqlstate 'PT409' using message = 'revision_conflict'; end if;
  insert into shiok_reports.moderation(receipt_id,from_revision,to_revision,action,moderator_id,moderated_at,reason,duplicate_of)
    values (p_receipt,p_revision,p_revision+1,p_action,p_actor,t,p_reason,p_duplicate);
  update shiok_reports.reports set state=p_action,revision=p_revision+1 where receipt_id=p_receipt;
  return jsonb_build_object('receipt_id',p_receipt,'state',p_action,'revision',p_revision+1,'moderated_at',t);
end;
$$;
revoke all on function shiok_reports.moderator_decide_v1(uuid,uuid,timestamptz,uuid,bigint,text,text,uuid,jsonb) from public,anon,authenticated,service_role;

-- Public schema holds only service-role gateways, never tables or browser grants.
create function public.shiok_moderator_queue_v1(p_actor uuid,p_session uuid,p_token_expires_at timestamptz,
  p_state text,p_after_received_at timestamptz,p_after_receipt_id uuid)
returns jsonb language sql security invoker set search_path = '' as $$
  select shiok_reports.moderator_queue_v1($1,$2,$3,$4,$5,$6);
$$;
create function public.shiok_moderator_context_v1(p_actor uuid,p_session uuid,p_token_expires_at timestamptz,
  p_receipt uuid,p_duplicate uuid)
returns jsonb language sql security invoker set search_path = '' as $$
  select shiok_reports.moderator_context_v1($1,$2,$3,$4,$5);
$$;
create function public.shiok_moderator_decide_v1(p_actor uuid,p_session uuid,p_token_expires_at timestamptz,
  p_receipt uuid,p_revision bigint,p_action text,p_reason text,p_duplicate uuid,p_read_set jsonb)
returns jsonb language sql security invoker set search_path = '' as $$
  select shiok_reports.moderator_decide_v1($1,$2,$3,$4,$5,$6,$7,$8,$9);
$$;
revoke all on function public.shiok_moderator_queue_v1(uuid,uuid,timestamptz,text,timestamptz,uuid),
  public.shiok_moderator_context_v1(uuid,uuid,timestamptz,uuid,uuid),
  public.shiok_moderator_decide_v1(uuid,uuid,timestamptz,uuid,bigint,text,text,uuid,jsonb)
  from public,anon,authenticated;
grant execute on function public.shiok_moderator_queue_v1(uuid,uuid,timestamptz,text,timestamptz,uuid),
  public.shiok_moderator_context_v1(uuid,uuid,timestamptz,uuid,uuid),
  public.shiok_moderator_decide_v1(uuid,uuid,timestamptz,uuid,bigint,text,text,uuid,jsonb),
  shiok_reports.moderator_queue_v1(uuid,uuid,timestamptz,text,timestamptz,uuid),
  shiok_reports.moderator_context_v1(uuid,uuid,timestamptz,uuid,uuid),
  shiok_reports.moderator_decide_v1(uuid,uuid,timestamptz,uuid,bigint,text,text,uuid,jsonb)
  to service_role;
