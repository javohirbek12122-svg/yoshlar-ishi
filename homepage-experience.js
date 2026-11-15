(function () {
"use strict";
const GROUPS=[
 {key:"platform",title:"Platforma va imkoniyatlar",description:"Afzalliklar, foydalanuvchi yo‘li va imkoniyatdan keyingi qadamlar.",sections:["afzalliklar","jarayon"]},
 {key:"government",title:"Davlat xizmatlari va rasmiy manbalar",description:"Rasmiy portallar, xizmatlar va amaliy yo‘riqnomalar.",sections:["rasmiy-xizmatlar"]}
];
const NESTED_GROUPS=[
 {key:"idea",title:"AI g‘oya tahlili va imkoniyatlar",description:"G‘oya, moslik mezonlari va amaliy imkoniyatlar.",sections:["imkoniyatlar"]},
 {key:"guides",title:"Yo‘l-yo‘riqlar va qo‘shimcha vositalar",description:"Qo‘shimcha ma’lumotlar, savollar va yo‘riqnomalar.",sections:["imkoniyatlar-yakun"]},
 {key:"community",title:"Jamoa, mentorlar va tashabbuslar",description:"Hamfikrlar, mentorlik va ochiq tashabbuslar.",sections:["jamoadoshlar","top-tashabbuslar"]},
 {key:"submit",title:"Tashabbus yuborish va hamkorlik",description:"Yangi g‘oya taqdim etish, kuzatish va hamkorlik.",sections:["tashabbus","hamkorlik"]}
];
const $=id=>document.getElementById(id);
const normalize=value=>String(value||"").toLocaleLowerCase("uz").replace(/[ʻʼ‘’´\`]/g,"'").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9'\s-]/g," ").replace(/\s+/g," ").trim();
function createAccordion(key,title,description,sections,nested){
 const details=document.createElement("details");details.className=nested?"yi-nested-accordion":"yi-home-accordion";details.id=nested?"yi-nested-"+key:"yi-panel-"+key;
 const summary=document.createElement("summary"),copy=document.createElement("span");copy.className="yi-accordion-copy";
 const strong=document.createElement("strong");strong.textContent=title;const small=document.createElement("small");small.textContent=description;copy.append(strong,small);summary.appendChild(copy);
 if(!nested){const num=document.createElement("span");num.className="yi-accordion-number";num.textContent=key==="platform"?"01":"02";const action=document.createElement("span");action.className="yi-accordion-action";action.textContent="Bo‘limni ochish";const chev=document.createElement("span");chev.className="yi-accordion-chevron";chev.textContent="⌄";chev.setAttribute("aria-hidden","true");summary.prepend(num);summary.append(action,chev);}
 const content=document.createElement("div");content.className=nested?"yi-nested-content":"yi-accordion-content";sections.forEach(id=>{const section=$(id);if(section)content.appendChild(section);});details.append(summary,content);return details;
}
function createHeroPreview(art){
 if(!art||art.querySelector(".yi-hero-scene"))return;
 art.classList.add("yi-hero-visual");art.setAttribute("aria-label","Yoshlar-Ishi uchun oldinga chiqib turgan 3D yoshlar tasviri");
 art.innerHTML=
 '<div class="yi-hero-scene">'+
  '<div class="yi-scene-orbit yi-scene-orbit-one" aria-hidden="true"></div><div class="yi-scene-orbit yi-scene-orbit-two" aria-hidden="true"></div>'+
  '<div class="yi-scene-photo-frame"><img class="yi-scene-people" src="./assets/yoshlar-people.webp" alt="Yoshlar jamoasi: ta’lim, texnologiya va hamkorlik ustida ishlayotgan talabalar" fetchpriority="high" decoding="async"></div>'+
  '<div class="yi-scene-float yi-scene-status"><span class="yi-scene-dot"></span><span>Yoshlar hamjamiyati</span></div>'+
  '<div class="yi-scene-float yi-scene-caption-card"><span class="yi-scene-float-icon">✦</span><span><strong>Yangi imkoniyatlar sari birga!</strong><small>Ta’lim · Ish · Startap · Grant</small></span></div>'+
  '<div class="yi-ai-helper-card"><div class="yi-ai-card-top"><span class="yi-ai-avatar">✧</span><span><strong>AI yordamchisi</strong><small><i></i> Online</small></span></div><p>G‘oyangizni baholaymizmi?</p><a href="#ai-yordamchi">Boshlash <span aria-hidden="true">➜</span></a></div>'+
  '<div class="yi-scene-spark yi-spark-a" aria-hidden="true">✦</div><div class="yi-scene-spark yi-spark-b" aria-hidden="true">✧</div>'+
 '</div>';
}
function escapeHtml(value){return String(value||"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));}
function setupSearch(){
 const toggle=$("yiSearchToggle"),panel=$("yiSearchPanel"),close=$("yiSearchClose"),input=$("yiSiteSearchInput"),results=$("yiSiteSearchResults");
 if(!toggle||!panel||!input||!results)return;
 const pages=[
  {title:"Ish va bandlik",description:"Vakansiyalar, stajirovka va kasbiy imkoniyatlar",href:"./imkoniyatlar.html?category=career",keywords:"ish bandlik vakansiya stajirovka career"},
  {title:"Ta’lim va rivojlanish",description:"Ta’lim, til, stipendiya va kurslar",href:"./imkoniyatlar.html?category=education",keywords:"ta'lim oqish stipendiya grant til kurs"},
  {title:"Startap va innovatsiya",description:"G‘oyani bosqichma-bosqich rivojlantirish",href:"./startap-yoli.html",keywords:"startap biznes tadbirkor innovatsiya loyiha"},
  {title:"Davlat xizmatlari",description:"Rasmiy manbalar va foydalanish yo‘riqnomalari",href:"./davlat-xizmatlari.html",keywords:"davlat xizmat portal mygov murojaat hujjat"},
  {title:"Jamoa va mentorlar",description:"Hamfikrlar va tajribali hamkorlar",href:"#jamoadoshlar",keywords:"jamoa mentor hamkor sherik"},
  {title:"Tashabbuslar",description:"Ochiq loyihalar va yangi tashabbuslar",href:"#top-tashabbuslar",keywords:"tashabbus loyiha goya portfolio"},
  {title:"AI g‘oya tahlili",description:"G‘oyaning tayyorgarligini tahlil qilish",href:"#ai-yordamchi",keywords:"sun'iy intellekt ai goya tahlil bahola"},
  {title:"Xalqaro imkoniyatlar",description:"Xalqaro dastur va tanlovlarni qidirish",href:"./imkoniyatlar.html?query=xalqaro",keywords:"xalqaro xorij chet el almashinuv exchange"},
  {title:"Shaxsiy kabinet",description:"Saqlangan jarayonlar va shaxsiy ma’lumotlar",href:"./kabinet.html",keywords:"kabinet hisob profil ariza jarayon"},
  {title:"3D laboratoriya",description:"Interaktiv tajribalar va fizik modellar",href:"./laboratoriya.html",keywords:"laboratoriya 3d fizika tajriba"}
 ];
 const sections=Array.from(document.querySelectorAll("main section[id]")).map(section=>{const h=section.querySelector("h1,h2,h3");return{title:h?h.textContent.trim():section.id,description:(section.innerText||"").replace(/\s+/g," ").slice(0,130),href:"#"+section.id,keywords:section.innerText||""};});
 const index=pages.concat(sections);
 function rank(query,item){
  const q=normalize(query),title=normalize(item.title),body=normalize(item.title+" "+item.description+" "+item.keywords);
  if(!q)return 0;let points=0;if(title===q)points+=18;if(title.startsWith(q))points+=10;if(title.includes(q))points+=7;if(body.includes(q))points+=5;
  const words=q.split(" ").filter(Boolean);let matched=0;words.forEach(word=>{if(body.includes(word)){matched++;points+=2;if(title.includes(word))points+=3;}});if(words.length>1&&matched===words.length)points+=6;return points;
 }
 function render(){
  const q=input.value.trim();if(!q){results.innerHTML='<p class="yi-search-hint">Qidiruv so‘zini yozing. Sahifalar va bo‘limlar bo‘yicha mos natijalar chiqadi.</p>';return;}
  const rows=index.map(item=>({item,points:rank(q,item)})).filter(x=>x.points>0).sort((a,b)=>b.points-a.points).slice(0,8);
  if(!rows.length){results.innerHTML='<p class="yi-search-hint">Mos bo‘lim topilmadi. Boshqa so‘z bilan qidirib ko‘ring.</p>';return;}
  results.innerHTML=rows.map(({item})=>'<a class="yi-search-result" href="'+escapeHtml(item.href)+'"><span><strong>'+escapeHtml(item.title)+'</strong><small>'+escapeHtml(item.description)+'</small></span><b aria-hidden="true">↗</b></a>').join("");
 }
 function open(){panel.hidden=false;toggle.setAttribute("aria-expanded","true");window.setTimeout(()=>input.focus(),40);render();}
 function shut(){panel.hidden=true;toggle.setAttribute("aria-expanded","false");toggle.focus();}
 toggle.addEventListener("click",()=>panel.hidden?open():shut());close?.addEventListener("click",shut);input.addEventListener("input",render);
 results.addEventListener("click",event=>{if(event.target.closest("a"))shut();});
 document.addEventListener("keydown",event=>{if(event.key==="/"&&panel.hidden&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName||"")){event.preventDefault();open();}if(event.key==="Escape"&&!panel.hidden)shut();});
 document.addEventListener("click",event=>{if(!panel.hidden&&!panel.contains(event.target)&&!toggle.contains(event.target))panel.hidden=true;});
}
function setupTheme(){
 const button=$("yiThemeToggle");if(!button)return;const key="yi-home-theme";
 const set=dark=>{document.body.classList.toggle("yi-dark-mode",dark);button.setAttribute("aria-pressed",dark?"true":"false");button.setAttribute("aria-label",dark?"Yorug‘ ko‘rinishga o‘tish":"Tungi ko‘rinishni yoqish");button.textContent=dark?"☀":"☾";};
 try{set(localStorage.getItem(key)==="dark");}catch{set(false);}
 button.addEventListener("click",()=>{const dark=!document.body.classList.contains("yi-dark-mode");set(dark);try{localStorage.setItem(key,dark?"dark":"light");}catch{}});
}
function init(){
 const main=document.querySelector("main"),hero=document.querySelector(".hero"),art=hero&&hero.querySelector(".art"),overview=$("afzalliklar"),services=$("rasmiy-xizmatlar"),tools=$("qo-shimcha-vositalar"),toolsContent=tools&&tools.querySelector(".additional-tools-content");
 const required=["afzalliklar","jarayon","rasmiy-xizmatlar","imkoniyatlar","imkoniyatlar-yakun","jamoadoshlar","top-tashabbuslar","tashabbus","hamkorlik"];
 if(main&&hero&&art&&overview&&services&&tools&&toolsContent&&required.every(id=>!!$(id))&&overview.parentElement===main&&services.parentElement===main&&required.slice(3).every(id=>toolsContent.contains($(id)))){
  createHeroPreview(art);const sectionParent=overview.parentElement,launcher=document.createElement("section"),stack=document.createElement("div");launcher.className="yi-home-sections wrap";launcher.id="yi-home-sections";stack.className="yi-home-accordion-stack";
  const heading=document.createElement("div");heading.className="yi-home-sections-head";heading.innerHTML='<div><span class="yi-home-sections-eyebrow">Platforma bo‘limlari</span><h2>Kerakli bo‘limni tanlang.</h2></div><p>Har bir bo‘limni alohida oching. Mavjud formalar va yordamchi mexanizmlar o‘z joyida ishlaydi.</p>';
  const openAll=document.createElement("button");openAll.type="button";openAll.className="yi-accordion-global";openAll.textContent="Barcha bo‘limlarni ochish +";openAll.setAttribute("aria-expanded","false");
  sectionParent.insertBefore(launcher,overview);sectionParent.insertBefore(stack,overview);
  const first=createAccordion("platform",GROUPS[0].title,GROUPS[0].description,GROUPS[0].sections,false),second=createAccordion("government",GROUPS[1].title,GROUPS[1].description,GROUPS[1].sections,false);
  launcher.appendChild(heading);heading.appendChild(openAll);stack.append(first,second,tools);
  const nested=document.createElement("div");nested.className="yi-nested-accordion-list";toolsContent.insertBefore(nested,$("imkoniyatlar"));NESTED_GROUPS.forEach(group=>nested.appendChild(createAccordion(group.key,group.title,group.description,group.sections,true)));
  const summary=tools.querySelector(":scope > summary");if(summary){const title=summary.querySelector("strong"),desc=summary.querySelector("small");if(title)title.textContent="AI, loyiha va hamjamiyat vositalari";if(desc)desc.textContent="G‘oya tahlili, yo‘riqnomalar, jamoa, tashabbus va hamkorlik.";}
  openAll.addEventListener("click",()=>{const panels=Array.from(stack.children).filter(node=>node.tagName==="DETAILS"),open=openAll.getAttribute("aria-expanded")!=="true";panels.forEach(panel=>panel.open=open);openAll.setAttribute("aria-expanded",open?"true":"false");openAll.textContent=open?"Barcha bo‘limlarni yopish −":"Barcha bo‘limlarni ochish +";});
  document.addEventListener("click",event=>{const link=event.target.closest('a[href^="#"]');if(!link)return;const id=(link.getAttribute("href")||"").slice(1);const target=$(decodeURIComponent(id));if(!target)return;let fold=target.closest("details");while(fold){fold.open=true;fold=fold.parentElement&&fold.parentElement.closest("details");}},true);
 }else if(art)createHeroPreview(art);
 setupSearch();setupTheme();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();