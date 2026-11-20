(()=>{"use strict";
const B=window.YIAdminBridge;if(!B)return;
const $=id=>document.getElementById(id),api=B.api,notify=B.notify,tell=B.tell;
let initialized=false,members=[],communityPosts=[],assets=[],report=null;
const fallbackHero="https://d2ol7oe51mr4n9.cloudfront.net/user_3JM13LmKQo41EGZkNQHbTC0mG4m/f0a06878-17e7-4fdb-94e6-0437ce7f174c.jpg";
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const date=v=>{if(!v)return "—";try{return new Date(v).toLocaleString("uz-UZ",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"})}catch{return "—"}};
const bytes=v=>{const n=Number(v)||0;return n<1024?n+" B":n<1048576?(n/1024).toFixed(1)+" KB":(n/1048576).toFixed(2)+" MB"};
const audit=(type,entity,id,summary,details={})=>B.recordAdminEvent(type,entity,id,summary,details);
async function loadSummary(){
 try{
  const s=await api("rpc/admin_get_control_center_summary",{method:"POST",body:"{}"});
  const fields=[["Kutilayotgan tashabbuslar","pending_initiatives","Ko‘rib chiqish kerak","initiatives"],["Jarayondagi tashabbuslar","reviewing_initiatives","Ko‘rib chiqilmoqda","initiatives"],["Yangi hamkorliklar","new_partner_requests","Javob kutilmoqda","partners"],["Kutilayotgan jamoa e’lonlari","pending_team_posts","Moderatsiya navbatida","team"],["Nashr qilingan postlar","published_community_posts","Hamjamiyatda ochiq","community"],["Yashirilgan postlar","hidden_community_posts","Draft / yopiq","community"],["Ro‘yxatdan o‘tgan a’zolar","member_profiles","Profil ochgan foydalanuvchilar","members"],["Katalogda ko‘rinadigan a’zolar","public_member_profiles","Rozilik bilan ommaviy","members"],["Faol yoshlar dasturlari","active_youth_programs","Ommaviy katalogda","youth-programs"],["Faol imkoniyat manbalari","active_sources","Saytda ko‘rsatiladi","sources"],["Faol rasmiy portallar","active_official_portals","Rasmiy katalogda","integrations"],["Ommaviy media fayllar","admin_public_assets","Storage kutubxonasi","content"],["Admin amallari · 7 kun","admin_events_7d","Audit jurnalida","activity"]];
  $("controlSummaryGrid").innerHTML=fields.map(([label,key,hint,page])=>'<button class="admin-ops-stat" type="button" data-goto="'+page+'"><span>'+esc(label)+'</span><strong>'+Number(s[key]||0).toLocaleString("uz-UZ")+'</strong><small>'+esc(hint)+' ↗</small></button>').join("");
  $("controlLastChange").textContent=s.last_admin_change?"Oxirgi admin o‘zgarishi: "+date(s.last_admin_change):"Hali admin o‘zgarishi qayd etilmagan.";
  $("controlState").textContent="Supabase’dan olindi";$("controlState").className="statuspill";return true;
 }catch(e){$("controlState").textContent="Yuklanmadi";$("controlState").className="statuspill error";$("controlLastChange").textContent="Nazorat ko‘rsatkichlari yuklanmadi: "+e.message;return false}
}
async function loadMembers(){
 $("membersBody").innerHTML='<tr><td colspan="6" class="empty">A’zolar bazadan yuklanmoqda…</td></tr>';
 try{members=await api("rpc/admin_list_member_directory",{method:"POST",body:JSON.stringify({p_limit:500})})||[];renderMembers();return true}
 catch(e){$("membersBody").innerHTML='<tr><td colspan="6" class="empty">A’zolar yuklanmadi: '+esc(e.message)+'</td></tr>';notify("A’zolar yuklanmadi: "+e.message);return false}
}
function renderMembers(){
 const term=$("memberSearch").value.toLocaleLowerCase("uz"),filter=$("memberVisibilityFilter").value;
 const rows=members.filter(m=>(!filter||m.visibility===filter)&&[m.display_name,m.headline,m.city,m.district].join(" ").toLocaleLowerCase("uz").includes(term));
 $("memberCount").textContent=rows.length+" / "+members.length+" a’zo";
 $("membersBody").innerHTML=rows.length?rows.map(m=>'<tr data-id="'+esc(m.user_id)+'"><td><strong>'+esc(m.display_name||"Yoshlar a’zosi")+'</strong><span class="sub">'+esc(m.headline||"Yo‘nalish ko‘rsatilmagan")+'</span><span class="sub">ID: '+esc(m.user_id)+'</span></td><td>'+esc([m.city,m.district].filter(Boolean).join(" · ")||"—")+'</td><td><select class="statusselect js-mvisibility"><option value="members" '+(m.visibility==="members"?"selected":"")+'>A’zolarga ko‘rinadi</option><option value="private" '+(m.visibility==="private"?"selected":"")+'>Shaxsiy</option></select></td><td><label class="check"><input type="checkbox" class="js-mdirectory" '+(m.show_in_directory?"checked":"")+'> Katalogda ko‘rsatish</label></td><td>'+Number(m.published_posts||0)+'</td><td><button class="savebtn js-msave" type="button">Saqlash</button></td></tr>').join(""):'<tr><td colspan="6" class="empty">Mos a’zo topilmadi.</td></tr>';
}
async function saveMember(btn){
 const tr=btn.closest("tr"),row=members.find(m=>m.user_id===tr.dataset.id);if(!row)return;btn.disabled=true;
 const visibility=tr.querySelector(".js-mvisibility").value,show=tr.querySelector(".js-mdirectory").checked;
 try{
  if(show&&visibility!=="members")throw Error("Shaxsiy profilni ommaviy katalogga chiqarib bo‘lmaydi.");
  const result=await api("rpc/admin_moderate_member_profile",{method:"POST",body:JSON.stringify({p_user_id:row.user_id,p_expected_visibility:row.visibility,p_visibility:visibility,p_expected_show:row.show_in_directory,p_show_in_directory:show,p_reason:"Admin panelidan a’zo maxfiyligi va katalog ko‘rinishi yangilandi."})});
  if(!result||result.user_id!==row.user_id)throw Error("Profil yangilanishi tasdiqlanmadi.");
  await loadMembers();await loadSummary();await B.refresh();notify("A’zo maxfiylik holati yangilandi; audit jurnaliga yozildi.");
 }catch(e){notify("A’zo profili saqlanmadi: "+e.message)}finally{btn.disabled=false}
}
async function loadCommunity(){
 $("communityPostsBody").innerHTML='<tr><td colspan="7" class="empty">Postlar bazadan yuklanmoqda…</td></tr>';
 try{communityPosts=await api("rpc/admin_list_community_posts",{method:"POST",body:JSON.stringify({p_limit:500})})||[];renderCommunity();return true}
 catch(e){$("communityPostsBody").innerHTML='<tr><td colspan="7" class="empty">Postlar yuklanmadi: '+esc(e.message)+'</td></tr>';notify("Hamjamiyat postlari yuklanmadi: "+e.message);return false}
}
function renderCommunity(){
 const term=$("communitySearch").value.toLocaleLowerCase("uz"),filter=$("communityStatusFilter").value;
 const rows=communityPosts.filter(p=>(!filter||p.status===filter)&&[p.author_name,p.body,p.post_type].join(" ").toLocaleLowerCase("uz").includes(term));
 $("communityCount").textContent=rows.length+" / "+communityPosts.length+" post";
 $("communityPostsBody").innerHTML=rows.length?rows.map(p=>'<tr data-id="'+esc(p.id)+'"><td><strong>'+esc(p.author_name)+'</strong><span class="sub">'+esc(date(p.created_at))+'</span><span class="sub">'+esc(p.post_type)+'</span></td><td class="admin-community-copy">'+esc(p.body)+'</td><td>'+Number((p.media_paths||[]).length)+' ta</td><td><select class="statusselect js-cstatus"><option value="published" '+(p.status==="published"?"selected":"")+'>Nashrda</option><option value="draft" '+(p.status==="draft"?"selected":"")+'>Yashirish</option></select></td><td><select class="statusselect js-cvisibility"><option value="members" '+(p.visibility==="members"?"selected":"")+'>A’zolar</option><option value="only_me" '+(p.visibility==="only_me"?"selected":"")+'>Faqat muallif</option></select></td><td><input class="noteinput js-creason" maxlength="200" placeholder="Qisqa sabab / izoh"></td><td><button class="savebtn js-csave" type="button">Saqlash</button></td></tr>').join(""):'<tr><td colspan="7" class="empty">Mos post topilmadi.</td></tr>';
}
async function saveCommunity(btn){
 const tr=btn.closest("tr"),row=communityPosts.find(p=>p.id===tr.dataset.id);if(!row)return;btn.disabled=true;
 try{
  const result=await api("rpc/admin_moderate_community_post",{method:"POST",body:JSON.stringify({p_id:row.id,p_expected_status:row.status,p_expected_visibility:row.visibility,p_status:tr.querySelector(".js-cstatus").value,p_visibility:tr.querySelector(".js-cvisibility").value,p_reason:tr.querySelector(".js-creason").value.trim()||"Hamjamiyat posti admin tomonidan moderatsiya qilindi."})});
  if(!result||result.id!==row.id)throw Error("Moderatsiya natijasi tasdiqlanmadi.");
  await loadCommunity();await loadSummary();await B.refresh();notify("Post moderatsiya qilindi; o‘zgarish sayt va audit jurnalida aks etdi.");
 }catch(e){notify("Post moderatsiya qilinmadi: "+e.message)}finally{btn.disabled=false}
}
async function loadHero(){
 try{const rows=await api("site_content_blocks?content_key=eq.homepage_hero&select=content_key,content_value,is_public,updated_at"),row=Array.isArray(rows)?rows[0]:null,value=row?.content_value||{image_url:fallbackHero,image_alt:"Yoshlar-Ishi bosh sahifa banneri",enabled:true};$("heroImageUrl").value=value.image_url||fallbackHero;$("heroImageAlt").value=value.image_alt||"Yoshlar-Ishi asosiy banneri";$("heroEnabled").checked=value.enabled!==false;heroPreview($("heroImageUrl").value);$("heroContentState").textContent=row?"Bazadan yuklandi":"Asl banner";$("heroContentState").className="statuspill";return true}
 catch(e){$("heroContentState").textContent="Xato";$("heroContentState").className="statuspill error";tell("heroContentNotice","CMS kontent yuklanmadi: "+e.message,true);return false}
}
function heroPreview(value){const el=$("heroAdminPreview");el.innerHTML=value&&B.safeHttpsUrl(value)?'<img src="'+esc(value)+'" alt="Banner oldindan ko‘rinishi">':'<span>Hozircha rasm URL kiritilmagan</span>'}
async function saveHero(event){
 event.preventDefault();const btn=event.currentTarget.querySelector('button[type="submit"]');btn.disabled=true;
 try{
  const image_url=$("heroImageUrl").value.trim(),image_alt=$("heroImageAlt").value.trim(),enabled=$("heroEnabled").checked;
  if(!B.safeHttpsUrl(image_url)||!image_alt)throw Error("Yaroqli HTTPS URL va rasm tavsifi kerak.");
  const content_value={image_url,image_alt,enabled};let rows=await api("site_content_blocks?content_key=eq.homepage_hero",{method:"PATCH",headers:{"Prefer":"return=representation"},body:JSON.stringify({content_value,is_public:true,updated_by:B.user?.id||null,updated_at:new Date().toISOString()})});
  if(!Array.isArray(rows)||!rows.length)rows=await api("site_content_blocks",{method:"POST",headers:{"Prefer":"return=representation"},body:JSON.stringify({content_key:"homepage_hero",content_value,is_public:true,updated_by:B.user?.id||null})});
  if(!Array.isArray(rows)||!rows.length)throw Error("CMS yozuvi saqlanmadi.");
  await audit("settings_update","system","homepage_hero","Bosh sahifa banner sozlamasi yangilandi.",{enabled});
  $("heroContentState").textContent="Saqlangan";tell("heroContentNotice","Banner Supabase CMS’ga saqlandi. Bosh sahifa keyingi yuklanishda yangi tasvirni oladi.");notify("Bosh sahifa banner sozlamasi saqlandi.");
 }catch(e){tell("heroContentNotice","Saqlash xatosi: "+e.message,true)}finally{btn.disabled=false}
}
async function storageFetch(path,options={}){
 const response=await B.storageFetch(path,options),raw=await response.text();let data=null;try{data=raw?JSON.parse(raw):null}catch{data=raw}
 if(!response.ok)throw Error(data?.message||data?.error||("Storage xatosi "+response.status));return data;
}
function assetUrl(path){const cfg=window.YI_CONFIG||{},base=String(cfg.supabaseUrl||"").replace(/\/$/,"");return base+"/storage/v1/object/public/admin-public-assets/"+path.split("/").map(encodeURIComponent).join("/")}
async function loadAssets(){
 $("publicAssetsBody").innerHTML='<tr><td colspan="5" class="empty">Media ro‘yxati yuklanmoqda…</td></tr>';
 try{
  const rows=await storageFetch("/storage/v1/object/list/admin-public-assets",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prefix:"public/",limit:100,offset:0,sortBy:{column:"created_at",order:"desc"}})});
  assets=(Array.isArray(rows)?rows:[]).filter(x=>x&&x.id!==null&&x.name).map(x=>({...x,path:"public/"+x.name}));renderAssets();return true;
 }catch(e){$("publicAssetsBody").innerHTML='<tr><td colspan="5" class="empty">Storage fayllari yuklanmadi: '+esc(e.message)+'</td></tr>';$("assetLibraryMeta").textContent=e.message;return false}
}
function renderAssets(){
 $("assetCount").textContent=assets.length+" fayl";$("assetLibraryMeta").textContent="Supabase Storage · public/ · 100 tagacha oxirgi fayl";
 $("publicAssetsBody").innerHTML=assets.length?assets.map(x=>{const href=assetUrl(x.path),img=/^image\//.test(x.metadata?.mimetype||"");return '<tr data-path="'+esc(x.path)+'"><td><div class="admin-asset-name">'+(img?'<img src="'+esc(href)+'" alt="" loading="lazy">':'<span class="admin-file-icon">PDF</span>')+'<strong>'+esc(x.name)+'</strong></div></td><td>'+esc(x.metadata?.mimetype||"—")+'<span class="sub">'+bytes(x.metadata?.size)+'</span></td><td>'+esc(date(x.created_at))+'</td><td><a class="admin-asset-url" href="'+esc(href)+'" target="_blank" rel="noopener noreferrer">Ochish ↗</a></td><td><div class="admin-action-row"><button class="savebtn js-asset-copy" type="button">URL nusxalash</button>'+(img?'<button class="savebtn js-asset-hero" type="button">Bannerga qo‘yish</button>':'')+'<button class="savebtn js-asset-delete" type="button">O‘chirish</button></div></td></tr>'}).join(""):'<tr><td colspan="5" class="empty">Kutubxonada fayl yo‘q. Yuqoridan fayl yuklang.</td></tr>';
}
async function uploadAsset(){
 const file=$("adminAssetFile").files?.[0];if(!file){tell("assetUploadNotice","Avval fayl tanlang.",true);return}
 if(!["image/jpeg","image/png","image/webp","application/pdf"].includes(file.type)){tell("assetUploadNotice","Faqat JPEG, PNG, WebP yoki PDF qabul qilinadi.",true);return}
 if(file.size>10*1024*1024){tell("assetUploadNotice","Fayl hajmi 10 MB dan oshmasligi kerak.",true);return}
 const btn=$("adminAssetUpload");btn.disabled=true;tell("assetUploadNotice","Supabase Storage’ga yuklanmoqda…");
 try{
  const label=$("adminAssetLabel").value.trim().toLowerCase().replace(/[^a-z0-9-]+/g,"-").replace(/^-+|-+$/g,""),extension=(file.name.split(".").pop()||"file").toLowerCase().replace(/[^a-z0-9]/g,"").slice(0,8)||"file",base=label||file.name.replace(/\.[^.]+$/,"").toLowerCase().replace(/[^a-z0-9-]+/g,"-").replace(/^-+|-+$/g,"").slice(0,70)||"asset",path="public/"+base+"-"+crypto.randomUUID().slice(0,8)+"."+extension;
  await storageFetch("/storage/v1/object/admin-public-assets/"+path.split("/").map(encodeURIComponent).join("/"),{method:"POST",headers:{"Content-Type":file.type,"cache-control":"3600","x-upsert":"false"},body:file});
  const recorded=await audit("asset_upload","asset",path,"Yangi ommaviy fayl yuklandi.",{mime_type:file.type,size:file.size});
  $("adminAssetFile").value="";$("adminAssetLabel").value="";await loadAssets();tell("assetUploadNotice","Yuklandi: "+path+(recorded?"":" Audit qaydi yozilmadi."));notify("Fayl Supabase Storage’ga muvaffaqiyatli yuklandi.");
 }catch(e){tell("assetUploadNotice","Yuklash xatosi: "+e.message,true)}finally{btn.disabled=false}
}
async function deleteAsset(btn){
 const path=btn.closest("tr")?.dataset.path;if(!path||!confirm("Ushbu faylni o‘chirasizmi? Saytda ishlatilayotgan joylari ham buzilishi mumkin."))return;btn.disabled=true;
 try{await storageFetch("/storage/v1/object/admin-public-assets",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({prefixes:[path]})});await audit("asset_delete","asset",path,"Ommaviy media fayl o‘chirildi.");await loadAssets();notify("Fayl o‘chirildi.")}catch(e){notify("Fayl o‘chirilmadi: "+e.message)}finally{btn.disabled=false}
}
async function setHeroFromAsset(path){
 $("heroImageUrl").value=assetUrl(path);$("heroImageAlt").value=$("heroImageAlt").value||"Yoshlar-Ishi bosh sahifa banneri";heroPreview($("heroImageUrl").value);
 await saveHero({preventDefault(){},currentTarget:$("heroContentForm")});
}
function cell(v){let s=typeof v==="string"?v:JSON.stringify(v??"");if(/^[=+@\-]/.test(s))s="'"+s;return '"'+String(s).replace(/"/g,'""')+'"'}
function download(name,body,type){const blob=new Blob(["\uFEFF",body],{type}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1200)}
async function createReport(event){
 event.preventDefault();const btn=$("reportGenerateBtn");btn.disabled=true;report=null;$("reportJsonExport").disabled=true;$("reportCsvExport").disabled=true;$("reportState").textContent="Shakllantirilmoqda";
 try{
  const from=$("reportFrom").value||null,to=$("reportTo").value||null,sensitive=$("reportSensitive").checked,confirmed=$("reportSensitiveConfirm").checked,limit=Number($("reportLimit").value);
  if(from&&to&&from>to)throw Error("Boshlanish sanasi tugash sanasidan keyin bo‘lishi mumkin emas.");if(sensitive&&!confirmed)throw Error("Shaxsiy maydonlarni chiqarish uchun alohida vakolat tasdig‘i kerak.");
  report=await api("rpc/admin_build_report",{method:"POST",body:JSON.stringify({p_from:from,p_to:to,p_include_sensitive:sensitive,p_limit:limit})});
  if(!report||typeof report!=="object"||!report.generated_at)throw Error("Hisobot formati kutilganidek qaytmadi.");
  const names={initiatives:"Tashabbuslar",partner_requests:"Hamkorliklar",opportunity_sources:"Imkoniyat manbalari",youth_programs:"Yoshlar dasturlari",official_portals:"Rasmiy portallar",team_posts:"Jamoa e’lonlari",admin_events:"Admin amallari"},keys=Object.keys(names);
  $("reportSectionCounts").innerHTML=keys.map(k=>'<div class="admin-report-count"><span>'+names[k]+'</span><strong>'+((report[k]||[]).length)+'</strong><small>ta yozuv</small></div>').join("")+'<div class="admin-report-count"><span>Hamjamiyat profillari</span><strong>'+Number(report.community_summary?.profiles||0)+'</strong><small>jami profil</small></div>';
  $("reportGeneratedAt").textContent="Yaratildi: "+date(report.generated_at)+" · "+(sensitive?"Shaxsiy maydonlar kiritilgan":"Shaxsiy maydonlar yashirilgan");$("reportState").textContent="Tayyor";$("reportJsonExport").disabled=false;$("reportCsvExport").disabled=false;
  await audit("report_export","report","admin_report","Davr bo‘yicha admin hisoboti shakllantirildi.",{from,to,sensitive,limit});
  tell("reportNotice",sensitive?"Hisobot tayyor. Unda shaxsiy maydonlar mavjud — faylni xavfsiz saqlang.":"Hisobot tayyor. Shaxsiy va aloqa ma’lumotlari chiqarib tashlangan.");
 }catch(e){report=null;$("reportState").textContent="Xato";tell("reportNotice","Hisobot olinmadi: "+e.message,true)}finally{btn.disabled=false}
}
function exportReport(kind){
 if(!report)return;const stamp=new Date().toISOString().slice(0,10);
 if(kind==="json"){download("yoshlar-ishi-hisobot-"+stamp+".json",JSON.stringify(report,null,2),"application/json;charset=utf-8");return}
 const names=["initiatives","partner_requests","opportunity_sources","youth_programs","official_portals","team_posts","admin_events"],rows=[];for(const section of names)for(const r of report[section]||[])rows.push({section,...r});
 const columns=Array.from(new Set(rows.flatMap(r=>Object.keys(r)).filter(k=>k!=="section")));
 const csv=["bo‘lim,"+columns.map(cell).join(","),...rows.map(r=>[cell(r.section),...columns.map(k=>cell(r[k]))].join(","))].join("\r\n");
 download("yoshlar-ishi-hisobot-"+stamp+".csv",csv,"text/csv;charset=utf-8");
}
function route(page){
 if(page==="control-center")loadSummary();if(page==="members")loadMembers();if(page==="community")loadCommunity();if(page==="content"){loadHero();loadAssets()}
}
function init(){
 if(initialized)return;initialized=true;
 $("controlRefresh").addEventListener("click",loadSummary);$("controlSummaryGrid").addEventListener("click",e=>{const item=e.target.closest("[data-goto]");if(item)B.setPage(item.dataset.goto)});
 $("membersRefresh").addEventListener("click",loadMembers);$("memberSearch").addEventListener("input",renderMembers);$("memberVisibilityFilter").addEventListener("change",renderMembers);
 $("membersBody").addEventListener("click",e=>{const btn=e.target.closest(".js-msave");if(btn)saveMember(btn)});
 $("communityRefresh").addEventListener("click",loadCommunity);$("communitySearch").addEventListener("input",renderCommunity);$("communityStatusFilter").addEventListener("change",renderCommunity);
 $("communityPostsBody").addEventListener("click",e=>{const btn=e.target.closest(".js-csave");if(btn)saveCommunity(btn)});
 $("contentRefresh").addEventListener("click",()=>{loadHero();loadAssets()});$("heroImageUrl").addEventListener("input",()=>heroPreview($("heroImageUrl").value));$("heroContentForm").addEventListener("submit",saveHero);
 $("heroUseDefault").addEventListener("click",()=>{$("heroImageUrl").value=fallbackHero;$("heroImageAlt").value="O‘zbekiston bayrog‘i oldida kostyum kiygan uch nafar yigit. Yoshlar-Ishi banneri.";$("heroEnabled").checked=true;heroPreview(fallbackHero)});
 $("adminAssetUpload").addEventListener("click",uploadAsset);$("publicAssetsBody").addEventListener("click",e=>{const row=e.target.closest("tr");if(!row)return;const copy=e.target.closest(".js-asset-copy"),hero=e.target.closest(".js-asset-hero"),del=e.target.closest(".js-asset-delete");if(copy){const href=assetUrl(row.dataset.path);navigator.clipboard?.writeText(href).then(()=>notify("Ommaviy fayl URL nusxalandi."),()=>notify("URL nusxalash muvaffaqiyatsiz."))}if(hero)setHeroFromAsset(row.dataset.path);if(del)deleteAsset(del)});
 $("adminReportForm").addEventListener("submit",createReport);$("reportSensitive").addEventListener("change",()=>{const on=$("reportSensitive").checked;$("reportSensitiveConfirm").disabled=!on;if(!on)$("reportSensitiveConfirm").checked=false;tell("reportNotice",on?"Shaxsiy maydonlarni chiqarish alohida tasdiqni talab qiladi.":"Shaxsiy maydonlar sukut bo‘yicha yashirilgan.")});$("reportSensitiveConfirm").disabled=true;
 $("reportJsonExport").addEventListener("click",()=>exportReport("json"));$("reportCsvExport").addEventListener("click",()=>exportReport("csv"));
 route(location.hash.slice(1)||"overview");
}
window.YIAdminExtensionInit=init;window.YIAdminPageChanged=route;
if(!$("appView")?.classList.contains("hidden"))init();
})();