(()=>{"use strict";
const quotas={"index.html":22,"imkoniyatlar.html":7,"startap-yoli.html":6,"davlat-xizmatlari.html":10,"assessment.html":6,"laboratoriya.html":8,"hamjamiyat.html":7,"kabinet.html":4,"privacy.html":7,"physics-lab/index.html":3};
const route=location.pathname.replace(/\/+$/,"")||"/";
const page=route.endsWith("/physics-lab")?"physics-lab/index.html":(route.split("/").pop()||"index.html");
const count=quotas[page];if(!count)return;
const modes=["yi-flag-motion-wave","yi-flag-motion-sail","yi-flag-motion-ripple","yi-flag-motion-glide","yi-flag-motion-flutter"];
const svg='<svg viewBox="0 0 60 30" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg"><path fill="#0099b5" d="M0 0h60v10H0z"/><path fill="#fff" d="M0 10h60v10H0z"/><path fill="#1eb53a" d="M0 20h60v10H0z"/><path fill="#ce1126" d="M0 9.55h60v.9H0zm0 10h60v.9H0z"/><circle cx="8.6" cy="5.2" r="3.45" fill="#fff"/><circle cx="10" cy="4.45" r="3" fill="#0099b5"/><g fill="#fff"><path d="m16 2 .45.92 1.02.15-.74.72.18 1.02-.91-.48-.91.48.18-1.02-.74-.72 1.02-.15z"/><path d="m20 2 .45.92 1.02.15-.74.72.18 1.02-.91-.48-.91.48.18-1.02-.74-.72 1.02-.15z"/><path d="m24 2 .45.92 1.02.15-.74.72.18 1.02-.91-.48-.91.48.18-1.02-.74-.72 1.02-.15z"/><path d="m16 5.2.45.92 1.02.15-.74.72.18 1.02-.91-.48-.91.48.18-1.02-.74-.72 1.02-.15z"/><path d="m20 5.2.45.92 1.02.15-.74.72.18 1.02-.91-.48-.91.48.18-1.02-.74-.72 1.02-.15z"/><path d="m24 5.2.45.92 1.02.15-.74.72.18 1.02-.91-.48-.91.48.18-1.02-.74-.72 1.02-.15z"/><path d="m28 5.2.45.92 1.02.15-.74.72.18 1.02-.91-.48-.91.48.18-1.02-.74-.72 1.02-.15z"/><path d="m14 8.4.42.85.94.14-.68.66.16.94-.84-.44-.84.44.16-.94-.68-.66.94-.14z"/><path d="m18 8.4.42.85.94.14-.68.66.16.94-.84-.44-.84.44.16-.94-.68-.66.94-.14z"/><path d="m22 8.4.42.85.94.14-.68.66.16.94-.84-.44-.84.44.16-.94-.68-.66.94-.14z"/><path d="m26 8.4.42.85.94.14-.68.66.16.94-.84-.44-.84.44.16-.94-.68-.66.94-.14z"/><path d="m30 8.4.42.85.94.14-.68.66.16.94-.84-.44-.84.44.16-.94-.68-.66.94-.14z"/></g></svg>';
const reduced=window.matchMedia?.("(prefers-reduced-motion: reduce)").matches||false;
function makeFlag(index,seed){
 const host=document.createElement("span");host.className="yi-flag-host";host.setAttribute("aria-hidden","true");
 const motion=document.createElement("span");motion.className="yi-flag-3d "+modes[(index+seed)%modes.length];motion.innerHTML=svg;
 motion.style.setProperty("--yi-flag-delay",(((index*7+seed*3)%19)*-.13)+"s");
 motion.style.setProperty("--yi-flag-speed",(4.1+((index*5+seed)%17)/10)+"s");
 host.appendChild(motion);return host;
}
function place(){
 const selector="header .brand,header h1,main h1,main h2,main h3,footer h2,footer h3";
 const headings=[...document.querySelectorAll(selector)].filter(el=>!el.closest("[hidden],[aria-hidden='true'],script,style")&&!el.querySelector(".yi-flag-host"));
 if(!headings.length)return;
 const total=Math.min(count,headings.length),seed=page.split("").reduce((n,ch)=>n+ch.charCodeAt(0),0)%13,used=new Set();
 for(let i=0;i<total;i++){
  let index=Math.min(headings.length-1,Math.floor((i+.5)*headings.length/total));
  while(used.has(index)&&index<headings.length-1)index++;
  if(used.has(index))continue;used.add(index);headings[index].appendChild(makeFlag(i,seed));
 }
 const flags=[...document.querySelectorAll(".yi-flag-3d")];
 if(reduced)return;
 if(!("IntersectionObserver" in window)){flags.forEach(el=>el.classList.add("is-inview"));return}
 const observer=new IntersectionObserver(entries=>entries.forEach(entry=>entry.target.classList.toggle("is-inview",entry.isIntersecting)),{rootMargin:"120px 0px",threshold:.01});
 flags.forEach(el=>observer.observe(el));
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",place,{once:true});else place();
})();