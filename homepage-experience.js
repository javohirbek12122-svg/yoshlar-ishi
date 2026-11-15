
(function () {
  "use strict";
  var GROUPS = [
    {key:"platform",title:"Platforma qanday ishlaydi?",description:"Asosiy foydalanuvchi yo‘li: imkoniyatni topish, talablarni tushunish va keyingi qadamga o‘tish.",sections:["afzalliklar","jarayon"]},
    {key:"government",title:"Davlat xizmatlari va rasmiy manbalar",description:"Rasmiy portallar katalogi, manba tavsiyasi va xizmatdan foydalanish bo‘yicha yo‘riqnoma.",sections:["rasmiy-xizmatlar"]}
  ];
  var NESTED_GROUPS = [
    {key:"idea",title:"G‘oya tahlili va sun’iy intellekt",description:"Loyiha tayyorgarligi, AI yordamchi va keyingi amaliy tavsiyalar.",sections:["imkoniyatlar"]},
    {key:"guides",title:"Qo‘shimcha yo‘l-yo‘riqlar va savollar",description:"Qo‘llab-quvvatlovchi ma’lumotlar, tez-tez so‘raladigan savollar va keyingi qadamlar.",sections:["imkoniyatlar-yakun"]},
    {key:"community",title:"Jamoa, mentorlik va tashabbuslar",description:"Jamoa a’zolarini topish, loyihalarni ko‘rish va hamkorlar bilan bog‘lanish.",sections:["jamoadoshlar","top-tashabbuslar"]},
    {key:"submit",title:"Tashabbus yuborish va hamkorlik",description:"Platformaga tashabbus yuborish, ichki kuzatuv kodini tekshirish va hamkorlik taklifini berish.",sections:["tashabbus","hamkorlik"]}
  ];
  function byId(id){return document.getElementById(id);}
  function createAccordion(key,title,description,sections,nested){
    var details=document.createElement("details");
    details.className=nested?"yi-nested-accordion":"yi-home-accordion";
    details.id=nested?"yi-nested-"+key:"yi-panel-"+key;
    if(nested)details.setAttribute("data-yi-nested-panel",key);
    var summary=document.createElement("summary");
    if(nested){
      var copy=document.createElement("span");copy.className="yi-accordion-copy";
      var strong=document.createElement("strong");strong.className="yi-nested-title";strong.textContent=title;
      var small=document.createElement("small");small.className="yi-nested-description";small.textContent=description;
      copy.appendChild(strong);copy.appendChild(small);summary.appendChild(copy);
    }else{
      var number=document.createElement("span");number.className="yi-accordion-number";number.textContent=key==="platform"?"01":"02";
      var mainCopy=document.createElement("span");mainCopy.className="yi-accordion-copy";
      var mainTitle=document.createElement("strong");mainTitle.textContent=title;
      var mainDescription=document.createElement("small");mainDescription.textContent=description;
      mainCopy.appendChild(mainTitle);mainCopy.appendChild(mainDescription);
      var action=document.createElement("span");action.className="yi-accordion-action";action.textContent="Bo‘limni ochish";
      var chevron=document.createElement("span");chevron.className="yi-accordion-chevron";chevron.setAttribute("aria-hidden","true");chevron.textContent="⌄";
      summary.appendChild(number);summary.appendChild(mainCopy);summary.appendChild(action);summary.appendChild(chevron);
    }
    var content=document.createElement("div");content.className=nested?"yi-nested-content":"yi-accordion-content";
    sections.forEach(function(id){var section=byId(id);if(section)content.appendChild(section);});
    details.appendChild(summary);details.appendChild(content);return details;
  }
  function createHeroPreview(art){
    if(!art||art.querySelector(".yi-hero-scene"))return;
    art.classList.add("yi-hero-visual");
    art.setAttribute("aria-label","Yoshlar jamoasi va ta’lim muhitining 3D ko‘rinishdagi tasviri");
    art.innerHTML=
      '<div class="yi-hero-scene">'+
        '<div class="yi-scene-glow yi-scene-glow-one" aria-hidden="true"></div>'+
        '<div class="yi-scene-glow yi-scene-glow-two" aria-hidden="true"></div>'+
        '<div class="yi-scene-photo-frame">'+
          '<img class="yi-scene-people" src="https://images.unsplash.com/photo-1758270705317-3ef6142d306f?auto=format&fit=crop&fm=webp&q=84&w=1600" alt="Universitetda noutbuk atrofida birgalikda loyiha ustida ishlayotgan yoshlar" fetchpriority="high" decoding="async">'+
        '</div>'+
        '<div class="yi-scene-float yi-scene-float-top"><span class="yi-scene-dot"></span><span>Yoshlar hamkorligi</span></div>'+
        '<div class="yi-scene-float yi-scene-float-bottom"><span class="yi-scene-float-icon">✦</span><span><strong>Imkoniyatdan natijagacha</strong><small>Ta’lim · Kasb · Startap · Grant</small></span></div>'+
        '<div class="yi-scene-caption" aria-hidden="true">Birgalikda o‘rganamiz. Birgalikda rivojlanamiz.</div>'+
      '</div>';
  }
  function addQuickLink(container,href,icon,title,description){
    if(!container||container.querySelector('[data-yi-link="'+href+'"]'))return;
    var a=document.createElement("a");a.className="quickservice";a.href=href;a.setAttribute("data-yi-link",href);
    var symbol=document.createElement("span");symbol.className="quickicon";symbol.setAttribute("aria-hidden","true");symbol.textContent=icon;
    var copy=document.createElement("span");var strong=document.createElement("strong");strong.textContent=title;
    var small=document.createElement("span");small.textContent=description;copy.appendChild(strong);copy.appendChild(small);
    a.appendChild(symbol);a.appendChild(copy);container.appendChild(a);
  }
  function init(){
    var main=document.querySelector("main");
    var hero=document.querySelector(".hero");
    var art=hero&&hero.querySelector(".art");
    var serviceRibbon=byId("xizmatlar");
    var overviewSection=byId("afzalliklar");
    var servicesSection=byId("rasmiy-xizmatlar");
    var toolsDetails=byId("qo-shimcha-vositalar");
    var toolsContent=toolsDetails&&toolsDetails.querySelector(".additional-tools-content");
    var required=["afzalliklar","jarayon","rasmiy-xizmatlar","imkoniyatlar","imkoniyatlar-yakun","jamoadoshlar","top-tashabbuslar","tashabbus","hamkorlik"];
    if(!main||!hero||!art||!serviceRibbon||!overviewSection||!servicesSection||!toolsDetails||!toolsContent)return;
    if(!required.every(function(id){return !!byId(id);}))return;
    if(overviewSection.parentElement!==main||servicesSection.parentElement!==main)return;
    if(!required.slice(3).every(function(id){return toolsContent.contains(byId(id));}))return;

    var eyebrow=hero.querySelector(".eyebrow");
    if(eyebrow&&!hero.querySelector(".yi-hero-kicker")){
      var kicker=document.createElement("div");kicker.className="yi-hero-kicker";kicker.textContent="Yoshlar uchun katta imkoniyatlar";
      eyebrow.insertAdjacentElement("afterend",kicker);
    }
    if(!hero.querySelector(".yi-hero-trust")){
      var note=document.createElement("div");note.className="yi-hero-trust";
      note.innerHTML="<strong>Yagona yo‘nalish:</strong><span>imkoniyatni topish → talablarni tushunish → amaliy qadam.</span>";
      var actions=hero.querySelector(".actions");if(actions)actions.insertAdjacentElement("afterend",note);
    }
    createHeroPreview(art);

    var serviceGrid=serviceRibbon.querySelector(".wrap");
    addQuickLink(serviceGrid,"./startap-yoli.html","↗","Startap yo‘li","G‘oyadan bozorgacha amaliy reja");
    addQuickLink(serviceGrid,"./laboratoriya.html","◉","3D fizika laboratoriyasi","Interaktiv tajriba va modellar");
    addQuickLink(serviceGrid,"./kabinet.html","◎","Shaxsiy kabinet","O‘z jarayonlaringizni boshqarish");

    var sectionParent=overviewSection.parentElement;
    var launcher=document.createElement("section");launcher.className="yi-home-sections wrap";launcher.id="yi-home-sections";
    var heading=document.createElement("div");heading.className="yi-home-sections-head";
    heading.innerHTML='<div><span class="yi-home-sections-eyebrow">Platforma bo‘limlari</span><h2>Kerakli bo‘limni tanlang.</h2></div><p>Asosiy sahifa ixcham qoladi. Har bir bo‘limni alohida ochib, ichidagi barcha mavjud funksiya va yo‘riqnomalardan foydalanishingiz mumkin.</p>';
    var stack=document.createElement("div");stack.className="yi-home-accordion-stack";
    var openAll=document.createElement("button");openAll.type="button";openAll.className="yi-accordion-global";
    openAll.textContent="Barcha bo‘limlarni ochish +";openAll.setAttribute("aria-expanded","false");

    // Insert the new containers before moving their reference sections out of <main>.
    sectionParent.insertBefore(launcher,overviewSection);
    sectionParent.insertBefore(stack,overviewSection);

    var overview=createAccordion("platform",GROUPS[0].title,GROUPS[0].description,GROUPS[0].sections,false);
    var services=createAccordion("government",GROUPS[1].title,GROUPS[1].description,GROUPS[1].sections,false);
    launcher.appendChild(heading);heading.appendChild(openAll);
    stack.appendChild(overview);stack.appendChild(services);stack.appendChild(toolsDetails);

    var nestedList=document.createElement("div");nestedList.className="yi-nested-accordion-list";
    toolsContent.insertBefore(nestedList,byId("imkoniyatlar"));
    NESTED_GROUPS.forEach(function(group){nestedList.appendChild(createAccordion(group.key,group.title,group.description,group.sections,true));});

    var toolSummary=toolsDetails.querySelector(":scope > summary");
    if(toolSummary){
      var toolTitle=toolSummary.querySelector("strong");var toolDescription=toolSummary.querySelector("small");
      if(toolTitle)toolTitle.textContent="Loyiha, AI va hamjamiyat vositalari";
      if(toolDescription)toolDescription.textContent="G‘oya tahlili, startap tayyorgarligi, jamoa, tashabbus va hamkorlik bo‘limlari";
    }

    openAll.addEventListener("click",function(){
      var topPanels=Array.prototype.slice.call(stack.children).filter(function(el){return el.tagName&&el.tagName.toLowerCase()==="details";});
      var shouldOpen=openAll.getAttribute("aria-expanded")!=="true";
      topPanels.forEach(function(panel){panel.open=shouldOpen;});
      openAll.setAttribute("aria-expanded",shouldOpen?"true":"false");
      openAll.textContent=shouldOpen?"Barcha bo‘limlarni yopish −":"Barcha bo‘limlarni ochish +";
    });

    document.addEventListener("click",function(event){
      var link=event.target&&event.target.closest?event.target.closest('a[href^="#"]'):null;
      if(!link)return;
      var href=link.getAttribute("href");if(!href||href==="#")return;
      var target;try{target=byId(decodeURIComponent(href.slice(1)));}catch(error){target=null;}
      if(!target)return;
      var parentDetails=target.closest("details");
      while(parentDetails){parentDetails.open=true;parentDetails=parentDetails.parentElement&&parentDetails.parentElement.closest("details");}
    },true);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();
