-- Owner-approved 30-day expiry. The applied 20260914161526 migration is immutable.
-- Preflight requires zero rows with expires_at > received_at + interval '30 days'.
-- ADD CHECK validates existing rows under its table lock; conflicting rows abort,
-- without rewriting/deleting report data or enabling intake. Do not use NOT VALID.
-- One atomic statement also protects standalone/autocommit execution: a failure
-- rolls back both the constraint and RPC replacement, without committing a caller's transaction.
do $migration$
begin
  alter table shiok_reports.reports
    add constraint shiok_reports_expiry_30_days
    check (expires_at <= received_at + interval '30 days');

create or replace function public.shiok_report_submit_v1(
  p_request_id uuid,
  p_canonical_content text,
  p_retry_proof_sha256 text,
  p_abuse_bucket_sha256 text
) returns jsonb
language plpgsql security invoker
set search_path = ''
set lock_timeout = '2s'
as $$
declare
  ctl shiok_reports.control%rowtype;
  existing shiok_reports.reports%rowtype;
  saved shiok_reports.reports%rowtype;
  payload json;
  captured_at timestamptz;
  today date;
  digest text;
begin
  if p_request_id is null or p_request_id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    or p_retry_proof_sha256 is null or p_retry_proof_sha256 !~ '^[0-9a-f]{64}$'
    or p_abuse_bucket_sha256 is null or p_abuse_bucket_sha256 !~ '^[0-9a-f]{64}$'
    or p_canonical_content is null or octet_length(p_canonical_content) > 8192
    or not (p_canonical_content is json object with unique keys) then
    raise sqlstate 'PT400' using message = 'invalid_report';
  end if;
  -- Retain canonical JSON text, not jsonb normalization. Wire validation is server-owned.
  payload := p_canonical_content::json;
  if (payload ->> 'schema_version') is distinct from '1'
    or (payload ->> 'report_type') is null
    or (payload ->> 'report_type') not in ('mapping_error', 'shelter_request')
    or (payload ->> 'referenced_bundle_version') is null
    or json_typeof(payload -> 'geometry') is distinct from 'object'
    or exists (select 1 from json_object_keys(payload) k where k not in ('schema_version', 'report_type', 'geometry', 'referenced_bundle_version', 'context', 'note')) then
    raise sqlstate 'PT400' using message = 'invalid_report';
  end if;

  -- One small admission lock serializes identity and BOTH caps across server instances.
  -- Every future moderation/cleanup writer must take this same lock first.
  select * into ctl from shiok_reports.control where singleton for update;
  captured_at := clock_timestamp();
  today := (captured_at at time zone 'UTC')::date;
  if not found or not ctl.enabled or ctl.policy_approved_at is null
    or ctl.policy_approved_at > captured_at or ctl.cleanup_verified_at is null
    or ctl.cleanup_verified_at > captured_at
    or ctl.cleanup_verified_at < captured_at - interval '26 hours' then
    raise sqlstate 'PT503' using message = 'reporting_unavailable';
  end if;
  digest := encode(sha256(convert_to(p_canonical_content, 'UTF8')), 'hex');
  select * into existing from shiok_reports.reports where request_id = p_request_id;
  if found then
    if existing.retry_proof_sha256 <> p_retry_proof_sha256
      or existing.content_sha256 <> digest or existing.canonical_content <> p_canonical_content then
      raise sqlstate 'PT409' using message = 'request_conflict';
    end if;
    if existing.expires_at <= captured_at then
      raise sqlstate 'PT410' using message = 'receipt_expired';
    end if;
    return jsonb_build_object('receipt_id', existing.receipt_id, 'received_at', existing.received_at, 'replayed', true);
  end if;
  if not ((payload ->> 'referenced_bundle_version') = any(ctl.allowed_bundles)) then
    raise sqlstate 'PT400' using message = 'unknown_bundle';
  end if;
  if coalesce((select admitted from shiok_reports.daily_usage where day = today and bucket = 'global'), 0) >= 100
    or coalesce((select admitted from shiok_reports.daily_usage where day = today and bucket = p_abuse_bucket_sha256), 0) >= 5
    or (select count(*) from shiok_reports.reports where state = 'pending') >= 500
    or (select count(*) from shiok_reports.reports) >= 5000 then
    raise sqlstate 'PT429' using message = 'report_limit_reached';
  end if;

  insert into shiok_reports.reports (request_id, retry_proof_sha256, canonical_content,
    content_sha256, report_type, received_at, expires_at)
  values (p_request_id, p_retry_proof_sha256, p_canonical_content, digest,
    payload ->> 'report_type', captured_at, captured_at + interval '30 days')
  returning * into saved;
  insert into shiok_reports.daily_usage (day, bucket, admitted)
    values (today, 'global', 1), (today, p_abuse_bucket_sha256, 1)
    on conflict (day, bucket) do update set admitted = shiok_reports.daily_usage.admitted + 1;
  return jsonb_build_object('receipt_id', saved.receipt_id, 'received_at', saved.received_at, 'replayed', false);
end;
$$;
revoke all on function public.shiok_report_submit_v1(uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.shiok_report_submit_v1(uuid, text, text, text) to service_role;
end;
$migration$;
