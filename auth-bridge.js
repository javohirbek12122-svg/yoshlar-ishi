import { supabase, getVerifiedIdentity } from "./auth-client.js";

const bridge = Object.freeze({
  client: supabase,
  getIdentity: getVerifiedIdentity,
  async getAccessToken() {
    const identity = await getVerifiedIdentity();
    return identity?.session?.access_token || null;
  },
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return true;
  }
});

window.YI_AUTH = bridge;
window.dispatchEvent(new CustomEvent("yi-auth-ready"));

supabase.auth.onAuthStateChange((event, session) => {
  const detail = Object.freeze({
    event,
    userId: session?.user?.id || null
  });
  window.setTimeout(() => {
    window.dispatchEvent(new CustomEvent("yi-auth-change", { detail }));
  }, 0);
});
