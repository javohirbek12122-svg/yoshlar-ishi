import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};
function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers: cors });
}
function serviceKey(): string {
  const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacy) return legacy;
  try {
    const keys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}");
    if (typeof keys.default === "string") return keys.default;
    const value = Object.values(keys).find((item) => typeof item === "string");
    return typeof value === "string" ? value : "";
  } catch { return ""; }
}
const labels: Record<string,string> = {
  startup:"startap", education:"ta’lim", community:"mahalla va jamoa",
  volunteer:"ko‘ngillilik", culture:"madaniyat", technology:"texnologiya", other:"boshqa"
};
function containsSensitivePattern(text: string): boolean {
  return /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(text)
    || /(?:\+?998[\s()-]?)?(?:\d[\s()-]?){9,12}/.test(text)
    || /\b(?:passport|pasport|jshshir|pinfl|oneid parol|bank karta|card number)\b/i.test(text);
}
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json(405, { error: "Faqat POST so‘rovi qabul qilinadi." });
  const apiKey = Deno.env.get("GROQ_API_KEY");
  if (!apiKey) return json(503, {
    error: "AI kaliti hali sozlanmagan.",
    code: "AI_PROVIDER_NOT_CONFIGURED",
    details: "Supabase Edge Function Secrets bo‘limiga GROQ_API_KEY kiriting. Kalit brauzerga yuborilmaydi."
  });
  const url = Deno.env.get("SUPABASE_URL") || "";
  const key = serviceKey();
  if (!url || !key) return json(503, { error: "Server sozlamasi to‘liq emas." });
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json(400, { error: "JSON ma’lumot kutilgan." }); }
  const title = String(body.title || "").trim().slice(0, 160);
  const category = String(body.category || "other").slice(0, 40);
  const problem = String(body.problem || "").trim().slice(0, 2200);
  const expected = String(body.expected_result || "").trim().slice(0, 1200);
  const resources = String(body.resources || "").trim().slice(0, 700);
  if (title.length < 5 || problem.length < 30 || expected.length < 10) {
    return json(400, { error: "G‘oya nomi, muammo (kamida 30 belgi) va kutilayotgan natijani to‘ldiring." });
  }
  if (containsSensitivePattern([title,problem,expected,resources].join("\n"))) {
    return json(400, { error: "Matnda telefon, email yoki maxfiy identifikator ko‘rinadi. Shaxsiy ma’lumotni olib tashlab, qayta yuboring." });
  }
  const proxy = (req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown").split(",")[0].trim();
  const salt = Deno.env.get("AI_RATE_LIMIT_SALT") || url;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(salt + "|" + proxy));
  const rateHash = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2,"0")).join("").toUpperCase();
  const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  const quota = await supabase.rpc("consume_idea_review_quota", { p_rate_hash: rateHash, p_limit: 4 });
  if (quota.error) return json(503, { error: "Tahlil cheklovini tekshirish vaqtincha ishlamadi." });
  if (quota.data !== true) return json(429, { error: "Bir daqiqada 4 ta tahlil limiti bor. Biroz kutib qayta urinib ko‘ring." });

  const model = Deno.env.get("GROQ_MODEL") || "openai/gpt-oss-20b";
  const system = "Sen Yoshlar-Ishi mustaqil platformasining o‘zbek tilida g‘oya tahlil qiluvchi yordamchisisan. G‘oya egasiga sodda va amaliy maslahat ber. Grant, yordam, ishga qabul yoki muvaffaqiyatni va’da qilma. Huquqiy, moliyaviy va tibbiy xulosa bermagin. Muammo, auditoriya, amaliy yechim, natija o‘lchovi va xavflarni tekshir. Dalil yetishmasa uydirma qilma. Faqat valid JSON obyekt qaytar: {\"strengths\":[\"...\"],\"gaps\":[\"...\"],\"next_steps\":[\"...\"],\"risks\":[\"...\"],\"suggested_metric\":\"...\",\"summary\":\"...\"}. Barcha qiymatlar o‘zbek tilida. Har ro‘yxat 2–4 elementdan oshmasin.";
  const user = "G‘oya nomi: " + title + "\nYo‘nalish: " + (labels[category] || category) + "\nMuammo: " + problem + "\nKutilayotgan natija: " + expected + "\nMavjud resurslar: " + (resources || "Ko‘rsatilmagan") + "\n\nAmaliy, yosh tashabbuskor tushunadigan tahlil tuz.";
  let response: Response;
  try {
    response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": "Bearer " + apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        model, temperature: 0.25, max_tokens: 950, response_format: { type: "json_object" },
        messages: [{ role: "system", content: system }, { role: "user", content: user }]
      }),
      signal: AbortSignal.timeout(22000)
    });
  } catch { return json(502, { error: "AI xizmati bilan aloqa o‘rnatilmadi. Keyinroq qayta urinib ko‘ring." }); }
  if (!response.ok) {
    const status = response.status;
    return json(status === 429 ? 429 : 502, {
      error: status === 429 ? "AI provayderining limiti vaqtincha tugadi." : "AI provayderi so‘rovni bajarmadi.",
      provider_status: status
    });
  }
  let envelope: any;
  try { envelope = await response.json(); } catch { return json(502, { error: "AI javobini o‘qib bo‘lmadi." }); }
  const content = envelope?.choices?.[0]?.message?.content;
  let review: any;
  try { review = JSON.parse(content); } catch { return json(502, { error: "AI javobi kerakli formatda emas." }); }
  const list = (x: unknown) => Array.isArray(x) ? x.filter(v => typeof v === "string").slice(0,4).map(v => String(v).slice(0,350)) : [];
  return json(200, { model, review: {
    strengths: list(review.strengths), gaps: list(review.gaps), next_steps: list(review.next_steps),
    risks: list(review.risks), suggested_metric: String(review.suggested_metric || "").slice(0,500),
    summary: String(review.summary || "").slice(0,600)
  }, disclaimer: "Bu AI tavsiyasi rasmiy baho emas. Natijani mustaqil tekshiring; u grant, ish yoki yordam olishni kafolatlamaydi." });
});