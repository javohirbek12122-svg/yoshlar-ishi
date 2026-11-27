import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";

const root=process.cwd();
const types={".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",".js":"text/javascript; charset=utf-8",".json":"application/json; charset=utf-8",".webmanifest":"application/manifest+json",".svg":"image/svg+xml",".png":"image/png",".jpg":"image/jpeg",".webp":"image/webp"};
const remoteBase=(process.env.MOBILE_BASE_URL||"").trim().replace(/\/+$/,"");
const serviceWorkerResponse=remoteBase?await fetch(remoteBase+"/service-worker.js"):null;
if(serviceWorkerResponse&&!serviceWorkerResponse.ok)throw new Error("Could not read the production service worker: HTTP "+serviceWorkerResponse.status);
const serviceWorkerSource=serviceWorkerResponse?await serviceWorkerResponse.text():fs.readFileSync(path.join(root,"service-worker.js"),"utf8");
const pwaCacheName=serviceWorkerSource.match(/const\s+CACHE_NAME\s*=\s*["']([^"']+)["']/)?.[1];
assert.ok(pwaCacheName,"Could not detect the active PWA cache name from service-worker.js");
const server=remoteBase?null:http.createServer((req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url||"/","http://127.0.0.1").pathname);
  const rel=pathname==="/"?"index.html":pathname.replace(/^\/+/,"");
  const target=path.resolve(root,rel);
  if(target!==root&&!target.startsWith(root+path.sep)){res.writeHead(403).end();return}
  let file=target;
  if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,"index.html");
  if(!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end("Not found");return}
  res.writeHead(200,{"Content-Type":types[path.extname(file)]||"application/octet-stream","Cache-Control":rel==="service-worker.js"?"no-cache, no-store, must-revalidate":"no-cache"});
  fs.createReadStream(file).pipe(res);
 }catch{res.writeHead(400).end()}
});
if(server)await new Promise((resolve,reject)=>{server.once("error",reject);server.listen(0,"127.0.0.1",resolve)});
const addr=server?.address();
assert.ok(remoteBase||(addr&&typeof addr==="object"),"Mobile test server did not start");
const origin=remoteBase||("http://127.0.0.1:"+addr.port);
const pages=[
 ["/index.html","Bosh sahifa"],
 ["/assessment.html","Bilim sinovlari"],
 ["/imkoniyatlar.html","Imkoniyatlar"],
 ["/davlat-xizmatlari.html","Davlat xizmatlari"],
 ["/kabinet.html","Shaxsiy kabinet"],
 ["/hamjamiyat.html","Hamjamiyat"],
 ["/admin.html","Admin panel"],
 ["/startap-yoli.html","Startap yo‘li"],
 ["/laboratoriya.html","Virtual laboratoriya"],
 ["/privacy.html","Maxfiylik"],
 ["/physics-lab/","Physics Lab"],
 ["/biletlar.html","50 ta bilet katalogi"],
 ["/biletlar/001.html","Bilet 001 — test"],
 ["/biletlar/025.html","Bilet 025 — rasm va nisbat"],
 ["/biletlar/027.html","Bilet 027 — savdo savati"],
 ["/biletlar/035.html","Bilet 035 — taymerlar"],
 ["/biletlar/044.html","Bilet 044 — CSV jadvali"],
 ["/biletlar/048.html","Bilet 048 — navbat band qilish"],
 ["/biletlar/049.html","Bilet 049 — xotira o‘yini"],
 ["/biletlar/050.html","Bilet 050 — krossvord"]
];
function collectHtmlRoutes(directory,prefix=""){
 const found=[];
 for(const entry of fs.readdirSync(directory,{withFileTypes:true})){
  if(["node_modules",".git",".vercel"].includes(entry.name))continue;
  const relative=prefix?path.posix.join(prefix,entry.name):entry.name;
  const absolute=path.join(directory,entry.name);
  if(entry.isDirectory())found.push(...collectHtmlRoutes(absolute,relative));
  else if(entry.isFile()&&entry.name.toLowerCase().endsWith(".html")){
   const route="/"+relative;
   found.push([route,relative.replace(/\.html$/i,"").replace(/\//g," · ")||"Bosh sahifa"]);
  }
 }
 return found;
}
const routeMap=new Map([...pages,...collectHtmlRoutes(root)].map(item=>[item[0],item]));
const allHtmlPages=[...routeMap.values()];
const widths=[320,360,390,430,680,700,720,760,768,900,1024,1080,1280,1440];
const failures=[],localFailures=[];
let completedPageViewports=0;
const fail=(label,message)=>failures.push(label+": "+message);
let browser;
try{
 browser=await chromium.launch({headless:true,args:["--no-sandbox","--disable-dev-shm-usage","--enable-webgl","--use-gl=swiftshader"]});
 for(const width of widths){
  const context=await browser.newContext({viewport:{width,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true,reducedMotion:"reduce"});
  const pagesForWidth=(width===390||width===1440)?allHtmlPages:pages;
  for(const item of pagesForWidth){
   const page=await context.newPage(),errors=[];
   page.on("pageerror",e=>errors.push(e.message));
   page.on("console",m=>{
    if(m.type()!=="error")return;
    const text=m.text();
    if(!/Failed to load resource|net::ERR_|ERR_BLOCKED_BY_CLIENT/i.test(text))errors.push("console.error: "+text);
   });
   page.on("requestfailed",r=>{if(r.url().startsWith(origin))localFailures.push(item[1]+" "+r.url())});
   page.on("response",r=>{if(r.url().startsWith(origin)&&r.status()>=400)localFailures.push(item[1]+" HTTP "+r.status()+" "+r.url())});
   try{
    const response=await page.goto(origin+item[0],{waitUntil:"domcontentloaded",timeout:25000});
    assert.ok(response&&response.ok(),"Page did not load successfully");
    completedPageViewports++;
    await page.waitForTimeout(100);
    const siteBackground=await page.evaluate(()=>{
     const style=getComputedStyle(document.body,"::before");
     return{content:style.content,image:style.backgroundImage,opacity:parseFloat(style.opacity),size:style.backgroundSize,isolation:getComputedStyle(document.body).isolation};
    });
    if(!siteBackground.image.includes("uzbekistan-flag.svg"))fail(item[1]+" "+width,"the Uzbekistan flag image is missing from the visible background layer");
    if(siteBackground.content==="none"||siteBackground.opacity<.99)fail(item[1]+" "+width,"the flag background layer is hidden or faded before the intended overlay");
    if(siteBackground.isolation!=="isolate")fail(item[1]+" "+width,"the flag background layer is not isolated behind page content");
    if(width<=760&&!siteBackground.size.includes(width+"px"))fail(item[1]+" "+width,"the complete flag is not scaled to fit the mobile screen width");
    if(item[0]==="/index.html"&&width===390){
     const imageLoaded=await page.evaluate(async()=>{
      const image=new Image();image.src="/assets/uzbekistan-flag.svg";
      try{await image.decode();return image.naturalWidth===1000&&image.naturalHeight===500}catch{return false}
     });
     if(!imageLoaded)fail(item[1]+" "+width,"the local Uzbekistan flag image did not decode at its 2:1 native dimensions");
    }

     if(width<=760&&item[0]!=="/admin.html"&&item[0]!=="/offline.html"){
      await page.waitForFunction(()=>document.querySelectorAll("#yi-mobile-dock a").length===5,{},{timeout:5000}).catch(()=>fail(item[1]+" "+width,"five-item mobile navigation did not initialize"));
      const dock=page.locator("#yi-mobile-dock");
      if(await dock.count()!==1)fail(item[1]+" "+width,"mobile navigation shell is missing or duplicated");
      const dockLayout=await page.evaluate(()=>{
       const dock=document.querySelector("#yi-mobile-dock"),r=dock?.getBoundingClientRect(),style=dock?getComputedStyle(dock):null;
       const active=document.activeElement;
       const editable=Boolean(active&&active.matches("input:not([type=checkbox]):not([type=radio]):not([type=button]):not([type=submit]),textarea,select,[contenteditable='true']"));
       const viewport=window.visualViewport;
       const keyboardDelta=viewport?window.innerHeight-viewport.height:0;
       const keyboardOpen=document.documentElement.classList.contains("yi-keyboard-open");
       const overlayOpen=document.documentElement.classList.contains("yi-mobile-overlay-open");
       const hidden=Boolean(!dock||dock.hidden||style.display==="none"||style.visibility==="hidden"||Number(style.opacity)<0.05||style.pointerEvents==="none");
       return{enabled:document.body.classList.contains("yi-mobile-enabled"),position:style?.position||"",left:r?.left??-1,right:r?.right??-1,bottom:r?.bottom??Infinity,padding:parseFloat(getComputedStyle(document.body).paddingBottom)||0,hidden,keyboardOpen,overlayOpen,editable,keyboardDelta};
      });
      if(!dockLayout.enabled)fail(item[1]+" "+width,"mobile app-shell state was not enabled");
      if(dockLayout.position!=="fixed")fail(item[1]+" "+width,"mobile navigation must remain fixed to the viewport");
      if(dockLayout.left<0||dockLayout.right>width+1)fail(item[1]+" "+width,"mobile navigation is clipped horizontally");
      if(dockLayout.bottom>844+1)fail(item[1]+" "+width,"mobile navigation extends below the viewport");
      if(dockLayout.keyboardOpen&&(!dockLayout.editable||dockLayout.keyboardDelta<=140))fail(item[1]+" "+width,"keyboard state was enabled without a focused editable control and a reduced visual viewport");
      if(dockLayout.keyboardOpen&&!dockLayout.hidden)fail(item[1]+" "+width,"mobile navigation must be hidden while the software keyboard is open");
      if(dockLayout.overlayOpen&&!dockLayout.hidden)fail(item[1]+" "+width,"mobile navigation must be hidden while a modal or drawer is open");
      if(dockLayout.hidden&&!dockLayout.keyboardOpen&&!dockLayout.overlayOpen)fail(item[1]+" "+width,"mobile navigation is hidden without an open keyboard or modal");
      if(!dockLayout.hidden&&dockLayout.padding<50)fail(item[1]+" "+width,"page content is not reserved above the visible mobile navigation (padding="+dockLayout.padding+"px)");
      if(!dockLayout.hidden){
       const items=await dock.locator("a").evaluateAll(els=>els.map(el=>({label:el.innerText.trim(),h:el.getBoundingClientRect().height,href:el.getAttribute("href")})));
       if(items.length!==5)fail(item[1]+" "+width,"mobile navigation must expose five destinations");
       for(const entry of items)if(entry.h<44)fail(item[1]+" "+width,"mobile navigation target below 44px: "+entry.label);
       if(!items.some(entry=>entry.href==="/hamjamiyat.html?tab=feed"))fail(item[1]+" "+width,"direct community route is missing");
      }
     }
     const m=await page.evaluate(()=>{
     const w=innerWidth,root=document.documentElement,body=document.body;
     const controls=Array.from(document.querySelectorAll('button,.btn,.button,input:not([type=hidden]):not([type=checkbox]):not([type=radio]),select,textarea,summary,.navlinks a,.yi-mobile-dock a'))
      .filter(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.display!=="none"&&s.visibility!=="hidden"})
      .map(e=>({tag:e.tagName.toLowerCase(),text:(e.innerText||e.getAttribute("aria-label")||e.getAttribute("placeholder")||"").trim().slice(0,36),h:Math.round(e.getBoundingClientRect().height),font:getComputedStyle(e).fontSize,type:e.getAttribute("type")||""}));
     return {w,root:root.clientWidth,rootScroll:root.scrollWidth,bodyScroll:body.scrollWidth,meta:document.querySelector('meta[name=viewport]')?.content||"",controls};
    });
    if(!m.meta.includes("width=device-width"))fail(item[1]+" "+width,"viewport meta missing");
    if(m.root>width+1||m.rootScroll>width+1||m.bodyScroll>width+1)fail(item[1]+" "+width,"horizontal overflow root="+m.root+" scroll="+m.rootScroll+" body="+m.bodyScroll);
    for(const c of m.controls){
     if(width<=900&&c.h<43)fail(item[1]+" "+width,"touch target "+c.h+"px: "+c.tag+" "+c.text);
     if(width<=900&&["input","select","textarea"].includes(c.tag)&&!["checkbox","radio","hidden"].includes(c.type)&&parseFloat(c.font)<16)fail(item[1]+" "+width,"iOS input zoom risk "+c.font+"px: "+c.text);
    }
    if(errors.length)fail(item[1]+" "+width,"uncaught JS: "+errors.join(" | "));
    if(item[0]==="/hamjamiyat.html"&&width===390){
     if(await page.locator("#hpAuthGate").count()!==1)fail(item[1]+" "+width,"shared login/register gate is missing");
     await page.locator('[data-auth-mode="register"]').click();
     if(await page.locator("#hpNameField").isHidden())fail(item[1]+" "+width,"registration name field did not open");
     if(await page.locator("#hpConfirmField").isHidden())fail(item[1]+" "+width,"confirm-password field did not open");
     if(await page.locator("#hpConsent").isHidden())fail(item[1]+" "+width,"privacy consent was not displayed during registration");
     await page.locator("#hpPassword").fill("abc123");
     if(!(await page.locator("#hpPasswordStrength").innerText()).toLowerCase().includes("kuch"))fail(item[1]+" "+width,"password strength feedback did not update");
     await page.locator("#hpPasswordToggle").click();
     if(await page.locator("#hpPassword").getAttribute("type")!=="text")fail(item[1]+" "+width,"password visibility control did not reveal the password");
     await page.locator("#hpPasswordToggle").click();
     if(await page.locator("#hpPassword").getAttribute("type")!=="password")fail(item[1]+" "+width,"password visibility control did not hide the password");
     await page.locator("#hpName").fill("Test Foydalanuvchi");
     await page.locator("#hpEmail").fill("invalid-email");
     await page.locator("#hpPassword").fill("StrongPass123");
     await page.locator("#hpConfirm").fill("StrongPass123");
     await page.locator("#hpPrivacy").check();
     await page.locator("#hpAuthSubmit").click();
     if(!(await page.locator("#hpAuthMessage").innerText()).includes("Email manzilini to‘g‘ri kiriting"))fail(item[1]+" "+width,"registration did not validate email before contacting Supabase");
     await page.locator("#hpEmail").fill("ui-check@example.invalid");
     await page.locator("#hpConfirm").fill("DifferentPass123");
     await page.locator("#hpAuthSubmit").click();
     if(!(await page.locator("#hpAuthMessage").innerText()).includes("Parollar bir xil emas"))fail(item[1]+" "+width,"registration did not validate matching passwords");
     await page.locator("#hpConfirm").fill("StrongPass123");
     await page.locator("#hpPrivacy").uncheck();
     await page.locator("#hpAuthSubmit").click();
     if(!(await page.locator("#hpAuthMessage").innerText()).includes("rozilik"))fail(item[1]+" "+width,"registration did not require privacy consent");
     await page.locator('[data-auth-mode="login"]').click();
     if(!(await page.locator("#hpNameField").isHidden()))fail(item[1]+" "+width,"login mode retained registration-only fields");
     if(await page.locator("#hpForgotPassword").isHidden())fail(item[1]+" "+width,"password reset action is not visible");
     if(await page.locator("#hpRecoveryForm").isVisible())fail(item[1]+" "+width,"password recovery form is visible without a verified recovery session");
     await page.locator("#hpEmail").fill("invalid-email");
     await page.locator("#hpPassword").fill("wrong-password");
     await page.locator("#hpAuthSubmit").click();
     if(!(await page.locator("#hpAuthMessage").innerText()).includes("Email manzilini to‘g‘ri kiriting"))fail(item[1]+" "+width,"login did not validate email before contacting Supabase");
    }
    if(item[0]==="/kabinet.html"&&width===390){
     if(await page.locator("#authLinks a").count()!==2)fail(item[1]+" "+width,"central login and registration links are missing");
     if(await page.locator("#loginForm").count()!==0)fail(item[1]+" "+width,"a separate legacy OTP login must not remain in the cabinet");
     if(!(await page.locator("#authLinks a").first().getAttribute("href")).includes("./hamjamiyat.html"))fail(item[1]+" "+width,"cabinet must route to the shared account center");
    }
    if(item[0]==="/imkoniyatlar.html"&&width===390){
     if(await page.locator("#authState a").count()!==2)fail(item[1]+" "+width,"opportunity catalogue must link to shared login and registration screens");
     if(!(await page.locator("#authState a").first().getAttribute("href")).includes("./hamjamiyat.html"))fail(item[1]+" "+width,"opportunity auth must route to the shared account center");
    }
    if(item[0]==="/assessment.html"&&width===390){
     if(!(await page.locator(".yi-assessment-hero h1").innerText()).includes("Bilimingizni sinang"))fail(item[1]+" "+width,"assessment hero heading is missing");
     const partnerNotice=(await page.locator(".yi-assessment-partner").innerText()).toLowerCase();
     if(!partnerNotice.includes("faqat platforma ichida")||!partnerNotice.includes("rasmiy imtihon"))fail(item[1]+" "+width,"partner notice must explain that scores are internal and are not an official exam or certificate");
     if(await page.locator("#yiAuthGate a.button").count()!==2)fail(item[1]+" "+width,"assessment sign-in and registration links are missing");
    }
    if(item[0]==="/index.html"&&width>=1280){
     const desktopHero=page.locator("main#top > section.hero");
     const columns=await desktopHero.evaluate(section=>{
      const copy=section.querySelector(".hero-copy").getBoundingClientRect();
      const art=section.querySelector(".art.yi-hero-visual").getBoundingClientRect();
      return{copyRight:copy.right,artLeft:art.left,focusDisplay:getComputedStyle(section.querySelector(".hero-focus")).display};
     });
     if(columns.copyRight>columns.artLeft+8)fail(item[1]+" "+width,"desktop hero must keep copy and original banner in separate columns");
     if(columns.focusDisplay==="none")fail(item[1]+" "+width,"desktop hero must show the three platform directions");
    }
    if(item[0]==="/index.html"&&width<=700){
     const heroPhoto=await page.evaluate(()=>{
      const bg=getComputedStyle(document.querySelector("main#top > section.hero"),"::before").backgroundImage;
      return bg.includes("static.tuit.uz/crop/1/6/1200__95_1622872966.jpg");
     });
     if(!heroPhoto)fail(item[1]+" "+width,"the Registan youth group photo is not applied behind the hero");
     const heroPhotoCredit=page.locator(".yi-hero-photo-credit");
     if(await heroPhotoCredit.count()!==1||!(await heroPhotoCredit.getAttribute("href")).includes("tuit.uz/en/post/"))fail(item[1]+" "+width,"the hero photo source attribution is missing");
     const hero=page.locator("main#top > section.hero");
     if(await hero.count()!==1)fail(item[1]+" "+width,"the current homepage hero section is missing or duplicated");
     else{
      const heading=hero.locator(".hero-copy h1").first();
      if(!(await heading.isVisible()))fail(item[1]+" "+width,"the homepage hero heading is not visible");
      if((await heading.innerText()).trim().length<12)fail(item[1]+" "+width,"the homepage hero heading is incomplete");
      const primaryCta=hero.locator(".hero-copy .actions a.btn").first();
      if(!(await primaryCta.isVisible()))fail(item[1]+" "+width,"the primary opportunity CTA is not visible in the hero");
      const ctaBox=await primaryCta.boundingBox();
      if(!ctaBox||ctaBox.height<43)fail(item[1]+" "+width,"the primary hero CTA is too small for touch");
      if(ctaBox&&ctaBox.x<0)fail(item[1]+" "+width,"the primary hero CTA is clipped off-screen");
      const readability=await page.evaluate(()=>{
       const size=selector=>{const node=document.querySelector(selector);return node?Number.parseFloat(getComputedStyle(node).fontSize):0};
       return{
        cta:size("main#top > section.hero .hero-copy .actions a.btn"),
        note:size("main#top > section.hero .hero-note"),
        focusTitle:size("main#top > section.hero .hero-focus>div>strong"),
        quickTitle:size(".service-ribbon .yi-quick-card .yi-quick-copy strong"),
        quickDescription:size(".service-ribbon .yi-quick-card .yi-quick-copy small"),
        resourceTitle:size(".yi-official-card-copy strong"),
        dockLabel:size("#yi-mobile-dock .yi-dock-label")
       };
      });
      const minimums=[["hero CTA",readability.cta,10],["hero note",readability.note,9],["hero direction title",readability.focusTitle,10],["quick service title",readability.quickTitle,10],["quick service description",readability.quickDescription,9],["official resource title",readability.resourceTitle,9],["mobile navigation label",readability.dockLabel,9]];
      for(const [label,actual,minimum] of minimums){
       if(actual<minimum)fail(item[1]+" "+width,"mobile text is too small for "+label+" ("+actual+"px)");
      }
      const geometry=await hero.evaluate(section=>{
       const box=(selector)=>{const node=section.querySelector(selector);if(!node)return null;const r=node.getBoundingClientRect();return{left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height,display:getComputedStyle(node).display}};
       return{copy:box(".hero-copy"),focus:box(".hero-focus"),cta:box(".hero-copy .actions a.btn"),art:box(".art.yi-hero-visual"),banner:box(".yi-hero-banner"),resources:box(".yi-official-resources")};
      });
      if(!geometry.focus||geometry.focus.display==="none")fail(item[1]+" "+width,"the three platform directions must be visible in the mobile hero");
      if(!geometry.banner||geometry.banner.width<200)fail(item[1]+" "+width,"the original hero banner must remain large enough to read");
      if(geometry.banner&&(geometry.banner.left<0||geometry.banner.right>width+1))fail(item[1]+" "+width,"the hero banner is clipped horizontally");
      if(geometry.copy&&geometry.art&&geometry.copy.bottom>geometry.art.top+3)fail(item[1]+" "+width,"mobile hero order must place copy and CTA before the banner");
      if(geometry.art&&geometry.resources&&geometry.art.bottom>geometry.resources.top+3)fail(item[1]+" "+width,"official resources must follow the hero banner on mobile");

     }
     const quickCards=page.locator(".service-ribbon .yi-quick-card");
      if(await quickCards.count()===8){
       const visibleCards=async()=>quickCards.evaluateAll(els=>els.filter(el=>getComputedStyle(el).display!=="none").length);
       if(await visibleCards()!==4)fail(item[1]+" "+width,"quick services must start in a compact 2×2 grid");
       await page.locator("#yi-services-more").click();
       if(await visibleCards()!==8)fail(item[1]+" "+width,"quick services did not expand");
       await page.locator("#yi-services-more").click();
       if(await visibleCards()!==4)fail(item[1]+" "+width,"quick services did not collapse");
      }
      const toggle=page.locator("#yiDrawerToggle"),drawer=page.locator("#yiSideDrawer"),close=page.locator("#yiDrawerClose");
     if(await toggle.count()!==1)fail(item[1]+" "+width,"three-line drawer trigger is missing");
     else{
      await toggle.click();
      await page.waitForFunction(()=>document.querySelector("#yiSideDrawer")?.getAttribute("aria-hidden")==="false",{},{timeout:4000}).catch(()=>fail(item[1]+" "+width,"side drawer did not open"));
      if(await toggle.getAttribute("aria-expanded")!=="true")fail(item[1]+" "+width,"drawer trigger did not update aria-expanded");
       const dockHidden=await page.locator("#yi-mobile-dock").evaluate(el=>getComputedStyle(el).visibility==="hidden"||getComputedStyle(el).opacity==="0");
       if(!dockHidden)fail(item[1]+" "+width,"mobile dock overlaps the open navigation drawer");
      if(await drawer.locator('a[href="./imkoniyatlar.html"]').count()===0)fail(item[1]+" "+width,"drawer links are missing");
      await page.keyboard.press("Escape");
      await page.waitForFunction(()=>document.querySelector("#yiSideDrawer")?.hidden===true,null,{timeout:4000}).catch(()=>fail(item[1]+" "+width,"Escape did not close the drawer"));
      if(await toggle.getAttribute("aria-expanded")!=="false")fail(item[1]+" "+width,"drawer trigger remained expanded after close");
      await toggle.click();
      await close.click();
      await page.waitForFunction(()=>document.querySelector("#yiSideDrawer")?.hidden===true,null,{timeout:4000}).catch(()=>fail(item[1]+" "+width,"close button did not close the drawer"));
     }
    }
    if(item[0]==="/imkoniyatlar.html"&&width===390){await page.locator("#queryFilter").fill("Yoshlar daftari");await page.locator("#filterButton").click()}
    if(item[0]==="/davlat-xizmatlari.html"&&width===390)await page.locator("#portalSearch").fill("Yoshlar");

    if(item[0]==="/davlat-xizmatlari.html"&&width===390){
     await page.locator("#saGoal").selectOption("education");
     await page.locator("#saAge").selectOption("minor");
     await page.locator("#saStatus").selectOption("technikum");
     await page.locator("#saGeneratePlan").click();
     await page.locator("#saPlanResult .sa-steps li").first().waitFor({state:"visible",timeout:5000});
     if(!(await page.locator("#saPlanResult").innerText()).includes("MyEdu"))fail(item[1]+" "+width,"cross-portal education plan was not generated");
     if(await page.locator("#saChecklist input[type=checkbox]").count()<3)fail(item[1]+" "+width,"document readiness checklist was not generated");
     await page.locator("#saDraftAgency").fill("Tuman hokimligi");
     await page.locator("#saDraftIssue").fill("Xizmat bo‘yicha javob kechikdi.");
     await page.locator("#saDraftRequest").fill("Murojaat holatini o‘rganib, yozma javob berishingizni so‘rayman.");
     await page.locator("#saGenerateDraft").click();
     if(!(await page.locator("#saDraftOutput").inputValue()).includes("Murojaat turi"))fail(item[1]+" "+width,"appeal draft was not generated");
     await page.locator("#saTaskName").fill("Test arizasi");
     await page.locator("#saTaskForm button[type=submit]").click();
     if(await page.locator("#saTaskList .sa-task").count()!==1)fail(item[1]+" "+width,"local application tracker did not save the task");
     await page.locator("#saTaskList .sa-task-delete").click();
     if(await page.locator("#saTaskList .sa-task").count()!==0)fail(item[1]+" "+width,"local application tracker did not remove the task");
    }


    if(item[0]==="/davlat-xizmatlari.html"&&width===390){
     const colors=await page.evaluate(()=>{
      const input=document.querySelector("#saDraftAgency");
      const helper=document.querySelector(".sa-head p");
      const proof=document.querySelector(".sa-proof small");
      return {
       placeholder:getComputedStyle(input,"::placeholder").color,
       helper:getComputedStyle(helper).color,
       proof:getComputedStyle(proof).color
      };
     });
     const rgbToLuminance=color=>{
      const parts=color.match(/[\d.]+/g);
      if(!parts||parts.length<3)throw new Error("Unexpected computed color: "+color);
      const c=parts.slice(0,3).map(v=>Number(v)/255).map(v=>v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4));
      return .2126*c[0]+.7152*c[1]+.0722*c[2];
     };
     const ratio=(fg,bg)=>{const a=rgbToLuminance(fg),b=rgbToLuminance(bg);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05)};
     for(const [name,color,bg] of [["placeholder",colors.placeholder,"rgb(255, 255, 255)"],["helper text",colors.helper,"rgb(241, 245, 248)"],["source note",colors.proof,"rgb(255, 255, 255)"]]){
      if(ratio(color,bg)<4.5)fail(item[1]+" "+width,name+" contrast is below 4.5:1 ("+color+")");
     }
    }

    if(item[0]==="/laboratoriya.html"&&width===390){
     await page.locator('.mode-btn[data-mode="nuclear"]').click();
     await page.locator("#runNuclear").waitFor({state:"visible",timeout:8000});
     await page.locator("#runNuclear").click();
    }
    if(item[0]==="/physics-lab/"&&width===390){
     await page.locator("#viewport canvas").waitFor({state:"visible",timeout:20000});
     const scenes=[
      ["solarSystem","Quyosh tizimi — sayyoralar orbitasi"],
      ["blackHole","Qora tuynuk — akkresiya diski"],
      ["supernova","Supernova — yulduzning yakuniy portlashi"],
      ["volcano","Vulqon otilishi — lava va kul oqimi"],
      ["earthquake","Zilzila — tektonik siljish va seysmik to‘lqinlar"],
      ["tsunami","Tsunami — okeandan qirg‘oqqa"],
      ["tornado","Tornado — aylanma havo ustuni"],
      ["lightning","Chaqmoq — elektr razryadi"],
      ["aurora","Qutb yog‘dusi — magnitosfera va quyosh shamoli"]
     ];
     for(const [key,title] of scenes){
      await page.locator('.mode[data-mode="'+key+'"]').click();
      await page.waitForFunction(expected=>document.querySelector("#title")?.textContent===expected,title,{timeout:7000});
      await page.locator("#eventPanel").waitFor({state:"visible",timeout:5000});
      const phase=await page.locator("#eventPhase").innerText();
      if(!phase.trim())fail("Physics Lab "+key,"scene timeline did not produce a phase label");
     }
     await page.locator("#eventRun").click();
     await page.locator('[data-camera="top"]').click();
     await page.locator('[data-camera="side"]').click();
     await page.locator("#quality").selectOption("mobile");
     await page.locator("#play").click();
     await page.locator("#play").click();
     await page.waitForTimeout(300);
     if(errors.length)fail("Physics Lab 3D events","runtime errors: "+errors.join(" | "));
    }
   }catch(e){fail(item[1]+" "+width,e.message||String(e))}
   finally{await page.close()}
  }
  await context.close();
 }

 try{
  const androidContext=await browser.newContext({
   viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true,
   userAgent:"Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36"
  });
  const androidPage=await androidContext.newPage();
  await androidPage.goto(origin+"/index.html",{waitUntil:"domcontentloaded",timeout:25000});
  await androidPage.locator("#yi-install-banner").waitFor({state:"visible",timeout:8000});
  await androidPage.waitForLoadState("load",{timeout:12000}).catch(()=>{});
  await androidPage.evaluate(async()=>{const registration=await navigator.serviceWorker.ready;if(!registration.active)throw new Error("Service worker is not active");});
  await androidPage.waitForFunction(()=>Boolean(navigator.serviceWorker.controller),null,{timeout:12000});
  await androidPage.reload({waitUntil:"load",timeout:25000});
  const assessmentCacheReady=await androidPage.evaluate(async(cacheName)=>{
   const cache=await caches.open(cacheName);
   const urls=(await cache.keys()).map(request=>request.url);
   return ["assessment.html","assessment.css","assessment-bank.js","assessment.js"].every(asset=>urls.some(url=>url.endsWith("/"+asset)));
  },pwaCacheName);
  if(!assessmentCacheReady)fail("PWA assessment cache","assessment page and its local assets are not all precached");
  const heroCacheReady=await androidPage.waitForFunction(async(cacheName)=>{
   const image=document.querySelector(".yi-hero-banner");
   if(!image||!image.complete||image.naturalWidth<10)return false;
   const cache=await caches.open(cacheName);
   const urls=(await cache.keys()).map(request=>request.url);
   return urls.some(url=>url.includes("d2ol7oe51mr4n9.cloudfront.net/user_3JM13LmKQo41EGZkNQHbTC0mG4m/f0a06878-17e7-4fdb-94e6-0437ce7f174c.jpg")) &&
          urls.some(url=>url.includes("res.cloudinary.com/tourhq/image/upload/v1695112996/znj0avtophmpnvchl4ql")) &&
          urls.some(url=>url.includes("photo6fe378ad750c9351681f39aca9de5c32")) &&
          urls.some(url=>url.includes("2cbf2330eea2f444c4bf454a6b8f69e6")) &&
          urls.some(url=>url.includes("static.tuit.uz/crop/1/6/1200__95_1622872966.jpg"));
  },pwaCacheName,{timeout:20000}).then(()=>true).catch(()=>false);
  if(!heroCacheReady){
   const diagnostics=await androidPage.evaluate(async(cacheName)=>{
    const images=[...document.querySelectorAll(".yi-hero-banner,.yi-agency-logo,.yi-ustoz-logo")].map(el=>({src:el.currentSrc,complete:el.complete,naturalWidth:el.naturalWidth}));
    const cache=await caches.open(cacheName);
    const keys=(await cache.keys()).map(x=>x.url);
    return JSON.stringify({images,keys:keys.filter(x=>/unsplash|uzchess|uzreport|cloudinary|d2ol7oe51mr4n9/.test(x))});
   },pwaCacheName);
   fail("PWA hero/logo images","images were not all cached: "+diagnostics);
  }
  await androidPage.evaluate(()=>{
   const event=new Event("beforeinstallprompt",{cancelable:true});
   Object.defineProperty(event,"prompt",{value:async()=>{window.__yiInstallPromptCalled=true;}});
   Object.defineProperty(event,"userChoice",{value:Promise.resolve({outcome:"accepted"})});
   window.dispatchEvent(event);
  });
  await androidPage.locator("#yi-install-banner button:not(.yi-pwa-close)").click();
  const promptCalled=await androidPage.evaluate(()=>window.__yiInstallPromptCalled===true);
  if(!promptCalled)fail("PWA Android","beforeinstallprompt did not invoke the browser install flow");
  await androidContext.setOffline(true);
  await androidPage.goto(origin+"/index.html",{waitUntil:"domcontentloaded",timeout:15000});
  const cachedHome=await androidPage.locator("body").innerText();
  if(!cachedHome.includes("Yoshlar-Ishi"))fail("PWA offline","cached public home page did not load");
  const offlineHeroWidth=await androidPage.locator(".yi-hero-banner").evaluate(el=>el.naturalWidth).catch(()=>0);
  if(offlineHeroWidth<10)fail("PWA offline images","cached youth foreground photo did not render offline");
  const offlineAgencyLogo=await androidPage.locator(".yi-agency-logo").evaluate(el=>el.naturalWidth).catch(()=>0);
  const offlineUstozLogo=await androidPage.locator(".yi-ustoz-logo").evaluate(el=>el.naturalWidth).catch(()=>0);
  if(offlineAgencyLogo<10||offlineUstozLogo<10)fail("PWA offline official logos","cached agency and Ustoz AI logos did not render offline");
  await androidPage.goto(origin+"/assessment.html",{waitUntil:"domcontentloaded",timeout:15000});
  const offlineAssessment=await androidPage.locator("body").innerText();
  if(!offlineAssessment.includes("Bilimingizni sinang")||!offlineAssessment.includes("SOON"))fail("PWA offline assessment","cached assessment page did not open offline");
  await androidPage.goto(origin+"/kabinet.html",{waitUntil:"domcontentloaded",timeout:15000});
  const privateOffline=await androidPage.locator("body").innerText();
  if(!privateOffline.includes("Hozir internet aloqasi yo‘q"))fail("PWA privacy","personal cabinet was not replaced by the safe offline page");
  await androidContext.close();

  const iosContext=await browser.newContext({
   viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true,
   userAgent:"Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Mobile/15E148 Safari/604.1"
  });
  const iosPage=await iosContext.newPage();
  await iosPage.goto(origin+"/index.html",{waitUntil:"domcontentloaded",timeout:25000});
  await iosPage.locator("#yi-install-banner").waitFor({state:"visible",timeout:8000});
  await iosPage.locator("#yi-install-banner button:not(.yi-pwa-close)").click();
  const iosHelp=await iosPage.locator("#yi-install-help").innerText();
  if(!iosHelp.includes("Safari")||!iosHelp.includes("Add to Home Screen"))fail("PWA iOS","Safari Add to Home Screen instructions are missing");
  await iosContext.close();
 }catch(error){fail("PWA install/offline tests",error.message||String(error))}

 for(const e of localFailures)fail("Local asset",e);
 if(failures.length){console.error("MOBILE CHECK FAILED");for(const f of failures)console.error("- "+f);process.exitCode=1}
 else{
  console.log("✓ "+completedPageViewports+" page/viewport cases passed (core pages across "+widths.length+" widths plus every HTML route at mobile and desktop widths) on "+(remoteBase?"production: "+origin:"local source"));
  console.log("✓ no horizontal overflow, uncaught JavaScript errors or broken local assets");
  console.log("✓ touch targets, iOS input zoom, mobile menu and key filters checked");
  console.log("✓ Android install prompt, iPhone Safari instructions, offline home page and private-page cache exclusion checked");
 }
}finally{if(browser)await browser.close();if(server)await new Promise(resolve=>server.close(resolve))}
