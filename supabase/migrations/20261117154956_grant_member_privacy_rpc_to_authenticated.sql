-- Re-expose the member privacy RPC only to authenticated sessions.
-- The SECURITY DEFINER function still requires auth.uid(), verifies storage ownership,
-- and atomically updates the owner profile and private CV metadata.
revoke all on function public.save_my_member_privacy(text, boolean, text, boolean)
  from public, anon;
grant execute on function public.save_my_member_privacy(text, boolean, text, boolean)
  to authenticated;
