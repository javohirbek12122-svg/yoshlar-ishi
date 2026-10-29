import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

function json(status: number, payload: Record<string, unknown>) {
  return new Response(JSON.stringify(payload), { status, headers });
}

function serviceKey(): string {
  const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacy) return legacy;
  try {
    const keys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}");
    if (typeof keys.default === "string") return keys.default;
    const value = Object.values(keys).find((item) => typeof item === "string");
    return typeof value === "string" ? value : "";
  } catch {
    return "";
  }
}

function textValue(body: Record<string, unknown>, key: string, max: number): string {
  const value = body[key];
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max + 1);
}

function tags(value: unknown, maxCount = 10): string[] {
  const list = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/[;,]/)
      : [];
  return list
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim().slice(0, 80))
    .filter(Boolean)
    .slice(0, maxCount);
}

function httpsUrl(value: string): string {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.username === "" && url.password === ""
      ? url.href.slice(0, 300)
      : "";
  } catch {
    return "";
  }
}

function clientAddress(req: Request): string {
  const direct = req.headers.get("cf-connecting-ip") || req.headers.get("x-real-ip");
  if (direct && direct.trim()) return direct.trim().slice(0, 120);
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const values = forwarded.split(",").map((item) => item.trim()).filter(Boolean);
    if (values.length) return values[0].slice(0, 120);
  }
  return "unknown";
}

async function rateHash(action: string, address: string, serverSecret: string): Promise<string> {
  const salt = Deno.env.get("COMMUNITY_RATE_LIMIT_SALT") || serverSecret;
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(salt + "|" + action + "|" + address),
  );
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

async function signedInOwner(req: Request, db: ReturnType<typeof createClient>): Promise<string | null> {
  const raw = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  // Publishable/anon API keys are not user JWTs. Only attach an owner id for a verifiable user token.
  if (!raw || raw.split(".").length !== 3) return null;
  try {
    const { data, error } = await db.auth.getUser(raw);
    if (error || !data.user?.id) return null;
    return data.user.id;
  } catch {
    return null;
  }
}

const categories = new Set([
  "technology", "design", "marketing", "content", "business", "research", "volunteer", "other",
]);
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ageBands = new Set(["under_16", "16-18", "19-24", "25-30", "30_plus"]);
const initiativeCategories = new Set(["startup", "education", "community", "volunteer", "culture", "technology", "other"]);
const supportTypes = new Set(["mentor", "team", "funding", "resources"]);
function newReferenceCode(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return "YI-" + Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("").toUpperCase();
}


Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers });
  if (req.method !== "POST") return json(405, { error: "Faqat POST so‘rovi qabul qilinadi." });

  const contentLength = Number(req.headers.get("content-length") || "0");
  if (Number.isFinite(contentLength) && contentLength > 16000) {
    return json(413, { error: "Yuborilayotgan matn hajmi juda katta." });
  }

  let body: Record<string, unknown>;
  try {
    const value = await req.json();
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return json(400, { error: "JSON obyekt kutilgan." });
    }
    body = value as Record<string, unknown>;
  } catch {
    return json(400, { error: "JSON ma’lumot kutilgan." });
  }

  const action = String(body.action || "");
  if (action !== "team_post" && action !== "team_interest" && action !== "initiative_submit") {
    return json(400, { error: "Yuborish turi noto‘g‘ri." });
  }

  // Honeypots reduce basic bot traffic without storing the supplied content.
  const honeypot = textValue(body, action === "team_interest" ? "interest_website" : "website", 500);
  if (honeypot) {
    return json(200, { ok: true, message: "So‘rov qabul qilindi." });
  }

  if (body.consent !== true) {
    return json(400, { error: "Ma’lumotlarni qayta ishlashga rozilik belgilang." });
  }

  const url = Deno.env.get("SUPABASE_URL") || "";
  const key = serviceKey();
  if (!url || !key) return json(503, { error: "Server sozlamasi to‘liq emas." });

  const db = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  let insertPayload: Record<string, unknown>;
  let limit = 5;
  let windowSeconds = 600;
  let responseMessage = "";

  if (action === "team_post") {
    const title = textValue(body, "title", 120);
    const description = textValue(body, "description", 1600);
    const category = textValue(body, "category", 40);
    const district = textValue(body, "district", 100);
    const commitment = textValue(body, "commitment", 80) || "Flexible";
    const roles = tags(body.roles);
    const skills = tags(body.skills);
    const shareContact = body.contact_shared === true;
    const enteredContact = textValue(body, "public_contact_url", 300);
    const publicContact = shareContact ? httpsUrl(enteredContact) : "";

    if (title.length < 5 || title.length > 120) {
      return json(400, { error: "E’lon sarlavhasi 5–120 belgi oralig‘ida bo‘lishi kerak." });
    }
    if (description.length < 20 || description.length > 1600) {
      return json(400, { error: "Loyiha tavsifi 20–1600 belgi oralig‘ida bo‘lishi kerak." });
    }
    if (!categories.has(category)) return json(400, { error: "Yo‘nalish noto‘g‘ri tanlangan." });
    if (district.length > 100 || commitment.length > 80) {
      return json(400, { error: "Hudud yoki vaqt talabi juda uzun." });
    }
    if (shareContact && !publicContact) {
      return json(400, { error: "Ommaviy kontakt uchun yaroqli HTTPS havola kiriting." });
    }
    if (!shareContact && enteredContact) {
      // Don't persist a contact value unless the owner explicitly consents to public display.
      body.public_contact_url = "";
    }

    limit = 2;
    windowSeconds = 86400;
    const ownerId = await signedInOwner(req, db);
    insertPayload = {
      owner_id: ownerId,
      title,
      description,
      category,
      roles,
      skills,
      district,
      commitment,
      public_contact_url: shareContact ? publicContact : "",
      contact_shared: shareContact,
      status: "pending",
    };
    responseMessage = "E’lon moderatsiyaga yuborildi. Admin tasdiqlagach jamoa doskasida ko‘rinadi.";
  } else if (action === "team_interest") {
    const postId = textValue(body, "team_post_id", 36);
    const name = textValue(body, "name", 120);
    const contact = textValue(body, "contact", 300);
    const roleInterest = textValue(body, "role_interest", 120);
    const message = textValue(body, "message", 1200);
    if (!uuidPattern.test(postId)) return json(400, { error: "Jamoa e’loni tanlanmagan yoki noto‘g‘ri." });
    if (name.length < 2 || name.length > 120) {
      return json(400, { error: "Ism 2–120 belgi oralig‘ida bo‘lishi kerak." });
    }
    if (contact.length < 4 || contact.length > 300) {
      return json(400, { error: "Aloqa manzilini tekshiring." });
    }
    if (roleInterest.length > 120 || message.length < 5 || message.length > 1200) {
      return json(400, { error: "Rol yoki xabar uzunligini tekshiring." });
    }
    const { data: publishedPost, error: postError } = await db
      .from("team_posts")
      .select("id")
      .eq("id", postId)
      .eq("status", "published")
      .maybeSingle();
    if (postError) return json(503, { error: "E’lonni tekshirish vaqtincha ishlamadi." });
    if (!publishedPost) return json(404, { error: "Bu e’lon endi ochiq emas." });

    insertPayload = {
      team_post_id: postId,
      name,
      contact,
      role_interest: roleInterest,
      message,
      status: "new",
    };
    responseMessage = "Qiziqishingiz yuborildi. Kontakt ma’lumotingiz ommaviy doskada ko‘rinmaydi.";
  } else {
    const submitterName = textValue(body, "submitter_name", 120);
    const ageBand = textValue(body, "age_band", 20);
    const district = textValue(body, "district", 120);
    const category = textValue(body, "category", 40);
    const title = textValue(body, "title", 160);
    const problem = textValue(body, "problem", 3000);
    const expectedResult = textValue(body, "expected_result", 2000);
    const contact = textValue(body, "contact", 200);
    const rawSupport = body.support_needed;
    if (submitterName.length < 2 || submitterName.length > 120) {
      return json(400, { error: "Ism-familiya 2–120 belgi oralig‘ida bo‘lishi kerak." });
    }
    if (!ageBands.has(ageBand)) return json(400, { error: "Yosh toifasi noto‘g‘ri tanlangan." });
    if (district.length > 120) return json(400, { error: "Tuman yoki shahar nomi juda uzun." });
    if (!initiativeCategories.has(category)) return json(400, { error: "Tashabbus yo‘nalishi noto‘g‘ri." });
    if (title.length < 5 || title.length > 160) {
      return json(400, { error: "Tashabbus nomi 5–160 belgi oralig‘ida bo‘lishi kerak." });
    }
    if (problem.length < 15 || problem.length > 3000) {
      return json(400, { error: "Muammo tavsifi 15–3000 belgi oralig‘ida bo‘lishi kerak." });
    }
    if (expectedResult.length < 10 || expectedResult.length > 2000) {
      return json(400, { error: "Kutilayotgan natija 10–2000 belgi oralig‘ida bo‘lishi kerak." });
    }
    if (contact.length > 200) return json(400, { error: "Aloqa maydoni juda uzun." });
    if (rawSupport !== undefined && !Array.isArray(rawSupport)) {
      return json(400, { error: "Yordam turlari noto‘g‘ri yuborildi." });
    }
    const supportNeeded = Array.isArray(rawSupport)
      ? rawSupport.filter((item): item is string => typeof item === "string" && supportTypes.has(item)).slice(0, 4)
      : [];
    if (Array.isArray(rawSupport) && supportNeeded.length !== rawSupport.length) {
      return json(400, { error: "Yordam turlaridan biri noto‘g‘ri." });
    }

    limit = 4;
    windowSeconds = 3600;
    const ownerId = await signedInOwner(req, db);
    const referenceCode = newReferenceCode();
    insertPayload = {
      reference_code: referenceCode,
      owner_id: ownerId,
      submitter_name: submitterName,
      age_band: ageBand,
      district,
      category,
      title,
      problem,
      expected_result: expectedResult,
      support_needed: supportNeeded,
      contact,
      status: "submitted",
    };
    responseMessage = "Tashabbus yuborildi. Kuzatuv kodingizni saqlab qo‘ying.";
  }

  const digest = await rateHash(action, clientAddress(req), key);
  const quota = await db.rpc("consume_community_submission_quota", {
    p_action: action,
    p_rate_hash: digest,
    p_window_seconds: windowSeconds,
    p_limit: limit,
  });
  if (quota.error) return json(503, { error: "Yuborish limitini tekshirish vaqtincha ishlamadi." });
  if (quota.data !== true) {
    return json(429, {
      error: action === "team_post"
        ? "Bir tarmoq xeshidan kuniga ko‘pi bilan 2 ta jamoa e’loni yuboriladi."
        : action === "initiative_submit"
          ? "Bir tarmoq xeshidan soatiga ko‘pi bilan 4 ta tashabbus yuboriladi."
          : "Qiziqish so‘rovlari soni vaqtincha cheklangan. Biroz kutib qayta urinib ko‘ring.",
    });
  }

  const table = action === "team_post" ? "team_posts" : action === "initiative_submit" ? "initiatives" : "team_interest_requests";
  const { error: insertError } = await db.from(table).insert(insertPayload);
  if (insertError) {
    // Do not log or return the user-entered data, which may contain personal information.
    console.error("Community submission insert failed", { action, code: insertError.code || "unknown" });
    if (action === "initiative_submit" && insertError.code === "23505") {
      return json(409, { error: "Kuzatuv kodi to‘qnashdi. Iltimos, yana bir bor yuboring." });
    }
    return json(503, { error: "So‘rov saqlanmadi. Keyinroq qayta urinib ko‘ring." });
  }

  const success: Record<string, unknown> = { ok: true, message: responseMessage };
  if (action === "initiative_submit") success.reference_code = insertPayload.reference_code;
  return json(200, success);
});
