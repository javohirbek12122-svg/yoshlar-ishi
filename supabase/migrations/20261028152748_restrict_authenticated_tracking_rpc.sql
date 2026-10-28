-- Tracking RPC is meant for anonymous code-based lookup; authenticated role does not need direct execute permission.
revoke execute on function public.track_initiative(text) from authenticated;
