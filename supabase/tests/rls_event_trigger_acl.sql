-- Caller wraps in BEGIN/ROLLBACK. No report data or existing public table changes.
create temporary table rls_acl_checks(name text primary key,passed boolean not null);
do $$
declare
  c jsonb;
  trigger_before jsonb;
  source_before text;
begin
  select to_jsonb(ctl) into c from shiok_reports.control ctl;
  if (c->>'enabled')::boolean or exists(select 1 from shiok_reports.reports)
    or exists(select 1 from shiok_reports.daily_usage) then raise exception 'Requires disabled empty reports'; end if;
  select to_jsonb(t) into trigger_before from pg_event_trigger t where evtname='ensure_rls';
  select prosrc into source_before from pg_proc where oid='public.rls_auto_enable()'::regprocedure;
  if has_function_privilege('anon','public.rls_auto_enable()','execute')
    or has_function_privilege('authenticated','public.rls_auto_enable()','execute')
    or not has_function_privilege('postgres','public.rls_auto_enable()','execute') then raise exception 'Wrong grants'; end if;
  insert into rls_acl_checks values('resident_execution_revoked_owner_preserved',true);
  set local role anon;
  begin
    perform public.rls_auto_enable();
    raise exception 'Anonymous execution unexpectedly allowed';
  exception when insufficient_privilege then null; end;
  reset role;
  insert into rls_acl_checks values('actual_anonymous_execution_denied',true);
  set local role authenticated;
  begin
    perform public.rls_auto_enable();
    raise exception 'Signed-in execution unexpectedly allowed';
  exception when insufficient_privilege then null; end;
  reset role;
  insert into rls_acl_checks values('actual_authenticated_execution_denied',true);
  if to_regclass('public.shiok_rls_qa_20260915') is not null then raise exception 'Probe table already exists; do not touch it'; end if;
  create table public.shiok_rls_qa_20260915(synthetic_id integer);
  if not exists(select 1 from pg_class where oid='public.shiok_rls_qa_20260915'::regclass and relrowsecurity) then raise exception 'Automatic RLS stopped'; end if;
  insert into rls_acl_checks values('new_public_table_still_gets_automatic_rls',true);
  if source_before is distinct from(select prosrc from pg_proc where oid='public.rls_auto_enable()'::regprocedure)
    or trigger_before is distinct from(select to_jsonb(t) from pg_event_trigger t where evtname='ensure_rls') then raise exception 'Helper body or trigger changed'; end if;
  insert into rls_acl_checks values('function_body_and_event_trigger_unchanged',true);
  if c is distinct from(select to_jsonb(ctl) from shiok_reports.control ctl)
    or exists(select 1 from shiok_reports.reports) or exists(select 1 from shiok_reports.daily_usage) then raise exception 'Reporting state changed'; end if;
  insert into rls_acl_checks values('private_reporting_unchanged',true);
end;
$$;
select * from rls_acl_checks order by name;
