-- Preserve Supabase's automatic RLS event trigger, but do not expose its
-- SECURITY DEFINER entry point to anonymous or signed-in resident API roles.
do $$
begin
  if not exists(select 1 from pg_proc where oid='public.rls_auto_enable()'::regprocedure
    and prorettype='event_trigger'::regtype and prosecdef
    and proconfig=array['search_path=pg_catalog']
    and encode(sha256(convert_to(prosrc,'UTF8')),'hex')='2782e98b348aca7d6f6f73c420fd78d2e094957dd7a52b0483d4c34f29d2a7a1')
    or not exists(select 1 from pg_event_trigger where evtname='ensure_rls'
      and evtfoid='public.rls_auto_enable()'::regprocedure and evtenabled='O'
      and evtevent='ddl_command_end') then
    raise exception 'Unexpected Supabase RLS helper; stop before changing grants';
  end if;
  revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
end;
$$;
