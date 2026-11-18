import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const config = window.YI_CONFIG || {};
const supabaseUrl = String(config.supabaseUrl || "").replace(/\/$/, "");
const supabaseKey = config.supabaseKey || config.supabaseAnonKey || "";

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase Auth sozlamalari topilmadi. config.js faylini tekshiring.");
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: "pkce"
  }
});

let verifiedToken = "";
let verifiedAt = 0;
let verifiedUser = null;

supabase.auth.onAuthStateChange((event, session) => {
  const nextToken = session?.access_token || "";
  if (event === "SIGNED_OUT" || !nextToken || nextToken !== verifiedToken) {
    verifiedToken = "";
    verifiedAt = 0;
    verifiedUser = null;
  }
});

export async function getVerifiedIdentity({ force = false } = {}) {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  const session = sessionData?.session || null;
  if (!session?.access_token) {
    verifiedToken = "";
    verifiedAt = 0;
    verifiedUser = null;
    return null;
  }

  const stillFresh = verifiedToken === session.access_token &&
    verifiedUser?.id === session.user?.id &&
    Date.now() - verifiedAt < 60_000;

  if (!force && stillFresh) return { user: verifiedUser, session };

  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data?.user || data.user.id !== session.user?.id) {
    throw new Error("Hisob sessiyasi tekshiruvdan o‘tmadi. Qayta kiring.");
  }

  verifiedToken = session.access_token;
  verifiedAt = Date.now();
  verifiedUser = data.user;
  return { user: data.user, session };
}
