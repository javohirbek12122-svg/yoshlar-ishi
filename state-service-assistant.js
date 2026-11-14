
(function(){
"use strict";
var section=document.getElementById("amaliy-yordam");
if(!section)return;
var $=function(id){return document.getElementById(id);};
var portals={
 mygov:{name:"my.gov.uz — Yagona interaktiv davlat xizmatlari portali",url:"https://my.gov.uz/uz"},
 myedu:{name:"my.edu.uz — Yagona ta’lim xizmatlari portali",url:"https://my.edu.uz/"},
 oneid:{name:"OneID — yagona identifikatsiya",url:"https://id.egov.uz/"},
 egov:{name:"eGov — raqamli hukumat ma’lumoti",url:"https://egov.uz/"},
 soliq:{name:"MySoliq — elektron soliq xizmatlari",url:"https://my.soliq.uz/"},
 soliqApp:{name:"Soliq mobil ilovasi",url:"https://mobile.soliq.uz/"},
 pm:{name:"PM.gov.uz — Prezident virtual qabulxonasi",url:"https://pm.gov.uz/"},
 murojaat:{name:"Murojaat.gov.uz — idoraga murojaat",url:"https://murojaat.gov.uz/"},
 youth:{name:"Yoshlar ishlari agentligi",url:"https://gov.uz/oz/yoshlar"},
 advice:{name:"Advice.adliya.uz — huquqiy maslahatlar",url:"https://advice.adliya.uz/oz"},
 argos:{name:"Davlat vakansiyalari portali",url:"https://vacancy.argos.uz/"},
 career:{name:"Career Edu — ta’lim va ish imkoniyatlari",url:"https://career.edu.uz/"},
 birdarcha:{name:"Birdarcha — tadbirkorlikni ro‘yxatdan o‘tkazish",url:"https://new.birdarcha.uz/"},
 license:{name:"Litsenziya tizimi",url:"https://license.gov.uz/"}
};
var routes={
 education:{
  title:"Ta’lim, stipendiya yoki kontrakt",
  intro:"Ta’lim bo‘yicha xizmatlar bir xil emas: OTM qabuli, HEMIS, TTJ, stipendiya, ta’lim krediti va kasbiy ta’lim uchun talablar farq qiladi.",
  steps:[
   ["Qaysi jarayon kerakligini aniqlang","Qabul, HEMIS holati, TTJ navbati, davlat stipendiyasi yoki ta’lim krediti — aynan bittasini tanlab, uning qabul davri va mezonini o‘qing."],
   ["MyEdu katalogidagi xizmat doirasini tekshiring","MyEdu sahifasida ko‘rsatilgan ayrim xizmatlar OTM talabalari yoki doktorantlarga tegishli. Texnikum va maktab o‘quvchilari uchun mosligini alohida tekshiring."],
   ["Faqat xizmat talab qilgan hujjatlarni tayyorlang","Ta’lim maqomi, baholar yoki daromadga oid hujjatlar faqat rasmiy xizmat sahifasida so‘ralgan taqdirdagina kerak bo‘ladi."],
   ["OneID talab qilinsa rasmiy tizimda kiring","Arizani faqat my.edu.uz yoki tegishli rasmiy xizmat portalida yuboring; ariza raqamini o‘zingizda saqlang."],
   ["Natijani xizmatning rasmiy kabinetida tekshiring","Bu yerga kiritilgan belgilashlar davlat bazasiga uzatilmaydi."]
  ],
  docs:["Qaysi ta’lim muassasasi va ta’lim bosqichiga tegishli ekaningizni aniqlash","Talabalik yoki o‘qish maqomini tasdiqlovchi ma’lumot (xizmat so‘rasa)","Baholar / transkript yoki kontrakt ma’lumoti (faqat talab etilsa)","Stipendiya, TTJ yoki kredit nizomidagi yosh va boshqa mezonlarni tekshirish"],
  links:["myedu","mygov","oneid"],
  caution:"MyEdu katalogida HEMIS holati, talabalar turar joyi navbati, Prezident granti va ta’lim krediti xizmatlari ko‘rsatilgan. Ularning barchasi har bir ta’lim turiga yoki har bir talabaga tatbiq etilmaydi."
 },
 youth:{
  title:"Yoshlar dasturi, grant yoki startap",
  intro:"Dastur topishdan oldin yosh, hudud, taqdim etish muddati, tanlov bosqichi, xarajatlar va natija mezonlarini tekshirish kerak.",
  steps:[
   ["Amaldagi dasturni rasmiy manbadan toping","Yoshlar ishlari agentligi e’lonlari va tanlov nizomlarini oching; eski e’lonni amaldagi tanlov deb qabul qilmang."],
   ["Moslik shartlarini satrma-satr tekshiring","Yosh chegarasi, hudud, ta’lim/bandlik holati, ariza sanasi va grant mablag‘idan foydalanish qoidalarini tekshiring."],
   ["Loyihangizni dalillar bilan tayyorlang","Muammo, yechim, natija, jamoa, bosqichlar va xarajat smetasini qisqa hamda o‘lchanadigan qilib yozing."],
   ["Arizani faqat tanlov ko‘rsatgan rasmiy kanalga yuboring","Yoshlar-Ishi grant ajratmaydi va tanlov natijasini kafolatlamaydi."],
   ["Ariza raqami va javob sanasini o‘zingiz kuzating","Rasmiy portal yoki tashkilotchining e’lon qilingan aloqa kanalidan foydalaning."]
  ],
  docs:["Tanlovning to‘liq nizomi, oxirgi sana va rasmiy e’lon havolasi","Loyiha muammosi, yechimi va kutilayotgan natijasi","Asoslangan xarajatlar smetasi va amalga oshirish rejasi","Jamoa / hamkorlar vazifalari va mavjud dalillar"],
  links:["youth","mygov","advice"],
  caution:"“Grant bor” degan reklama yoki ijtimoiy tarmoq xabari yetarli dalil emas. Rasmiy e’lon va tanlov nizomisiz pul yoki hujjat yubormang."
 },
 job:{
  title:"Ish, vakansiya yoki amaliyot",
  intro:"Davlat fuqarolik xizmati tanlovi bilan xususiy sektor yoki talabalar amaliyoti bir xil yo‘l emas. To‘g‘ri platformani tanlang.",
  steps:[
   ["Ish turini aniqlang","Davlat idorasidagi vakansiya, xususiy ish, stajirovka yoki o‘quv-amaliyot ekanini ajrating."],
   ["Vakansiya talablarini tekshiring","Maosh, ish joyi, ish vaqti, ta’lim darajasi, tajriba va hujjatlarni e’londan tekshiring."],
   ["CV va ish namunalaringizni tayyorlang","Faqat vakansiyada so‘ralgan ma’lumotlarni kiriting; IT yo‘nalishida GitHub yoki portfolio havolasini qo‘shishingiz mumkin."],
   ["Arizani ish beruvchining rasmiy platformasida yuboring","Davlat vakansiyalari uchun ARGOS, ta’limga oid karyera imkoniyatlari uchun Career Edu sahifasini ko‘ring."],
   ["Tanlov bosqichlari va suhbat sanasini kuzating","Har bir tanlovning alohida qoidasi va muddati bor."]
  ],
  docs:["Vakansiya talablariga mos CV","Diplom yoki sertifikat (faqat e’londa so‘ralsa)","Portfolio, GitHub yoki bajarilgan ish namunalari (mavjud bo‘lsa)","Suhbat yoki test sanasini belgilab olish"],
  links:["argos","career","mygov"],
  caution:"Davlat vakansiyasiga ariza berish uchun e’londagi malaka talablarini tekshiring. Yoshlar-Ishi ishga qabul qilmaydi va ishga joylashishni kafolatlamaydi."
 },
 tax:{
  title:"Soliq, keshbek yoki to‘lov",
  intro:"Soliq qarzi, ortiqcha to‘lov, chek/keshbek va deklaratsiya alohida xizmatlar. Avval masalaning aynan qaysi biri ekanini aniqlang.",
  steps:[
   ["Masala turini aniqlang","Keshbek, chek, mol-mulk/yer solig‘i, deklaratsiya yoki ortiqcha to‘lovni qaytarish bo‘lishi mumkin."],
   ["MySoliq yoki Soliq mobil ilovasining mos bo‘limini oching","Xizmat nomi va amaldagi shartlarini faqat Soliq qo‘mitasining rasmiy sahifasidan tekshiring."],
   ["Chek va to‘lov dalillarini tayyorlang","Sana, fiskal chek yoki to‘lov yozuvi kabi ma’lumotlarni rasmiy ilovada tekshiring; karta raqamini bu yerga yozmang."],
   ["To‘lov yoki arizani rasmiy kabinetda bajaring","Yoshlar-Ishi soliq bazasini ko‘rmaydi, hisob-kitob qilmaydi va to‘lov qabul qilmaydi."],
   ["Tasdiq va murojaat raqamini saqlang","Shubhali farq bo‘lsa, Soliq qo‘mitasining rasmiy aloqa kanaliga murojaat qiling."]
  ],
  docs:["Masala turi va soliq davri (masalan, qaysi yil yoki oy)","Fiskal chek / to‘lov dalili (faqat rasmiy ilova ichida)","Rasmiy kabinetda ko‘rsatilgan xabar yoki hujjat","To‘lov va ariza tasdig‘i"],
  links:["soliq","soliqApp","mygov"],
  caution:"Soliq summasi va qaytarish huquqini bu navigator hisoblamaydi. Bank karta raqami, SMS-kod yoki login-parolni hech qachon bu sahifaga kiritmang."
 },
 appeal:{
  title:"Murojaat, shikoyat yoki javobga e’tiroz",
  intro:"Murojaatni qaysi idora ko‘rib chiqishi muhim. Murojaat.gov.uz va Prezident virtual qabulxonasi bir xil kanal emas.",
  steps:[
   ["Masalani hal qilish vakolati bor idorani aniqlang","Qaysi tashkilot qaror chiqargan yoki muammoni hal qilish vakolatiga ega ekanini tekshiring."],
   ["Vaziyatni vaqt ketma-ketligida yozing","Sana, joy, voqea, oldin qilingan murojaat va mavjud dalillarni tartiblang."],
   ["To‘g‘ri rasmiy kanalni tanlang","Murojaat.gov.uz orqali tegishli tashkilotni tanlash mumkin. Prezident Xalq qabulxonasi yo‘li kerak bo‘lsa, PM.gov.uz dagi tartibni oching."],
   ["Yuborilgan ariza raqami va javobni saqlang","PM.gov.uz da murojaat bosqichlari va javobga munosabat bildirish uchun alohida kuzatuv mexanizmi mavjud."],
   ["Javob muammoni hal qilmasa, e’tiroz sababini dalil bilan yozing","Yangi qoralama tayyorlagichdan foydalanishingiz mumkin, keyin rasmiy kabinetda yuboring."]
  ],
  docs:["Vakolatli idora nomi va murojaat mavzusi","Voqealar sanasi, joyi va qisqa xronologiyasi","Dalillar: hujjat, foto yoki oldingi yozishma (zarur bo‘lsa)","Avvalgi murojaat raqami va javobi (mavjud bo‘lsa)","Aniq talab: nimani tekshirish yoki qanday chorani so‘raysiz?"],
  links:["murojaat","pm","advice"],
  caution:"Muhim farq: PM.gov.uz sahifasida Prezident Xalq qabulxonasiga oid murojaatlarni kuzatish va javobga munosabat bildirish ko‘rsatilgan. Murojaat.gov.uz esa tegishli tashkilotni foydalanuvchi tanlaydigan alohida platforma. Kanallarni aralashtirmang."
 },
 identity:{
  title:"OneID, shaxsiy ma’lumot yoki davlat xizmati",
  intro:"OneID — ko‘plab davlat tizimlariga kirish uchun yagona identifikatsiya vositasi; u o‘zi alohida xizmat natijasini bermaydi.",
  steps:[
   ["Muammo kirishdami yoki davlat xizmatidami — ajrating","OneID akkauntiga kira olmaslik bilan my.gov.uz dagi muayyan arizaning muammosi boshqa-boshqa masalalar."],
   ["Rasmiy OneID sahifasini oching","Login usuli, telefon raqami va tasdiqlash shartlarini faqat id.egov.uz da tekshiring."],
   ["Voyaga yetmaganlar uchun alohida talabni tekshiring","OneID shartlarida 14–18 yoshdagilarni ro‘yxatdan o‘tkazish ota-ona yoki qonuniy vakilning yozma roziligi bilan ko‘rsatilgan."],
   ["Kerakli xizmatni MyGov katalogidan toping","OneID orqali kirganingiz xizmatga avtomatik ravishda haqli ekaningizni bildirmaydi."],
   ["Kirish ma’lumotlarini himoya qiling","SMS-kod, parol, E-IMZO PIN va zaxira kalitni hech kimga yubormang."]
  ],
  docs:["O‘z nomingizga rasmiylashtirilgan telefon raqami (OneID talabiga muvofiq)","Shaxsni tasdiqlovchi hujjat ma’lumotlari — faqat OneID rasmiy oynasida","14–18 yoshda bo‘lsangiz, ota-ona/qonuniy vakil roziligi talabini tekshiring","Kirishdagi xatolik matni; maxfiy kod va parollarsiz"],
  links:["oneid","egov","mygov"],
  caution:"OneID shartlariga ko‘ra 14–18 yoshdagilarni ro‘yxatdan o‘tkazish ota-ona yoki qonuniy vakilning yozma roziligi bilan amalga oshiriladi. Bu portalga kirish sharti; boshqa xizmatlarning yoshi va talablari alohida tekshiriladi."
 },
 social:{
  title:"Ijtimoiy yordam, nafaqa yoki imtiyoz",
  intro:"Ijtimoiy ko‘mak bo‘yicha huquq oilaviy holat, daromad, yosh, nogironlik yoki amaldagi dastur shartlariga bog‘liq bo‘lishi mumkin.",
  steps:[
   ["Yordam turini aniq nomlang","Nafaqa, moddiy yordam, subsidiya, ijtimoiy xizmat yoki boshqa imtiyozni ajrating."],
   ["MyGov katalogidan tegishli xizmatni toping","Xizmat kimlar uchun, qaysi organ ko‘radi va qaysi ma’lumotlar tekshirilishini o‘qing."],
   ["Huquqiy mezon va hujjatlarni tekshiring","Advice.adliya.uz yoki xizmatning normativ asosida mezonlarni qayta ko‘ring."],
   ["Kerak bo‘lsa, mas’ul idoraga rasmiy murojaat qiling","Tuman/shahar vakolatli tashkiloti yoki rasmiy virtual murojaat kanalidan foydalaning."],
   ["Ariza raqami va rasmiy javobni saqlang","Navigator faqat shaxsiy nazorat uchun ro‘yxat beradi."]
  ],
  docs:["Qaysi yordam turi kerakligini aniq belgilash","Amaldagi dastur yoki xizmatning moslik mezonlari","Oila/daromadga oid hujjatlar — faqat xizmat so‘rasa","Rasmiy ariza raqami va javob"],
  links:["mygov","advice","murojaat"],
  caution:"Ijtimoiy yordamga haqli ekaningizni ushbu sahifa aniqlamaydi. Daromad, oila tarkibi yoki boshqa shaxsiy ma’lumotlarni faqat rasmiy portal talab qilgan xavfsiz maydonga kiriting."
 },
 business:{
  title:"Biznesni boshlash yoki litsenziya",
  intro:"Korxonani ro‘yxatdan o‘tkazish, faoliyat litsenziyasi va soliq majburiyati turli jarayonlar. Birini tugatmasdan boshqasiga o‘tish xatoga olib kelishi mumkin.",
  steps:[
   ["Faoliyat turini va tashkiliy shaklni tanlang","YTT yoki yuridik shaxs, faoliyat yo‘nalishi va litsenziya talab etilishini tekshiring."],
   ["Ro‘yxatdan o‘tish shartlarini Birdarcha orqali o‘qing","Nom, ta’sischi va manzilga doir talablarni rasmiy xizmatning o‘zida tekshiring."],
   ["Litsenziya zarurligini tekshiring","Ayrim faoliyatlar uchun alohida ruxsat yoki litsenziya talab qilinadi."],
   ["Soliq rejimi va hisobot tartibini aniqlang","MySoliq rasmiy kabinetida tadbirkorlikka tegishli soliq xizmatlarini ko‘ring."],
   ["Har bir jarayonning tasdig‘ini alohida saqlang","Ro‘yxatdan o‘tish tasdig‘i litsenziya berilganini anglatmaydi."]
  ],
  docs:["Faoliyat turi va rejalashtirilgan xizmat/mahsulot tavsifi","YTT yoki yuridik shaxs uchun rasmiy talablar","Litsenziya talab qilinadimi — amaldagi ro‘yxatdan tekshirish","Soliq rejimi va hisobot majburiyatlari haqida ma’lumot"],
  links:["birdarcha","license","soliq"],
  caution:"Tadbirkorlikni ro‘yxatdan o‘tkazish bilan litsenziya olish ikki alohida bosqich bo‘lishi mumkin. Faoliyat boshlashdan avval tegishli ruxsat talabini tekshiring."
 }
};
var currentRoute=null;
function node(tag,className,text){
 var e=document.createElement(tag);
 if(className)e.className=className;
 if(text!==undefined)e.textContent=text;
 return e;
}
function portalLink(key){
 var p=portals[key];
 if(!p)return null;
 var a=node("a","",p.name+" ↗");
 a.href=p.url;a.target="_blank";a.rel="noopener noreferrer";
 return a;
}
function updateChecklistProgress(){
 var box=$("saChecklist");
 if(!box)return;
 var items=Array.prototype.slice.call(box.querySelectorAll('input[type="checkbox"]'));
 if(!items.length)return;
 var done=items.filter(function(item){return item.checked;}).length;
 var fill=box.querySelector(".sa-progress span");
 var label=box.querySelector(".sa-progress-label");
 if(fill)fill.style.width=Math.round(done/items.length*100)+"%";
 if(label)label.textContent=done+" / "+items.length+" ta tekshiruv bajarildi";
}
function renderChecklist(route){
 var box=$("saChecklist");box.replaceChildren();
 var progress=node("div","sa-progress");var fill=node("span");progress.appendChild(fill);
 var label=node("div","sa-progress-label","0 / "+route.docs.length+" ta tekshiruv bajarildi");
 box.appendChild(progress);box.appendChild(label);
 route.docs.forEach(function(item,index){
  var labelEl=node("label","sa-check");
  var input=node("input");input.type="checkbox";input.id="saDocCheck"+index;
  input.addEventListener("change",updateChecklistProgress);
  var text=node("span","",item);
  labelEl.appendChild(input);labelEl.appendChild(text);box.appendChild(labelEl);
 });
 updateChecklistProgress();
}
function renderPlan(){
 var key=$("saGoal").value;
 var route=routes[key];
 currentRoute=route;
 var box=$("saPlanResult");box.replaceChildren();
 var title=node("h4","sa-result-title",route.title);
 var intro=node("p","sa-result-intro",route.intro);
 box.appendChild(title);box.appendChild(intro);
 var list=node("ol","sa-steps");
 route.steps.forEach(function(step){
  var li=node("li");
  li.appendChild(node("strong","",step[0]));
  li.appendChild(node("span","",step[1]));
  list.appendChild(li);
 });
 box.appendChild(list);
 box.appendChild(node("h4","sa-resource-title","Kerakli rasmiy manbalar"));
 var resources=node("div","sa-resources");
 route.links.forEach(function(linkKey){var a=portalLink(linkKey);if(a)resources.appendChild(a);});
 box.appendChild(resources);
 var status=$("saStatus").value;
 var age=$("saAge").value;
 var note=route.caution;
 if(age==="minor"){
  note+=" Voyaga yetmagan foydalanuvchilar uchun ayrim xizmatlarda ota-ona yoki qonuniy vakil roziligi talab qilinishi mumkin.";
 }
 if(age==="minor"&&key==="identity"){
  note+=" OneID shartlaridagi 14–18 yosh talabi aynan ro‘yxatdan o‘tishga tegishli.";
 }
 if(key==="education"&&status==="technikum"){
  note+=" Siz texnikum/kasbiy ta’limda bo‘lsangiz, OTM talabalari uchun mo‘ljallangan HEMIS, TTJ yoki stipendiya xizmatlari sizga avtomatik tatbiq etilmaydi.";
 }
 if(key==="education"&&status==="school"){
  note+=" Maktab o‘quvchisi uchun OTM talabalariga mo‘ljallangan xizmatlar mos kelmasligi mumkin.";
 }
 box.appendChild(node("div","sa-caution",note));
 renderChecklist(route);
}
$("saGeneratePlan").addEventListener("click",renderPlan);
$("saGoal").addEventListener("change",function(){
 currentRoute=null;
 $("saPlanResult").replaceChildren(node("div","sa-empty","Yangi yo‘nalish tanlandi. Yo‘l xaritasini qayta tuzing."));
 $("saChecklist").replaceChildren(node("p","sa-muted","Yangi yo‘nalish uchun tekshiruv ro‘yxati hali tuzilmagan."));
});

var draftNames={
 "Ariza":"ariza bilan",
 "Shikoyat":"shikoyat bilan",
 "Taklif":"taklif bilan",
 "Javob yuzasidan e’tiroz":"javob yuzasidan e’tiroz bilan"
};
$("saGenerateDraft").addEventListener("click",function(){
 var agency=$("saDraftAgency").value.trim();
 var issue=$("saDraftIssue").value.trim();
 var request=$("saDraftRequest").value.trim();
 var type=$("saDraftType").value;
 var status=$("saDraftStatus");
 if(!agency||!issue||!request){
  status.textContent="Idora nomi, vaziyat va kutilayotgan natijani to‘ldiring.";
  status.setAttribute("role","alert");
  return;
 }
 var text="Kimga: "+agency+"\nMurojaat turi: "+type+"\n\nMen quyidagi holat yuzasidan "+draftNames[type]+" murojaat qilmoqdaman:\n"+issue+"\n\nSo‘rovim:\n"+request+"\n\nIlovalar: (mavjud bo‘lsa, rasmiy portalda biriktiriladi)\nSana: "+new Date().toLocaleDateString("uz-UZ")+"\nF.I.Sh. va aloqa ma’lumoti: rasmiy portalning xavfsiz formasida to‘ldiriladi.";
 $("saDraftOutput").value=text;
 $("saDraftOutput").hidden=false;
 $("saCopyDraft").hidden=false;
 status.textContent="Qoralama tayyor. Uni tekshiring, zarur dalillarni qo‘shing va faqat vakolatli idoraning rasmiy kanalida yuboring.";
 status.setAttribute("role","status");
});
$("saCopyDraft").addEventListener("click",async function(){
 var output=$("saDraftOutput");
 try{
  if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(output.value);}
  else{output.focus();output.select();document.execCommand("copy");}
  $("saDraftStatus").textContent="Qoralama nusxalandi. Yuborishdan oldin ma’lumotlarni tekshiring.";
 }catch(error){
  output.focus();output.select();
  $("saDraftStatus").textContent="Avtomatik nusxalash ishlamadi. Matn belgilandi — Ctrl+C orqali nusxalang.";
 }
});

var STORAGE_KEY="yoshlar_ishi_state_service_tasks_v1";
function readTasks(){
 try{
  var stored=JSON.parse(localStorage.getItem(STORAGE_KEY)||"[]");
  if(!Array.isArray(stored))return [];
  return stored.filter(function(task){return task&&typeof task.id==="string"&&typeof task.name==="string"&&typeof task.portal==="string"&&typeof task.status==="string";}).slice(0,30);
 }catch(error){return [];}
}
function saveTasks(tasks){
 try{localStorage.setItem(STORAGE_KEY,JSON.stringify(tasks));return true;}
 catch(error){$("saTaskList").replaceChildren(node("p","sa-muted","Brauzer xotirasiga yozib bo‘lmadi. Maxfiy rejim yoki xotira cheklovi bo‘lishi mumkin."));return false;}
}
function renderTasks(){
 var box=$("saTaskList");box.replaceChildren();
 var tasks=readTasks();
 if(!tasks.length){box.appendChild(node("p","sa-muted","Hozircha saqlangan ish yo‘q."));return;}
 tasks.forEach(function(task){
  var card=node("article","sa-task");
  var body=node("div","");
  body.appendChild(node("strong","",task.name));
  var details=task.portal+" · "+task.status+(task.date?" · Sana: "+task.date:"");
  body.appendChild(node("span","",details));
  var remove=node("button","sa-task-delete","O‘chirish");
  remove.type="button";remove.setAttribute("aria-label",task.name+" yozuvini o‘chirish");
  remove.addEventListener("click",function(){
   var next=readTasks().filter(function(item){return item.id!==task.id;});
   if(saveTasks(next))renderTasks();
  });
  card.appendChild(body);card.appendChild(remove);box.appendChild(card);
 });
}
$("saTaskForm").addEventListener("submit",function(event){
 event.preventDefault();
 var name=$("saTaskName").value.trim();
 if(!name)return;
 var tasks=readTasks();
 if(tasks.length>=30){
  $("saTaskList").prepend(node("p","sa-muted","Ro‘yxatda 30 tagacha ish saqlanadi. Avval yakunlangan yozuvni o‘chiring."));
  return;
 }
 tasks.unshift({
  id:String(Date.now())+"-"+String(Math.floor(Math.random()*100000)),
  name:name.slice(0,90),
  portal:$("saTaskPortal").value,
  date:$("saTaskDeadline").value,
  status:$("saTaskStatus").value
 });
 if(saveTasks(tasks)){
  $("saTaskName").value="";
  renderTasks();
 }
});
renderTasks();
})();
