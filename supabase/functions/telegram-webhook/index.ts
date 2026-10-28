import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const statusLabels: Record<string,string> = {
 submitted:"Yuborildi", reviewing:"Ko‘rib chiqilmoqda", needs_details:"Qo‘shimcha ma’lumot kerak",
 approved:"Ma’qullangan", in_progress:"Jarayonda", completed:"Yakunlangan", declined:"Rad etilgan"
};
function serviceKey(): string {
  const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacy) return legacy;
  try {
    const keys=JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")||"{}");
    if(typeof keys.default==="string")return keys.default;
    const value=Object.values(keys).find(x=>typeof x==="string");
    return typeof value==="string"?value:"";
  } catch { return ""; }
}
async function send(token:string,chatId:string,text:string) {
  const r=await fetch("https://api.telegram.org/bot"+token+"/sendMessage",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({chat_id:chatId,text,disable_web_page_preview:true}),
    signal:AbortSignal.timeout(10000)
  });
  if(!r.ok)throw new Error("Telegram message send failed");
}
Deno.serve(async(req:Request)=>{
 if(req.method!=="POST")return new Response("Only POST",{status:405});
 const secret=Deno.env.get("TELEGRAM_WEBHOOK_SECRET"),token=Deno.env.get("TELEGRAM_BOT_TOKEN");
 if(!secret||!token)return new Response("Telegram is not configured",{status:503});
 if(req.headers.get("x-telegram-bot-api-secret-token")!==secret)return new Response("Forbidden",{status:403});
 const url=Deno.env.get("SUPABASE_URL")||"",key=serviceKey();
 if(!url||!key)return new Response("Server configuration error",{status:503});
 let update:any;try{update=await req.json()}catch{return new Response("Bad JSON",{status:400})}
 const msg=update.message;
 if(!msg?.chat?.id||!msg?.from?.id||typeof msg.text!=="string")return new Response("ok",{status:200});
 const chatId=String(msg.chat.id),userId=String(msg.from.id),text=String(msg.text).trim();
 if(msg.chat.type!=="private"){await send(token,chatId,"Botdan shaxsiy chatda foydalaning.");return new Response("ok")}
 if(text==="/start"||text==="/help"){
  await send(token,chatId,"Assalomu alaykum! Bu Yoshlar-Ishi kuzatuv boti.\n\n/link YI-... — kuzatuv kodini ulash\n/status YI-... — holatni tekshirish\n/unlink YI-... — xabarnomani to‘xtatish\n\nKuzatuv kodi maxfiy: uni boshqa odamga yubormang. Bot faqat ariza nomi va holatini ko‘rsatadi.");
  return new Response("ok");
 }
 const match=text.match(/^\/(link|status|unlink)\s+(YI-[A-F0-9]{24})$/i);
 if(!match){await send(token,chatId,"Buyruq tanilmadi. /help yuboring.");return new Response("ok")}
 const command=match[1].toLowerCase(),code=match[2].toUpperCase();
 const db=createClient(url,key,{auth:{autoRefreshToken:false,persistSession:false}});
 if(command==="link"){
  const {data:row,error}=await db.from("initiatives").select("reference_code,title,status,created_at").eq("reference_code",code).maybeSingle();
  if(error||!row){await send(token,chatId,"Bu kod bo‘yicha ariza topilmadi. Kodni tekshiring.");return new Response("ok")}
  const {error:saveError}=await db.from("telegram_subscriptions").upsert({telegram_user_id:userId,telegram_chat_id:chatId,reference_code:code,active:true},{onConflict:"telegram_chat_id,reference_code"});
  if(saveError){await send(token,chatId,"Obunani saqlab bo‘lmadi. Keyinroq qayta urinib ko‘ring.");return new Response("ok")}
  await send(token,chatId,"Obuna ulandi.\nAriza: "+row.title+"\nHolat: "+(statusLabels[row.status]||row.status)+"\n\nHolat o‘zgarganda bot xabar yuboradi. Kodni maxfiy saqlang.");
 } else if(command==="status"){
  const {data:subscription}=await db.from("telegram_subscriptions").select("id").eq("telegram_chat_id",chatId).eq("reference_code",code).eq("active",true).maybeSingle();
  if(!subscription){await send(token,chatId,"Avval /link YI-... orqali ushbu arizaga obuna bo‘ling.");return new Response("ok")}
  const {data:row}=await db.from("initiatives").select("title,status,created_at").eq("reference_code",code).maybeSingle();
  if(!row){await send(token,chatId,"Ariza topilmadi.");return new Response("ok")}
  await send(token,chatId,"Ariza: "+row.title+"\nHolat: "+(statusLabels[row.status]||row.status)+"\nYuborilgan sana: "+new Date(row.created_at).toLocaleDateString("uz-UZ"));
 } else {
  const {error}=await db.from("telegram_subscriptions").update({active:false}).eq("telegram_chat_id",chatId).eq("reference_code",code);
  if(error){await send(token,chatId,"Obunani to‘xtatib bo‘lmadi.");return new Response("ok")}
  await send(token,chatId,"Ushbu ariza bo‘yicha Telegram xabarnomasi to‘xtatildi.");
 }
 return new Response("ok");
});