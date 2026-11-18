(() => {
 "use strict";
 const PHONE_QUERY=window.matchMedia("(max-width:760px)");
 const SKIP_PATHS=new Set(["/admin.html","/offline.html"]);
 const path=window.location.pathname.replace(/\/+$/,"")||"/";
 const items=[
  {href:"/index.html",label:"Bosh",name:"Bosh sahifa",icon:"⌂",matches:["/","/index.html"]},
  {href:"/imkoniyatlar.html",label:"Katalog",name:"Imkoniyatlar katalogi",icon:"✳",matches:["/imkoniyatlar.html","/startap-yoli.html","/biletlar.html"]},
  {href:"/davlat-xizmatlari.html",label:"Xizmat",name:"Davlat xizmatlari",icon:"▤",matches:["/davlat-xizmatlari.html"]},
  {href:"/hamjamiyat.html?tab=feed",label:"Jamoa",name:"Yoshlar hamjamiyati",icon:"♧",matches:["/hamjamiyat.html"]},
  {href:"/kabinet.html",label:"Jarayon",name:"Jarayonlar va murojaatlar",icon:"◷",matches:["/kabinet.html"]}
 ];
 const make=(tag,className,text)=>{const e=document.createElement(tag);if(className)e.className=className;if(text!==undefined)e.textContent=text;return e};
 function currentItem(item){if(item.matches.includes(path))return true;if(path.startsWith("/biletlar/"))return item.label==="Katalog";return false}
 function buildDock(){
  if(SKIP_PATHS.has(path))return null;
  let dock=document.getElementById("yi-mobile-dock");if(dock)return dock;
  dock=make("nav","yi-mobile-dock");dock.id="yi-mobile-dock";dock.setAttribute("aria-label","Telefon navigatsiyasi");
  items.forEach(item=>{const a=make("a");a.href=item.href;a.setAttribute("aria-label",item.name);if(currentItem(item)){a.classList.add("is-active");a.setAttribute("aria-current","page")}
   const icon=make("span","yi-dock-icon",item.icon);icon.setAttribute("aria-hidden","true");a.append(icon,make("span","yi-dock-label",item.label));dock.appendChild(a)});
  document.body.appendChild(dock);return dock;
 }
 function updateOverlayState(){
  if(!PHONE_QUERY.matches)return;
  const selector=".yi-side-drawer[aria-hidden='false'],.hp-drawer[aria-hidden='false'],dialog[open],.modal-overlay.open,.modal-backdrop.open,.dialog-backdrop.open,[role='dialog'][aria-modal='true']:not([hidden])";
  const open=[...document.querySelectorAll(selector)].some(el=>{const s=getComputedStyle(el);return s.display!=="none"&&s.visibility!=="hidden"&&el.getBoundingClientRect().height>0});
  document.documentElement.classList.toggle("yi-mobile-overlay-open",open);
 }
 function updateKeyboardState(){
  if(!PHONE_QUERY.matches)return;
  const active=document.activeElement;
  const editing=active&&active.matches("input:not([type=checkbox]):not([type=radio]):not([type=button]):not([type=submit]),textarea,select,[contenteditable='true']");
  const vv=window.visualViewport;
  document.documentElement.classList.toggle("yi-keyboard-open",Boolean(editing&&vv&&(window.innerHeight-vv.height>140)));
 }
 function setResponsiveState(dock){
  const enabled=PHONE_QUERY.matches&&!SKIP_PATHS.has(path);
  document.body.classList.toggle("yi-mobile-enabled",enabled);
  if(dock)dock.hidden=!enabled;
  if(!enabled)document.documentElement.classList.remove("yi-keyboard-open","yi-mobile-overlay-open");
  else{updateOverlayState();updateKeyboardState()}
 }
 function setupQuickServices(){
  const panel=document.querySelector(".service-ribbon .yi-quick-panel"),grid=panel?.querySelector(".yi-quick-grid");
  if(!panel||!grid||document.getElementById("yi-services-more"))return;
  if(!grid.id)grid.id="yi-quick-grid";
  const more=make("button","yi-services-more");more.id="yi-services-more";more.type="button";more.setAttribute("aria-expanded","false");more.setAttribute("aria-controls",grid.id);
  const label=make("span","","Barcha xizmatlarni ko‘rish"),icon=make("span","yi-services-more-icon","+");icon.setAttribute("aria-hidden","true");more.append(label,icon);
  more.addEventListener("click",()=>{const expanded=grid.classList.toggle("yi-services-expanded");more.setAttribute("aria-expanded",String(expanded));label.textContent=expanded?"Qisqartirib ko‘rsatish":"Barcha xizmatlarni ko‘rish";icon.textContent=expanded?"−":"+"});
  grid.after(more);
 }
 function wrapTables(root=document){
  const tables=[];if(root.nodeType===Node.ELEMENT_NODE&&root.matches("table"))tables.push(root);root.querySelectorAll?.("table").forEach(t=>tables.push(t));
  tables.forEach(table=>{if(table.closest(".yi-mobile-table-scroll,.tablewrap,.table-wrap,.table-container,.table-responsive,[data-mobile-scroll]"))return;
   const parent=table.parentElement;if(!parent)return;const wrapper=make("div","yi-mobile-table-scroll");
   wrapper.setAttribute("role","region");wrapper.setAttribute("aria-label",table.caption?.textContent?.trim()||"Jadvalni gorizontal aylantirish uchun");wrapper.tabIndex=0;
   parent.insertBefore(wrapper,table);wrapper.appendChild(table);
  });
 }
 function keepFocusedControlVisible(element){
  if(!PHONE_QUERY.matches||!element?.matches("input,textarea,select,[contenteditable='true']"))return;
  window.setTimeout(()=>{const vv=window.visualViewport,visibleBottom=vv?vv.offsetTop+vv.height:window.innerHeight,rect=element.getBoundingClientRect();
   if(rect.bottom>visibleBottom-22)window.scrollBy({top:rect.bottom-visibleBottom+32,behavior:"smooth"});updateKeyboardState();
  },180);
 }
 function init(){
  if(!document.body)return;
  const dock=buildDock();setResponsiveState(dock);setupQuickServices();wrapTables();
  document.addEventListener("focusin",event=>keepFocusedControlVisible(event.target));
  document.addEventListener("focusout",()=>window.setTimeout(updateKeyboardState,180));
  const mobileNav=document.querySelector(".mobile-nav");if(mobileNav)mobileNav.addEventListener("click",event=>{if(event.target.closest("a"))mobileNav.open=false});
  const observer=new MutationObserver(changes=>{let overlayChanged=false;for(const change of changes){
   if(change.type==="childList"){change.addedNodes.forEach(node=>{if(node.nodeType===Node.ELEMENT_NODE)wrapTables(node)});overlayChanged=true}
   if(change.type==="attributes")overlayChanged=true;
  }if(overlayChanged)updateOverlayState()});
  observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:["class","aria-hidden","hidden","open"]});
  const onViewportChange=()=>{setResponsiveState(dock);updateKeyboardState()};
  if(PHONE_QUERY.addEventListener)PHONE_QUERY.addEventListener("change",onViewportChange);else PHONE_QUERY.addListener(onViewportChange);
  window.addEventListener("resize",onViewportChange,{passive:true});window.addEventListener("orientationchange",onViewportChange,{passive:true});
  if(window.visualViewport){window.visualViewport.addEventListener("resize",updateKeyboardState,{passive:true});window.visualViewport.addEventListener("scroll",updateKeyboardState,{passive:true})}
  document.documentElement.dataset.yiMobileExperience="ready";window.YI_MOBILE_EXPERIENCE_READY=true;
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
