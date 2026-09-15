-- Daily deletion of expired private reports. Activation is an operational step
-- after a real scheduler test; creating this migration does not enable intake.
do $migration$
declare
  job_id bigint;
begin
  if current_user <> 'postgres' or current_database() <> current_setting('cron.database_name',true)
    or current_setting('cron.timezone',true) not in ('GMT','UTC')
    or current_setting('cron.use_background_workers',true) <> 'off'
    or current_setting('cron.log_run',true) <> 'on' then
    raise exception 'Unexpected scheduler role/configuration; stop';
  end if;
  if not exists(select 1 from pg_proc where oid='shiok_reports.cleanup_expired_v1()'::regprocedure
    and not prosecdef and encode(sha256(convert_to(prosrc,'UTF8')),'hex')=
      '479bd801c44140d1d51f2d03dd7418d372eedd2892501654c6144a7488c27418') then
    raise exception 'Cleanup source mismatch; stop';
  end if;
  if exists(select 1 from pg_extension where extname='pg_cron') then
    raise exception 'Scheduler already installed; inspect before changing it';
  end if;
  create extension pg_cron;
  if not exists(select 1 from pg_extension where extname='pg_cron' and extversion='1.6.4') then
    raise exception 'Unexpected scheduler version; stop';
  end if;
  if exists(select 1 from cron.job where jobname='shiok-report-cleanup-v1') then
    raise exception 'Job already exists; never replace by name';
  end if;
  -- UTC 17:17 is Singapore 01:17 the next day. Keep the outer timeout outside
  -- the function so PostgreSQL starts it before executing the cleanup statement.
  select cron.schedule('shiok-report-cleanup-v1','17 17 * * *',
    'SET statement_timeout = ''30s''; SELECT shiok_reports.cleanup_expired_v1();') into job_id;
  perform cron.alter_job(job_id,active:=false);
end;
$migration$;
