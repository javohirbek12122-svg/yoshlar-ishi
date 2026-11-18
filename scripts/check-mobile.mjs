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
const widths=[320,360,390,430,768,1024,1440];
const failures=[],localFailures=[];
const fail=(label,message)=>failures.push(label+": "+message);
let browser;
try{
 browser=await chromium.launch({headless:true,args:["--no-sandbox","--disable-dev-shm-usage","--enable-webgl","--use-gl=swiftshader"]});
 for(const width of widths){
  const context=await browser.newContext({viewport:{width,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true,reducedMotion:"reduce"});
  for(const item of pages){
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
    await page.waitForTimeout(100);
    const m=await page.evaluate(()=>{
     const w=innerWidth,root=document.documentElement,body=document.body;
     const controls=Array.from(document.querySelectorAll('button,.btn,.button,input:not([type=hidden]):not([type=checkbox]):not([type=radio]),select,textarea,summary,.navlinks a'))
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
     await page.locator('[data-auth-mode="login"]').click();
     if(!(await page.locator("#hpNameField").isHidden()))fail(item[1]+" "+width,"login mode retained registration-only fields");
     if(await page.locator("#hpForgotPassword").isHidden())fail(item[1]+" "+width,"password reset action is not visible");
     if(await page.locator("#hpRecoveryForm").isVisible())fail(item[1]+" "+width,"password recovery form is visible without a verified recovery session");
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
     if(!(await page.locator(".yi-assessment-partner").innerText()).includes("hozir yakunlangan testlar"))fail(item[1]+" "+width,"partner notice does not explain that completed test results will also be considered");
     if(await page.locator("#yiAuthGate a.button").count()!==2)fail(item[1]+" "+width,"assessment sign-in and registration links are missing");
    }
    if(item[0]==="/index.html"&&width<=700){
     const banner=page.locator(".yi-hero-banner");
     if(await banner.count()!==1)fail(item[1]+" "+width,"the original homepage banner is missing or duplicated");
     else{
      await banner.waitFor({state:"visible",timeout:5000});
      const dimensions=await banner.evaluate(el=>{const box=el.getBoundingClientRect(),style=getComputedStyle(el);return {naturalWidth:el.naturalWidth,naturalHeight:el.naturalHeight,boxRatio:box.width/Math.max(1,box.height),objectFit:style.objectFit};});
      if(dimensions.naturalWidth<10||dimensions.naturalHeight<10||dimensions.objectFit!=="contain"||Math.abs(dimensions.boxRatio-16/9)>.03)fail(item[1]+" "+width,"the original banner was not loaded and preserved inside the responsive 16:9 frame");
      await page.locator(".yi-hero-image-button").click();
      const heroModal=page.locator("#yiHeroImageModal");
      if(await heroModal.getAttribute("aria-hidden")!=="false"||!(await heroModal.isVisible()))fail(item[1]+" "+width,"tap-to-expand image viewer did not open accessibly");
      if(!(await page.locator(".yi-hero-modal-close").evaluate(el=>el===document.activeElement)))fail(item[1]+" "+width,"image viewer did not move keyboard focus to its close control");
      await page.locator(".yi-hero-modal-close").click();
      if(await heroModal.getAttribute("aria-hidden")!=="true")fail(item[1]+" "+width,"image viewer close control did not restore hidden state");
      await page.locator(".yi-hero-image-button").click();
      await page.keyboard.press("Escape");
      if(await heroModal.getAttribute("aria-hidden")!=="true")fail(item[1]+" "+width,"Escape did not close the expanded banner viewer");
     }
     const toggle=page.locator("#yiDrawerToggle"),drawer=page.locator("#yiSideDrawer"),close=page.locator("#yiDrawerClose");
     if(await toggle.count()!==1)fail(item[1]+" "+width,"three-line drawer trigger is missing");
     else{
      await toggle.click();
      await page.waitForFunction(()=>document.querySelector("#yiSideDrawer")?.getAttribute("aria-hidden")==="false",{},{timeout:4000}).catch(()=>fail(item[1]+" "+width,"side drawer did not open"));
      if(await toggle.getAttribute("aria-expanded")!=="true")fail(item[1]+" "+width,"drawer trigger did not update aria-expanded");
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
          urls.some(url=>url.includes("2cbf2330eea2f444c4bf454a6b8f69e6"));
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
  console.log("✓ "+(pages.length*widths.length)+" page/viewport cases passed ("+pages.length+" pages × "+widths.length+" widths) on "+(remoteBase?"production: "+origin:"local source"));
  console.log("✓ no horizontal overflow, uncaught JavaScript errors or broken local assets");
  console.log("✓ touch targets, iOS input zoom, mobile menu and key filters checked");
  console.log("✓ Android install prompt, iPhone Safari instructions, offline home page and private-page cache exclusion checked");
 }
}finally{if(browser)await browser.close();if(server)await new Promise(resolve=>server.close(resolve))}
