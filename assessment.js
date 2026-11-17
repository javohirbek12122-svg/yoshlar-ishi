import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cfg=window.YI_CONFIG||{};
const base=String(cfg.supabaseUrl||"").replace(/\/$/,"");
const key=cfg.supabaseKey||cfg.supabaseAnonKey||"";
const bank=window.YI_ASSESSMENT_BANK;
const $=id=>document.getElementById(id);
const esc=value=>String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
const state={user:null,progress:[],history:[],activeTrack:null,questions:[],answers:{},index:0,remaining:30*60,timer:null,submitting:false,lastResult:null};
if(!base||!key||!bank)throw new Error("Test moduli yuklanmadi. Sahifani yangilang.");
const supabase=createClient(base,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,flowType:"pkce"}});

function setNotice(message,isError=false){
 let el=$("yiGlobalNotice");
 if(!el){el=document.createElement("div");el.id="yiGlobalNotice";el.className="yi-assessment-notice";$("yiDashboard").prepend(el);}
 el.textContent=message;el.classList.toggle("is-error",isError);el.hidden=!message;
}
function errorText(error){
 const msg=String(error?.message||error||"Noma’lum xatolik");
 if(/assessment_daily_attempt_limit_reached/.test(msg))return "Bu yo‘nalishda 24 soat ichida 5 ta urinish limiti tugagan. Keyinroq qayta urinib ko‘ring.";
 if(/assessment_authentication_required|JWT|unauthorized/i.test(msg))return "Sessiya muddati tugagan. Qayta tizimga kiring.";
 if(/assessment_bank_not_ready/.test(msg))return "Savollar bazasi vaqtincha tayyor emas. Administratorga xabar bering.";
 if(/network|fetch/i.test(msg))return "Internet aloqasini tekshirib, qayta urinib ko‘ring. Javoblaringiz shu brauzer sessiyasida saqlangan.";
 return "Amal bajarilmadi: "+msg.slice(0,180);
}
function trackLabel(id){return bank.tracks[id]?.title||id;}
function showAuth(){
 $("yiAuthGate").hidden=false;$("yiDashboard").hidden=true;
}
function showDashboard(){
 $("yiAuthGate").hidden=true;$("yiDashboard").hidden=false;
 $("yiWelcomeTitle").textContent=(state.user.user_metadata?.full_name||state.user.email||"Foydalanuvchi")+" — bilim sinovlari";
}
async function loadAccount(){
 const {data,error}=await supabase.auth.getSession();
 if(error)throw error;
 state.user=data.session?.user||null;
 if(!state.user){showAuth();return;}
 showDashboard();
 await loadResults();
}
async function loadResults(){
 const [progress,history]=await Promise.all([
  supabase.from("assessment_progress").select("*").eq("user_id",state.user.id),
  supabase.from("assessment_attempts").select("id,track_id,correct_count,total_questions,score_percent,points_earned,is_best,subject_results,submitted_at").eq("user_id",state.user.id).order("submitted_at",{ascending:false}).limit(20)
 ]);
 if(progress.error)throw progress.error;
 if(history.error)throw history.error;
 state.progress=progress.data||[];state.history=history.data||[];
 renderOverview();renderTracks();renderHistory();
}
function progressFor(track){return state.progress.find(x=>x.track_id===track)||null;}
function renderOverview(){
 const points=state.progress.reduce((n,x)=>n+Number(x.points_total||0),0);
 const tests=state.progress.reduce((n,x)=>n+Number(x.attempts_count||0),0);
 const best=state.progress.length?Math.max(...state.progress.map(x=>Number(x.best_score_percent||0))):0;
 const finished=new Set(state.progress.filter(x=>Number(x.attempts_count)>0).map(x=>x.track_id)).size;
 $("yiOverview").innerHTML=[
  ["Yig‘ilgan ball",points,"90 ballgacha · ichki rag‘bat"],
  ["Yakunlangan test",tests,"Barcha urinishlar"],
  ["Eng yaxshi natija",best+"%","Yo‘nalishlar ichida"],
  ["Sinovdan o‘tilgan",finished+"/3","Yo‘nalishlar"]
 ].map(([label,value,sub])=>'<article class="yi-overview-card"><small>'+esc(label)+'</small><strong>'+esc(value)+'</strong><span>'+esc(sub)+'</span></article>').join("");
}
function renderTracks(){
 $("yiTrackGrid").innerHTML=Object.entries(bank.tracks).map(([id,track],i)=>{
  const p=progressFor(id);
  const attempts=Number(p?.attempts_count||0),points=Number(p?.points_total||0),best=Number(p?.best_score_percent||0);
  const subjectHtml=track.subjects.map(s=>'<span>'+esc(s)+'</span>').join("");
  return '<article class="yi-track-card"><div class="yi-track-card-top"><span class="yi-track-number">0'+(i+1)+'</span><span class="yi-track-pill">'+(attempts?attempts+" ta urinish":"Boshlanmagan")+'</span></div><h3>'+esc(track.title)+'</h3><p>'+esc(track.description)+'</p><div class="yi-track-subjects">'+subjectHtml+'</div><div class="yi-track-stats"><div><strong>'+best+'%</strong><small>Eng yaxshi</small></div><div><strong>'+points+'</strong><small>Ball</small></div><div><strong>'+attempts+'</strong><small>Urinish</small></div></div><button class="yi-track-start" type="button" data-start-track="'+esc(id)+'">'+(attempts?"Qayta ishlash":"Testni boshlash")+' →</button></article>';
 }).join("");
}
function renderHistory(){
 const root=$("yiHistoryList");
 if(!state.history.length){root.innerHTML='<p class="yi-assessment-muted">Hozircha yakunlangan test yo‘q. Birinchi sinovni boshlang.</p>';return;}
 root.innerHTML=state.history.map(row=>'<article class="yi-history-item"><div><strong>'+esc(trackLabel(row.track_id))+'</strong><small>'+new Date(row.submitted_at).toLocaleString("uz-UZ",{dateStyle:"medium",timeStyle:"short"})+' · '+(row.is_best?"Eng yaxshi natija":"Urinish")+'</small></div><span class="yi-history-score">'+row.score_percent+'%</span><span class="yi-history-points">+'+row.points_earned+' ball</span></article>').join("");
}
function draftKey(){return "yi-assessment-draft:"+state.user.id+":"+state.activeTrack;}
function startTest(track){
 if(!state.user){showAuth();return;}
 const questions=(bank.questions||[]).filter(q=>q.track===track);
 if(questions.length!==25){setNotice("Savollar to‘plami to‘liq emas. Administratorga xabar bering.",true);return;}
 state.activeTrack=track;state.questions=[...questions];state.answers={};state.index=0;state.remaining=30*60;state.submitting=false;state.lastResult=null;
 const saved=sessionStorage.getItem(draftKey());
 if(saved){
  try{
   const draft=JSON.parse(saved);
   if(draft.version===bank.version&&draft.track===track&&draft.answers&&confirm("Oldingi tugallanmagan test javoblarini tiklaysizmi?")){
    state.answers=draft.answers;state.remaining=Math.max(60,Math.min(30*60,Number(draft.remaining)||30*60));
    const lastIndex=Number(draft.index);state.index=Number.isInteger(lastIndex)?Math.min(24,Math.max(0,lastIndex)):0;
   }
  }catch{}
 }
 $("yiTestTrackTitle").textContent=trackLabel(track);
 $("yiTestPanel").hidden=false;$("yiResultPanel").hidden=true;
 $("yiTestPanel").scrollIntoView({behavior:"smooth",block:"start"});
 renderQuestion();startClock();
}
function saveDraft(){
 try{sessionStorage.setItem(draftKey(),JSON.stringify({version:bank.version,track:state.activeTrack,answers:state.answers,index:state.index,remaining:state.remaining}));}catch{}
}
function startClock(){
 clearInterval(state.timer);updateTimer();
 state.timer=setInterval(()=>{
  state.remaining=Math.max(0,state.remaining-1);updateTimer();saveDraft();
  if(state.remaining<=0){clearInterval(state.timer);submitTest(true);}
 },1000);
}
function updateTimer(){
 const min=String(Math.floor(state.remaining/60)).padStart(2,"0"),sec=String(state.remaining%60).padStart(2,"0");
 $("yiTimer").textContent=min+":"+sec;
 $("yiTimer").parentElement.classList.toggle("is-low",state.remaining<=5*60);
}
function answeredCount(){return Object.values(state.answers).filter(Boolean).length;}
function renderQuestion(){
 const q=state.questions[state.index];if(!q)return;
 $("yiQuestionSubject").textContent=q.subject;$("yiQuestionDomain").textContent=q.domain;$("yiQuestionNumber").textContent="SAVOL "+String(state.index+1).padStart(2,"0");
 $("yiQuestionTitle").textContent=q.prompt;
 $("yiQuestionOptions").innerHTML=q.options.map(o=>'<label class="yi-question-option '+(state.answers[q.id]===o.key?"is-selected":"")+'"><input type="radio" name="yiAnswer" value="'+o.key+'" '+(state.answers[q.id]===o.key?"checked":"")+'><span class="yi-option-key">'+o.key+'</span><span>'+esc(o.text)+'</span></label>').join("");
 $("yiProgressLabel").textContent=(state.index+1)+" / 25 savol";
 $("yiProgressPercent").textContent=Math.round((state.index+1)/25*100)+"%";
 $("yiProgressFill").style.width=((state.index+1)/25*100)+"%";
 $("yiAnsweredCount").textContent=answeredCount()+" / 25 javob";
 $("yiPrevious").disabled=state.index===0;
 $("yiNext").textContent=state.index===24?"Oxirgi savol":"Keyingi →";
 $("yiQuestionNav").innerHTML=state.questions.map((item,i)=>'<button type="button" data-question-index="'+i+'" class="'+(state.answers[item.id]?"is-answered ":"")+(state.index===i?"is-current":"")+'" aria-label="'+(i+1)+'-savol">'+(i+1)+'</button>').join("");
}
function chooseAnswer(key){
 const q=state.questions[state.index];state.answers[q.id]=key;
 saveDraft();renderQuestion();
}
function goToQuestion(index){
 if(!Number.isInteger(index)||index<0||index>=25)return;
 state.index=index;renderQuestion();
}
async function submitTest(auto=false){
 if(state.submitting||!state.activeTrack)return;
 const unanswered=25-answeredCount();
 if(!auto&&unanswered>0&&!confirm(unanswered+" ta savol javobsiz. Bo‘sh savollar noto‘g‘ri javob sifatida hisoblanadi. Testni yakunlaysizmi?"))return;
 if(!auto&&!confirm("Javoblaringizni yakunlab, natijani hisoblashni tasdiqlaysizmi?"))return;
 state.submitting=true;clearInterval(state.timer);
 $("yiSubmit").disabled=true;$("yiSubmit").textContent="Natija hisoblanmoqda…";
 try{
  const answers=state.questions.map(q=>({questionId:q.id,selectedOption:state.answers[q.id]||""}));
  const {data,error}=await supabase.rpc("submit_assessment_attempt",{p_track_id:state.activeTrack,p_bank_version:bank.version,p_answers:answers});
  if(error)throw error;
  if(!data?.saved)throw new Error("Natija shaxsiy hisobda saqlanmadi.");
  state.lastResult=data;sessionStorage.removeItem(draftKey());
  $("yiTestPanel").hidden=true;renderResult(data);$("yiResultPanel").hidden=false;
  await loadResults();
  $("yiResultPanel").scrollIntoView({behavior:"smooth",block:"start"});
 }catch(error){
  state.submitting=false;
  setNotice(errorText(error),true);
  if(state.remaining>0){startClock();}
 }finally{
  $("yiSubmit").disabled=false;
  $("yiSubmit").textContent=state.remaining<=0?"Natijani qayta yuborish":"Testni yakunlash";
 }
}
function renderResult(result){
 const subjects=(result.subjectResults||[]).map(s=>'<div class="yi-subject-result"><strong>'+esc(s.subject)+'</strong><span><i style="width:'+Math.max(0,Math.min(100,Number(s.percent)||0))+'%"></i></span><b>'+s.correct+'/'+s.total+'</b></div>').join("");
 const review=(result.review||[]).map((r,i)=>{
  const q=state.questions.find(x=>x.id===r.questionId);
  const selected=q?.options.find(o=>o.key===r.selectedOption)?.text||"Javob belgilanmagan";
  const correct=q?.options.find(o=>o.key===r.correctOption)?.text||r.correctOption;
  return '<article class="yi-review-item '+(r.isCorrect?"is-correct":"is-wrong")+'"><div><span>'+String(i+1).padStart(2,"0")+' · '+esc(r.subject)+'</span><span>'+(r.isCorrect?"To‘g‘ri":"Noto‘g‘ri")+'</span></div><strong>'+esc(q?.prompt||r.questionId)+'</strong><p>Sizning javobingiz: '+esc(selected)+'</p><p>To‘g‘ri javob: '+esc(correct)+'</p><p>'+esc(r.explanation||"")+'</p></article>';
 }).join("");
 const newPoints=Number(result.pointsEarned||0),earnedMessage=newPoints>0?("Birinchi urinish uchun "+newPoints+" ichki rag‘bat balli qo‘shildi."):"Bu takroriy urinish. Ball qayta berilmadi, lekin eng yaxshi natijangiz yangilanishi mumkin.";
 $("yiResultPanel").innerHTML='<div class="yi-result-top"><div class="yi-result-score">'+result.scorePercent+'%<small>'+result.correctCount+'/'+result.totalQuestions+' TO‘G‘RI</small></div><div class="yi-result-copy"><span class="yi-assessment-section-kicker">TEST YAKUNLANDI</span><h2>'+esc(trackLabel(state.activeTrack))+'</h2><p>'+earnedMessage+' Jami yo‘nalish balli: '+Number(result.pointsTotal||0)+'/30.</p><div class="yi-result-kpis"><span>To‘g‘ri: '+result.correctCount+'</span><span>Eng yaxshi: '+result.bestCorrectCount+'/25</span><span>Urinish: '+result.attemptsCount+'</span>'+(result.isBestAttempt?'<span>Yangi eng yaxshi natija</span>':'')+'</div></div></div><div class="yi-result-subjects"><h3>Fanlar kesimidagi natija</h3>'+subjects+'</div><h3 class="yi-review-heading">Javoblar tahlili va izohlar</h3><div class="yi-review-list">'+review+'</div><div class="yi-result-actions"><button class="primary" type="button" id="yiRetake">Yana bir bor ishlash</button><button type="button" id="yiBackToTracks">Yo‘nalishlarga qaytish</button><a href="./hamjamiyat.html?tab=activity">Faollik tarixim ↗</a></div>';
 $("yiRetake").addEventListener("click",()=>startTest(state.activeTrack));
 $("yiBackToTracks").addEventListener("click",()=>{$("yiResultPanel").hidden=true;$("yiTrackGrid").scrollIntoView({behavior:"smooth",block:"start"});});
}
function bind(){
 $("yiTrackGrid").addEventListener("click",e=>{const b=e.target.closest("[data-start-track]");if(b)startTest(b.dataset.startTrack);});
 $("yiQuestionOptions").addEventListener("change",e=>{if(e.target.matches('input[name="yiAnswer"]'))chooseAnswer(e.target.value);});
 $("yiQuestionNav").addEventListener("click",e=>{const b=e.target.closest("[data-question-index]");if(b)goToQuestion(Number(b.dataset.questionIndex));});
 $("yiPrevious").addEventListener("click",()=>goToQuestion(state.index-1));
 $("yiNext").addEventListener("click",()=>goToQuestion(Math.min(24,state.index+1)));
 $("yiSubmit").addEventListener("click",()=>submitTest(false));
 $("yiSignOut").addEventListener("click",async()=>{clearInterval(state.timer);await supabase.auth.signOut();state.user=null;showAuth();});
}
async function boot(){
 bind();
 try{await loadAccount();}catch(error){showAuth();setNotice(errorText(error),true);}
 supabase.auth.onAuthStateChange((_event,session)=>{
  state.user=session?.user||null;
  if(!state.user){clearInterval(state.timer);showAuth();}
  else{showDashboard();loadResults().catch(error=>setNotice(errorText(error),true));}
 });
}
boot();
