-- Allow service role automation to configure and manually trigger the
-- GitHub sync dispatcher after the dispatcher migration has been applied.

grant execute on function public.configure_github_sync_dispatcher(text, text, boolean, text)
  to service_role;
grant execute on function public.dispatch_github_sync_jobs()
  to service_role;

notify pgrst, 'reload schema';
