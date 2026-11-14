import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";

const root=process.cwd();
const types={".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",".js":"text/javascript; charset=utf-8",".json":"application/json; charset=utf-8",".webmanifest":"application/manifest+json",".svg":"image/svg+xml",".png":"image/png",".jpg":"image/jpeg",".webp":"image/webp"};
const remoteBase=(process.env.MOBILE_BASE_URL||"").trim().replace(/\/+$/,"");
const server=remoteBase?null:http.createServer((req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url||"/","http://127.0.0.1").pathname);
  const rel=pathname==="/"?"index.html":pathname.replace(/^\/+/,"");
  const target=path.resolve(root,rel);
  if(target!==root&&!target.startsWith(root+path.sep)){res.writeHead(403).end();return}
  let file=target;
  if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,"index.html");
  if(!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end("Not found");return}
  res.writeHead(200,{"Content-Type":types[path.extname(file)]||"application/octet-stream","Cache-Control":"no-store"});
  fs.createReadStream(file).pipe(res);
 }catch{res.writeHead(400).end()}
});
if(server)await new Promise((resolve,reject)=>{server.once("error",reject);server.listen(0,"127.0.0.1",resolve)});
const addr=server?.address();
assert.ok(remoteBase||(addr&&typeof addr==="object"),"Mobile test server did not start");
const origin=remoteBase||("http://127.0.0.1:"+addr.port);
const pages=[
 ["/index.html","Bosh sahifa"],
 ["/imkoniyatlar.html","Imkoniyatlar"],
 ["/davlat-xizmatlari.html","Davlat xizmatlari"],
 ["/kabinet.html","Shaxsiy kabinet"],
 ["/admin.html","Admin panel"],
 ["/startap-yoli.html","Startap yo‘li"],
 ["/laboratoriya.html","Virtual laboratoriya"],
 ["/privacy.html","Maxfiylik"],
 ["/physics-lab/","Physics Lab"]
];
const widths=[320,360,390,430,768];
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
     if(c.h<43)fail(item[1]+" "+width,"touch target "+c.h+"px: "+c.tag+" "+c.text);
     if(width<=900&&["input","select","textarea"].includes(c.tag)&&!["checkbox","radio","hidden"].includes(c.type)&&parseFloat(c.font)<16)fail(item[1]+" "+width,"iOS input zoom risk "+c.font+"px: "+c.text);
    }
    if(errors.length)fail(item[1]+" "+width,"uncaught JS: "+errors.join(" | "));
    if(item[0]==="/index.html"&&width<=700){
     const menu=page.locator(".mobile-nav>summary");
     if(await menu.count()){await menu.first().click();if(!(await page.locator(".mobile-nav").first().evaluate(e=>e.open)))fail(item[1]+" "+width,"mobile menu did not open")}
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
 for(const e of localFailures)fail("Local asset",e);
 if(failures.length){console.error("MOBILE CHECK FAILED");for(const f of failures)console.error("- "+f);process.exitCode=1}
 else{
  console.log("✓ "+(pages.length*widths.length)+" page/viewport cases passed (9 pages × 5 widths) on "+(remoteBase?"production: "+origin:"local source"));
  console.log("✓ no horizontal overflow, uncaught JavaScript errors or broken local assets");
  console.log("✓ touch targets, iOS input zoom, mobile menu and key filters checked");
 }
}finally{if(browser)await browser.close();if(server)await new Promise(resolve=>server.close(resolve))}
