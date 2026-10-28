import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
const labels:Record<string,string>={submitted:"Yuborildi",reviewing:"Ko‘rib chiqilmoqda",needs_details:"Qo‘shimcha ma’lumot kerak",approved:"Ma’qullangan",in_progress:"Jarayonda",completed:"Yakunlangan",declined:"Rad etilgan"};
function serviceKey():string{
 const legacy=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");if(legacy)return legacy;
 try{const keys=JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")||"{}");if(typeof keys.default==="string")return keys.default;const v=Object.values(keys).find(x=>typeof x==="string");return typeof v==="string"?v:"";}catch{return""}
}
Deno.serve(async(req:Request)=>{
 if(req.method!=="POST")return Response.json({error:"Only POST"},{status:405});
 const url=Deno.env.get("SUPABASE_URL")||"",key=serviceKey(),token=Deno.env.get("TELEGRAM_BOT_TOKEN");
 if(!url||!key)return Response.json({error:"Server configuration missing"},{status:503});
 const bearer=(req.headers.get("authorization")||"").replace(/^Bearer\s+/i,"");
 if(!bearer)return Response.json({error:"Admin session required"},{status:401});
 const db=createClient(url,key,{auth:{autoRefreshToken:false,persistSession:false}});
 const {data:userData,error:userError}=await db.auth.getUser(bearer);
 if(userError||!userData.user?.email)return Response.json({error:"Invalid session"},{status:401});
 const email=userData.user.email.toLowerCase().trim();
 const {data:admin}=await db.from("admin_allowlist").select("email").eq("email",email).eq("active",true).maybeSingle();
 if(!admin)return Response.json({error:"Admin access required"},{status:403});
 let body:any;try{body=await req.json()}catch{return Response.json({error:"Bad JSON"},{status:400})}
 const id=String(body.initiative_id||"");
 const {data:row,error}=await db.from("initiatives").select("id,reference_code,title,status").eq("id",id).maybeSingle();
 if(error||!row)return Response.json({error:"Initiative not found"},{status:404});
 if(String(body.new_status||"")!==row.status)return Response.json({error:"Status changed or mismatched"},{status:409});
 if(!token)return Response.json({sent:0,configured:false,reason:"TELEGRAM_BOT_TOKEN is not set"});
 const {data:subs}=await db.from("telegram_subscriptions").select("telegram_chat_id").eq("reference_code",row.reference_code).eq("active",true);
 const message="Yoshlar-Ishi: ariza holati yangilandi.\nAriza: "+row.title+"\nKod: "+row.reference_code+"\nHolat: "+(labels[row.status]||row.status);
 let sent=0,failed=0;
 for(const sub of subs||[]){
  try{
   const r=await fetch("https://api.telegram.org/bot"+token+"/sendMessage",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({chat_id:sub.telegram_chat_id,text:message,disable_web_page_preview:true}),signal:AbortSignal.timeout(9000)});
   if(r.ok)sent++;else failed++;
  }catch{failed++}
 }
 return Response.json({sent,failed,configured:true});
});