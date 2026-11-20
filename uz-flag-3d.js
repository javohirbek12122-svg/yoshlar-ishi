(()=>{"use strict";
const quotas={"index.html":12,"imkoniyatlar.html":4,"startap-yoli.html":3,"davlat-xizmatlari.html":3,"assessment.html":2,"laboratoriya.html":2,"hamjamiyat.html":2,"kabinet.html":2};
const file=(location.pathname.split("/").pop()||"index.html").toLowerCase(),count=quotas[file];if(!count)return;
const flagSvg='<svg viewBox="0 0 60 30" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg"><path fill="#0099b5" d="M0 0h60v10H0z"/><path fill="#fff" d="M0 10h60v10H0z"/><path fill="#1eb53a" d="M0 20h60v10H0z"/><path fill="#ce1126" d="M0 9.55h60v.9H0zm0 10h60v.9H0z"/><circle cx="8.6" cy="5.2" r="3.45" fill="#fff"/><circle cx="10" cy="4.45" r="3" fill="#0099b5"/><g fill="#fff"><path d="m16 2 .45.92 1.02.15-.74.72.18 1.02-.91-.48-.91.48.18-1.02-.74-.72 1.02-.15z"/><path d="m20 2 .45.92 1.02.15-.74.72.18 1.02-.91-.48-.91.48.18-1.02-.74-.72 1.02-.15z"/><path d="m24 2 .45.92 1.02.15-.74.72.18 1.02-.91-.48-.91.48.18-1.02-.74-.72 1.02-.15z"/><path d="m16 5.2.45.92 1.02.15-.74.72.18 1.02-.91-.48-.91.48.18-1.02-.74-.72 1.02-.15z"/><path d="m20 5.2.45.92 1.02.15-.74.72.18 1.02-.91-.48-.91.48.18-1.02-.74-.72 1.02-.15z"/><path d="m24 5.2.45.92 1.02.15-.74.72.18 1.02-.91-.48-.91.48.18-1.02-.74-.72 1.02-.15z"/><path d="m28 5.2.45.92 1.02.15-.74.72.18 1.02-.91-.48-.91.48.18-1.02-.74-.72 1.02-.15z"/><path d="m14 8.4.42.85.94.14-.68.66.16.94-.84-.44-.84.44.16-.94-.68-.66.94-.14z"/><path d="m18 8.4.42.85.94.14-.68.66.16.94-.84-.44-.84.44.16-.94-.68-.66.94-.14z"/><path d="m22 8.4.42.85.94.14-.68.66.16.94-.84-.44-.84.44.16-.94-.68-.66.94-.14z"/><path d="m26 8.4.42.85.94.14-.68.66.16.94-.84-.44-.84.44.16-.94-.68-.66.94-.14z"/><path d="m30 8.4.42.85.94.14-.68.66.16.94-.84-.44-.84.44.16-.94-.68-.66.94-.14z"/></g></svg>';
function addFlag(){const host=document.createElement("span");host.className="yi-flag-host";host.setAttribute("aria-hidden","true");host.innerHTML='<span class="yi-flag-3d">'+flagSvg+'</span>';return host}
function injectFlags(){
 const selector="header .brand,header h1,main h1,main h2,main h3,footer h2,footer h3";
 const list=[...document.querySelectorAll(selector)].filter(el=>el.getClientRects().length&&!el.closest("[hidden],[aria-hidden='true'],script,style")&&!el.querySelector(".yi-flag-host"));
 if(!list.length)return;
 const targetCount=Math.min(count,list.length),used=new Set();
 for(let i=0;i<targetCount;i++){
  let index=Math.min(list.length-1,Math.floor((i+.5)*list.length/targetCount));
  while(used.has(index)&&index<list.length-1)index++;
  if(used.has(index))continue;used.add(index);
  list[index].appendChild(addFlag());
 }
 const flags=document.querySelectorAll(".yi-flag-3d");
 if(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches)return;
 if(!("IntersectionObserver" in window)){flags.forEach(flag=>flag.classList.add("is-inview"));return}
 const observer=new IntersectionObserver(entries=>entries.forEach(entry=>entry.target.classList.toggle("is-inview",entry.isIntersecting)),{rootMargin:"80px 0px",threshold:.02});
 flags.forEach(flag=>observer.observe(flag));
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",injectFlags,{once:true});else injectFlags();
})();