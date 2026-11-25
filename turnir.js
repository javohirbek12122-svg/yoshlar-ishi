import { supabase, getVerifiedIdentity } from './auth-client.js';
import { clampInt, pointsFor, gamesPlayed, rankTeams, validateTeams } from './turnir-scoring.mjs';


    const STORAGE_KEY = 'yoshlar-ishi-turnir-v1';
    const AUDIT_KEY = 'bilet023-audit-v1';
    const RUBRIC_KEY = 'bilet023-expert-score-v1';
    const userStorageKey = (key) => key + ':' + (state.user?.id || 'guest');
    const SAMPLE = [
      { id:'team-1', name:'Jamoa 1', wins:0, draws:0, losses:0, sort_order:1 },
      { id:'team-2', name:'Jamoa 2', wins:0, draws:0, losses:0, sort_order:2 },
      { id:'team-3', name:'Jamoa 3', wins:0, draws:0, losses:0, sort_order:3 },
      { id:'team-4', name:'Jamoa 4', wins:0, draws:0, losses:0, sort_order:4 }
    ];
    const state = { title:'Turnir jadvali', region:'', eventDate:'', description:'', status:'draft', revision:1, teams:cloneTeams(SAMPLE), tournamentId:null, user:null, role:'local_owner', isReadOnly:false, audit:[], cloudReady:false, authMode:'login', isSample:true, saving:false };
    let saveTimer = null;
    let toastTimer = null;

    function cloneTeams(list){ return list.map(t => ({...t})); }
    function esc(value){ return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
    function points(t){ return pointsFor(t); }
    function played(t){ return gamesPlayed(t); }
    function ranked(){ return rankTeams(state.teams); }
    function canEdit(){ return !state.isReadOnly && (!state.user || ['owner','admin'].includes(state.role) || (state.role==='operator' && state.status!=='published')); }
    function canManage(){ return !state.isReadOnly && (!state.user ? false : ['owner','admin'].includes(state.role)); }
    function canAudit(){ return !state.isReadOnly && (!state.user || ['owner','admin','auditor'].includes(state.role)); }
    function recordAudit(action,detail){
      const entry={id:crypto.randomUUID?crypto.randomUUID():String(Date.now()),action,detail:String(detail||''),at:new Date().toISOString(),actor:state.user?.email||'Mahalliy foydalanuvchi'};
      state.audit=[entry,...state.audit].slice(0,80);
      try{localStorage.setItem(userStorageKey(AUDIT_KEY),JSON.stringify(state.audit));}catch(_e){}
      renderAudit();
    }
    function renderMeta(){
      const fields=[['competitionName',state.title],['competitionRegion',state.region],['competitionDate',state.eventDate],['competitionDescription',state.description]];
      for(const [id,value] of fields){const node=document.getElementById(id);if(node && document.activeElement!==node)node.value=value||'';}
      const status=document.getElementById('recordStatus');
      if(status){status.textContent=state.status==='published'?'E’LON QILINGAN':state.status==='archived'?'ARXIV':'QORALAMA';status.className=state.status;}
      const role=document.getElementById('roleStatus');if(role)role.textContent=(state.role||'guest').toUpperCase();
      const publish=document.getElementById('publishBtn');if(publish){publish.disabled=!canManage()||!state.tournamentId||!supabase;publish.classList.toggle('btn-disabled',publish.disabled);publish.textContent=state.status==='published'?'E’LONDAN OLISH':'Ommaga e’lon qilish';}
      const copy=document.getElementById('copyPublicBtn');if(copy){copy.disabled=state.status!=='published'||!state.tournamentId;copy.classList.toggle('btn-disabled',copy.disabled);}
      const add=document.getElementById('addMemberBtn');if(add){add.disabled=!canManage()||!state.tournamentId||!supabase;add.classList.toggle('btn-disabled',add.disabled);}
      const help=document.getElementById('governanceHelp');if(help)help.textContent=state.user?'Bulut hisobi: '+(state.user.email||'ulangan')+' · rol: '+state.role:state.isReadOnly?'Ommaviy ko‘rish':'Mahalliy sinov rejimi';
      const roleHelp=document.getElementById('roleHelp');if(roleHelp)roleHelp.textContent=canManage()?'Foydalanuvchi UUID sini kiriting. Ruxsatlar bazadagi RLS siyosatlari orqali tekshiriladi.':'Rol biriktirish faqat bulutga kirgan Owner yoki Administrator uchun ochiq.';
      for(const id of ['competitionName','competitionRegion','competitionDate','competitionDescription']){const node=document.getElementById(id);if(node)node.disabled=!canEdit();}
      document.getElementById('saveMetaBtn')?.classList.toggle('btn-disabled',!canEdit());
      document.getElementById('authButton')?.classList.toggle('btn-disabled',state.isReadOnly);
      if(state.isReadOnly){document.getElementById('publicBanner').style.display='block';document.getElementById('authButton').style.display='none';}
    }
    function renderAudit(){
      const list=document.getElementById('auditList');if(!list)return;
      if(!canAudit()){list.innerHTML='<div class="empty-note">Audit tarixi faqat Owner, Administrator va Auditor rollari uchun.</div>';return;}
      if(!state.audit.length){list.innerHTML='<div class="empty-note">Hozircha qaydlar yo‘q. O‘zgarishlar shu yerda ko‘rinadi.</div>';return;}
      list.innerHTML=state.audit.slice(0,20).map(entry=>'<div class="audit-row"><span class="audit-icon">↻</span><div><div class="audit-main">'+esc(entry.action)+'</div><div class="audit-detail">'+esc(entry.detail||entry.actor||'Tizim hodisasi')+'</div></div><time class="audit-time">'+new Date(entry.at).toLocaleString('uz-UZ')+'</time></div>').join('');
    }
    function initRubric(){
      const inputs=[...document.querySelectorAll('[data-rubric]')];
      try{const saved=JSON.parse(localStorage.getItem(RUBRIC_KEY)||'{}');for(const input of inputs)if(Number.isFinite(saved[input.dataset.rubric]))input.value=String(Math.min(Number(input.max),Math.max(0,Math.trunc(saved[input.dataset.rubric]))));}catch(_e){}
      const update=()=>{
        let total=0;const groups={'1':0,'2':0,'3':0,'4':0,'5':0,'6':0};const values={};
        for(const input of inputs){const max=Number(input.max),value=Math.min(max,Math.max(0,Math.trunc(Number(input.value)||0)));input.value=String(value);total+=value;groups[input.dataset.rubric.split('.')[0]]+=value;values[input.dataset.rubric]=value;}
        localStorage.setItem(RUBRIC_KEY,JSON.stringify(values));
        document.getElementById('rubricTotal').textContent=total+' / 100';document.getElementById('rubricTotalCell').textContent=total;document.getElementById('rubricPercent').textContent=total+'%';
        document.getElementById('rubricState').textContent=inputs.every(i=>Number(i.value)===0)?'Hali baholanmagan':'Baholash kiritilmoqda';
        document.querySelectorAll('[data-rubric-group]').forEach(node=>node.textContent=groups[node.dataset.rubricGroup]);
      };
      inputs.forEach(input=>input.addEventListener('change',update));
      document.getElementById('resetRubricBtn')?.addEventListener('click',()=>{inputs.forEach(input=>input.value='0');update();});
      document.getElementById('printRubricBtn')?.addEventListener('click',()=>window.print());
      update();
    }
    async function loadYiAssessmentProgress(){
      const name=document.getElementById('yiPersonalName'),total=document.getElementById('yiPersonalTotal'),root=document.getElementById('yiPersonalTracks');
      if(!root||!total)return;
      const tracks=[{id:'humanities',title:'Gumanitar fanlar'},{id:'natural',title:'Tabiiy fanlar'},{id:'vocational',title:'Kasbiy fanlar'}];
      if(name)name.textContent=state.user?.user_metadata?.full_name||state.user?.email||'Mehmon rejimi';
      if(!state.user){total.textContent='0';root.innerHTML=tracks.map(t=>'<div class="yi-personal-track"><span>'+esc(t.title)+'</span><strong>— / 30</strong><i><b style="width:0%"></b></i></div>').join('');return;}
      try{
        const {data,error}=await supabase.from('assessment_progress').select('track_id,points_total').eq('user_id',state.user.id);
        if(error)throw error;
        const values=new Map((data||[]).map(x=>[x.track_id,Math.min(30,Math.max(0,Number(x.points_total)||0))]));
        total.textContent=String(tracks.reduce((n,t)=>n+(values.get(t.id)||0),0));
        root.innerHTML=tracks.map(t=>{const value=values.get(t.id)||0;return '<div class="yi-personal-track"><span>'+esc(t.title)+'</span><strong>'+value+' / 30</strong><i><b style="width:'+Math.round(value/30*100)+'%"></b></i></div>';}).join('');
      }catch(error){console.warn('Assessment points unavailable',error);root.innerHTML='<p class="empty-note">Bilim sinovlari natijalarini yuklab bo‘lmadi.</p>';}
    }
    function showToast(message){ const el=document.getElementById('toast'); el.textContent=message; el.classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>el.classList.remove('show'),2600); }
    function setSync(mode,title,desc){
      document.getElementById('syncTitle').textContent=title;
      document.getElementById('syncDesc').textContent=desc;
      const dot=document.getElementById('syncDot');
      dot.className='status-dot'+(mode==='good'?' good':mode==='bad'?' bad':'');
    }
    function localSave(){
      if(state.isReadOnly) return;
      try{ localStorage.setItem(userStorageKey(STORAGE_KEY),JSON.stringify({title:state.title,region:state.region,eventDate:state.eventDate,description:state.description,status:state.status,revision:state.revision,teams:state.teams,isSample:state.isSample})); }
      catch(error){ setSync('bad','Saqlash cheklangan','Brauzer xotirasiga yozib bo‘lmadi.'); }
    }
    function loadLocal(){
      try{
        const saved=JSON.parse(localStorage.getItem(userStorageKey(STORAGE_KEY))||'null');
        if(saved && Array.isArray(saved.teams) && saved.teams.length===4){
          state.title=typeof saved.title==='string'?saved.title:'Turnir jadvali';state.region=saved.region||'';state.eventDate=saved.eventDate||'';state.description=saved.description||'';state.status=saved.status||'draft';state.revision=Number(saved.revision)||1;
          state.teams=saved.teams.map((t,i)=>({id:t.id||('local-'+i),name:String(t.name||('Jamoa '+(i+1))).slice(0,80),wins:clampInt(t.wins),draws:clampInt(t.draws),losses:clampInt(t.losses),sort_order:i+1,revision:Number(t.revision)||1}));
          state.isSample=!!saved.isSample;
        }
      }catch(_error){ localStorage.removeItem(userStorageKey(STORAGE_KEY)); }
      if(!localStorage.getItem(userStorageKey(STORAGE_KEY))){state.title='Turnir jadvali';state.region='';state.eventDate='';state.description='';state.status='draft';state.revision=1;state.teams=cloneTeams(SAMPLE);state.isSample=true;}
      try{const rows=JSON.parse(localStorage.getItem(userStorageKey(AUDIT_KEY))||'[]');if(Array.isArray(rows))state.audit=rows.slice(0,80);}catch(_e){}
    }
    function render(){
      renderBoard(); renderStats(); renderLeaders(); renderTests(); renderMeta(); renderAudit();
      localSave();
    }
    function renderBoard(){
      const active=document.activeElement;
      const focus=active && active.dataset && active.dataset.field ? {id:active.dataset.team,field:active.dataset.field,start:active.selectionStart,end:active.selectionEnd}:null;
      const locked=!canEdit();
      const rows=ranked();
      document.getElementById('teamRows').innerHTML=rows.map((t,index)=>{
        const rankClass=t.rank===1?'rank-top':'';
        return '<tr>'+
          '<td class="rank-cell '+rankClass+'">'+String(t.rank).padStart(2,'0')+'</td>'+
          '<td class="team-cell"><label class="sr-only" for="team-'+esc(t.id)+'">Jamoa nomi</label><input class="team-input" id="team-'+esc(t.id)+'" data-team="'+esc(t.id)+'" data-field="name" maxlength="80" value="'+esc(t.name)+'" '+(locked?'disabled':'')+'></td>'+
          '<td><span>'+t.played+'</span></td>'+
          '<td><label class="sr-only">G‘alabalar</label><input class="number-input" type="number" inputmode="numeric" min="0" max="999" step="1" data-team="'+esc(t.id)+'" data-field="wins" value="'+t.wins+'" '+(locked?'disabled':'')+'></td>'+
          '<td><label class="sr-only">Duranglar</label><input class="number-input" type="number" inputmode="numeric" min="0" max="999" step="1" data-team="'+esc(t.id)+'" data-field="draws" value="'+t.draws+'" '+(locked?'disabled':'')+'></td>'+
          '<td><label class="sr-only">Mag‘lubiyatlar</label><input class="number-input" type="number" inputmode="numeric" min="0" max="999" step="1" data-team="'+esc(t.id)+'" data-field="losses" value="'+t.losses+'" '+(locked?'disabled':'')+'></td>'+
          '<td><span class="points '+(index===0?'points-best':'')+'">'+t.points+'</span></td>'+
        '</tr>';
      }).join('');
      if(focus){ const next=document.querySelector('[data-team="'+CSS.escape(focus.id)+'"][data-field="'+CSS.escape(focus.field)+'"]'); if(next){next.focus(); if(typeof next.setSelectionRange==='function' && focus.start!==null) try{next.setSelectionRange(focus.start,focus.end)}catch(_e){}} }
    }
    function renderStats(){
      const list=ranked(), max=list.length?list[0].points:0;
      const uniqueGroups=new Map(); list.forEach(t=>uniqueGroups.set(t.points,(uniqueGroups.get(t.points)||0)+1));
      const ties=[...uniqueGroups.values()].filter(v=>v>1).length;
      document.getElementById('statTeams').textContent=state.teams.length;
      document.getElementById('statMax').textContent=max;
      document.getElementById('statTotal').textContent=list.reduce((sum,t)=>sum+t.points,0);
      document.getElementById('statTies').textContent=ties;
    }
    function renderLeaders(){
      const list=ranked(), max=Math.max(1,...list.map(t=>t.points));
      document.getElementById('leaderList').innerHTML=list.map((t,i)=>
        '<div class="leader"><span class="leader-number">'+String(t.rank).padStart(2,'0')+'</span><div><div class="leader-name">'+esc(t.name)+'</div><div class="bar-track"><div class="bar-fill" style="width:'+Math.round(t.points/max*100)+'%"></div></div></div><span class="leader-points">'+t.points+'</span></div>'
      ).join('');
    }
    function renderTests(){
      const checkTie=rankedFrom([{wins:2,draws:1,losses:0,sort_order:1},{wins:2,draws:1,losses:0,sort_order:2},{wins:1,draws:1,losses:0,sort_order:3},{wins:0,draws:0,losses:1,sort_order:4}]);
      const tests=[
        {ok:2*3+1===7,title:'2 g‘alaba + 1 durang = 7',desc:'Bilet 023 dagi majburiy hisoblash tekshiruvi.'},
        {ok:rankedFrom([{wins:3,draws:0,losses:0},{wins:1,draws:1,losses:0},{wins:0,draws:1,losses:0}])[0].points===9,title:'Ochko kamayish bo‘yicha saralash',desc:'Eng yuqori ochko jadval boshida turadi.'},
        {ok:checkTie[0].rank===1 && checkTie[1].rank===1,title:'Teng ochkoga teng o‘rin',desc:'Bir xil ochkoli jamoalar bir xil raqam oladi.'},
        {ok:clampInt(-5)===0 && clampInt(4.9)===4,title:'Noto‘g‘ri sonlardan himoya',desc:'Manfiy va kasr natijalar qabul qilinmaydi.'}
      ];
      const passed=tests.filter(t=>t.ok).length;
      document.getElementById('testCount').textContent=passed+' / '+tests.length+' tekshiruv muvaffaqiyatli';
      document.getElementById('testGrid').innerHTML=tests.map(t=>'<div class="test-item"><div class="test-result">'+(t.ok?'✓':'!')+' '+(t.ok?'O‘TDI':'TEKSHIRISH KERAK')+'</div><div class="test-description"><strong>'+esc(t.title)+'</strong><br>'+esc(t.desc)+'</div></div>').join('');
    }
    function rankedFrom(list){ return rankTeams(list); }
    function scheduleCloudSave(){
      if(!state.user || !state.tournamentId || !supabase) return;
      clearTimeout(saveTimer);
      saveTimer=setTimeout(saveCloud,650);
    }
    async function saveCloud(){
      if(!state.user || !state.tournamentId || !supabase) return;
      if(state.saving){clearTimeout(saveTimer);saveTimer=setTimeout(saveCloud,650);return;}
      state.saving=true;
      setSync('','Bulutga saqlanmoqda','O‘zgarishlar yagona tranzaksiyada yuborilmoqda…');
      try{
        const validation=validateTeams(state.teams);
        if(!validation.valid) throw new Error(validation.errors.join(' '));
        const {data,error}=await supabase.rpc('bilet023_save_tournament',{
          p_tournament_id:state.tournamentId,
          p_expected_revision:state.revision,
          p_title:state.title.trim().length>=2?state.title.trim():'Turnir jadvali',
          p_region:state.region||'',
          p_event_date:state.eventDate||null,
          p_description:state.description||'',
          p_teams:state.teams.map(team=>({
            id:team.id && !String(team.id).startsWith('team-') && !String(team.id).startsWith('local-') ? team.id : null,
            revision:Number(team.revision)||1,
            team_name:team.name.trim(),
            wins:clampInt(team.wins),
            draws:clampInt(team.draws),
            losses:clampInt(team.losses),
            sort_order:team.sort_order
          }))
        });
        if(error) throw error;
        if(!data || !Number.isFinite(Number(data.revision)) || !Array.isArray(data.teams)) {
          throw new Error('Server saqlash javobi noto‘g‘ri formatda.');
        }
        state.revision=Number(data.revision);
        const savedByOrder=new Map(data.teams.map(team=>[Number(team.sort_order),team]));
        state.teams=state.teams.map(team=>{
          const saved=savedByOrder.get(Number(team.sort_order));
          if(!saved) throw new Error('Server javobida jamoa identifikatori topilmadi.');
          return {...team,id:saved.id,revision:Number(saved.revision)||1};
        });
        state.isSample=false;localSave();
        setSync('good','Server bilan sinxronlangan','Hisob: '+state.user.email);
        await loadAudit();
      }catch(error){
        console.error('Cloud save failed',error);
        setSync('bad','Saqlash to‘xtatildi',error.message||'Tarmoq yoki ma’lumotlarni tekshiring.');
        showToast(error.message||'Serverga saqlash amalga oshmadi. Mahalliy nusxa saqlandi.');
      }finally{state.saving=false;}
    }
    async function loadAudit(){
      if(!supabase || !state.tournamentId || !state.user || !canAudit()) return;
      try{
        const {data,error}=await supabase.from('bilet023_audit_log').select('id,action,entity_type,entity_id,before_data,after_data,created_at,actor_id').eq('tournament_id',state.tournamentId).order('created_at',{ascending:false}).limit(40);
        if(error) throw error;
        state.audit=(data||[]).map(row=>({id:row.id,action:row.action+' · '+row.entity_type,detail:row.after_data?.team_name||row.after_data?.title||row.entity_id||'Server jurnali',at:row.created_at,actor:row.actor_id||'system'}));
        renderAudit();
      }catch(error){console.warn('Audit log unavailable to this role',error);}
    }
    async function loadCloud(){
      if(!supabase || !state.user) return;
      setSync('','Bulutdan yuklanmoqda','Shaxsiy turnir ma’lumotlari olinmoqda…');
      try{
        let {data:tournaments,error}=await supabase.from('bilet023_tournaments').select('id,title,region,event_date,description,status,updated_at,owner_id,revision').eq('owner_id',state.user.id).order('updated_at',{ascending:false}).limit(1);
        if(error) throw error;
        let tournament=tournaments && tournaments[0];
        let memberRole='owner';
        if(!tournament){
          const {data:members,error:memberError}=await supabase.from('bilet023_members').select('tournament_id,role').eq('user_id',state.user.id).limit(1);
          if(memberError && memberError.code!=='42P01') throw memberError;
          if(members?.length){
            const membership=members[0];memberRole=membership.role;
            const found=await supabase.from('bilet023_tournaments').select('id,title,region,event_date,description,status,updated_at,owner_id,revision').eq('id',membership.tournament_id).maybeSingle();
            if(found.error) throw found.error;tournament=found.data;
          }
        }
        if(!tournament){
          const created=await supabase.from('bilet023_tournaments').insert({owner_id:state.user.id,title:state.title,status:'draft'}).select().single();
          if(created.error) throw created.error;tournament=created.data;memberRole='owner';
        }else if(tournament.owner_id!==state.user.id){
          const {data:membership,error:membershipError}=await supabase.from('bilet023_members').select('role').eq('tournament_id',tournament.id).eq('user_id',state.user.id).maybeSingle();
          if(membershipError) throw membershipError;memberRole=membership?.role||'viewer';
        }
        state.tournamentId=tournament.id;state.title=tournament.title||'Turnir jadvali';state.revision=Number(tournament.revision)||1;
        state.region=tournament.region||'';state.eventDate=tournament.event_date||'';state.description=tournament.description||'';state.status=tournament.status||'draft';state.role=memberRole;
        let {data:teams,error:teamError}=await supabase.from('bilet023_teams').select('*').eq('tournament_id',tournament.id).order('sort_order');
        if(teamError) throw teamError;
        if(!teams || teams.length===0){
          const payload=state.teams.map((t,i)=>({tournament_id:tournament.id,team_name:t.name||('Jamoa '+(i+1)),wins:clampInt(t.wins),draws:clampInt(t.draws),losses:clampInt(t.losses),sort_order:i+1}));
          const inserted=await supabase.from('bilet023_teams').insert(payload).select('*').order('sort_order');
          if(inserted.error) throw inserted.error;teams=inserted.data;
        }
        state.teams=teams.slice(0,4).map(t=>({id:t.id,name:t.team_name,wins:clampInt(t.wins),draws:clampInt(t.draws),losses:clampInt(t.losses),sort_order:t.sort_order,revision:Number(t.revision)||1}));
        if(state.teams.length!==4) throw new Error('Turnirda aynan 4 ta jamoa bo‘lishi kerak.');
        state.isSample=false;render();
        setSync('good','Server bilan sinxronlangan','Hisob: '+state.user.email);
        document.getElementById('authButton').textContent='YI profiliga qaytish ↗';
        await loadAudit();
      }catch(error){
        console.error('Cloud load failed',error);
        setSync('bad','Bulutdan yuklab bo‘lmadi',error.message||'Mahalliy nusxa mavjud.');
        showToast('Bulut bilan ulanish xatosi: '+(error.message||'noma’lum xato'));
      }
    }
    async function loadPublic(tournamentId){
      if(!supabase) return;
      state.isReadOnly=true;state.role='viewer';
      try{
        const {data:tournament,error}=await supabase.from('bilet023_public_tournaments').select('id,title,region,event_date,description,status,updated_at,revision').eq('id',tournamentId).eq('status','published').maybeSingle();
        if(error) throw error;if(!tournament) throw new Error('Ommaviy turnir topilmadi yoki hali e’lon qilinmagan.');
        const {data:teams,error:teamError}=await supabase.from('bilet023_teams').select('*').eq('tournament_id',tournament.id).order('sort_order');
        if(teamError) throw teamError;
        state.tournamentId=tournament.id;state.title=tournament.title||'Turnir jadvali';state.revision=Number(tournament.revision)||1;state.region=tournament.region||'';state.eventDate=tournament.event_date||'';state.description=tournament.description||'';state.status=tournament.status;state.teams=(teams||[]).map(t=>({id:t.id,name:t.team_name,wins:clampInt(t.wins),draws:clampInt(t.draws),losses:clampInt(t.losses),sort_order:t.sort_order}));
        render();setSync('good','Ommaviy jadval','Faqat o‘qish rejimi');document.getElementById('authButton').style.display='none';
      }catch(error){setSync('bad','Ommaviy jadval ochilmadi',error.message||'Tekshirishda xato.');showToast(error.message||'Jadval ochilmadi.');}
    }
    async function saveMetadata(){
      const name=document.getElementById('competitionName').value.trim();
      if(name.length<2){showToast('Musobaqa nomi kamida 2 ta belgidan iborat bo‘lsin.');return;}
      state.title=name;state.region=document.getElementById('competitionRegion').value.trim();
      state.eventDate=document.getElementById('competitionDate').value;
      state.description=document.getElementById('competitionDescription').value.trim();
      localSave();recordAudit('Musobaqa ma’lumotlari yangilandi',name);renderMeta();scheduleCloudSave();
      showToast('Musobaqa ma’lumotlari saqlandi.');
    }
    async function togglePublication(){
      if(!canManage()||!supabase||!state.tournamentId){showToast('E’lon qilish uchun Owner yoki Administrator hisobi kerak.');return;}
      const next=state.status==='published'?'draft':'published';
      const update=await supabase.from('bilet023_tournaments')
        .update({status:next,published_at:next==='published'?new Date().toISOString():null})
        .eq('id',state.tournamentId).eq('revision',state.revision).select('revision').maybeSingle();
      if(update.error){showToast('Holatni yangilashda xato: '+update.error.message);return;}
      if(!update.data){showToast('Musobaqa holati boshqa foydalanuvchi tomonidan o‘zgartirilgan. Yangilang va qayta urinib ko‘ring.');return;}
      state.revision=Number(update.data.revision)||state.revision+1;
      state.status=next;localSave();renderMeta();await loadAudit();
      showToast(next==='published'?'Jadval ommaga e’lon qilindi.':'Ommaviy e’lon bekor qilindi.');
    }
    async function copyPublicLink(){
      if(state.status!=='published'||!state.tournamentId)return;
      const url=new URL(window.location.href);url.searchParams.set('tournament',state.tournamentId);
      await navigator.clipboard.writeText(url.toString());showToast('Ommaviy havola nusxalandi.');
    }
    async function addMember(event){
      event.preventDefault();
      if(!canManage()||!supabase||!state.tournamentId){showToast('Bu amal uchun boshqaruvchi roli kerak.');return;}
      const userId=document.getElementById('memberUserId').value.trim();
      const role=document.getElementById('memberRole').value;
      if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId)){showToast('Foydalanuvchi UUID formati noto‘g‘ri.');return;}
      const {error}=await supabase.from('bilet023_members').upsert({tournament_id:state.tournamentId,user_id:userId,role,created_by:state.user.id},{onConflict:'tournament_id,user_id'});
      if(error){showToast('Rol biriktirilmadi: '+error.message);return;}
      document.getElementById('memberUserId').value='';recordAudit('Foydalanuvchi roli yangilandi',role);showToast('Foydalanuvchi roli biriktirildi.');
    }
    function openAuth(){document.getElementById('authModal').classList.add('open');document.getElementById('authEmail').focus();}
    function closeAuth(){document.getElementById('authModal').classList.remove('open');}
    function setAuthMode(mode){
      state.authMode=mode;
      const register=mode==='register';
      document.getElementById('authTitle').textContent=register?'Yangi hisob yaratish':'Bulut bilan sinxronlash';
      document.getElementById('authIntro').textContent=register?'Elektron pochta va parol orqali hisob yarating. E-mail tasdiqlashi yoqilgan bo‘lsa, pochtangizga kelgan havolani bosing.':'Hisobingizga kiring. Turnir ma’lumotlaringiz Supabase’da shaxsiy hisobingizga bog‘lab saqlanadi.';
      document.getElementById('authSubmit').textContent=register?'Hisob yaratish':'Kirish';
      document.getElementById('authSwitch').textContent=register?'Hisobim bor — kirish':'Yangi hisob yaratish';
    }
    async function handleAuth(event){
      event.preventDefault();
      if(!supabase){showToast('Bulut xizmati hozir ulanmagan. Mehmon rejimida davom etishingiz mumkin.');return;}
      const email=document.getElementById('authEmail').value.trim();
      const password=document.getElementById('authPassword').value;
      const submit=document.getElementById('authSubmit');
      submit.disabled=true;submit.textContent='Tekshirilmoqda…';
      try{
        const result=state.authMode==='register'
          ? await supabase.auth.signUp({email,password})
          : await supabase.auth.signInWithPassword({email,password});
        if(result.error) throw result.error;
        if(state.authMode==='register' && !result.data.session){
          showToast('Hisob yaratildi. Elektron pochtangizni tasdiqlang, keyin tizimga kiring.');
          setAuthMode('login');
        }else{
          closeAuth();
          if(result.data.user){state.user=result.data.user;}
          showToast('Hisob muvaffaqiyatli ulandi.');
        }
      }catch(error){showToast(error.message||'Kirishda xatolik yuz berdi.');}
      finally{submit.disabled=false;submit.textContent=state.authMode==='register'?'Hisob yaratish':'Kirish';}
    }
    async function signOut(){
      if(!supabase) return;
      const {error}=await supabase.auth.signOut();
      if(error){showToast(error.message);return;}
      state.user=null;state.tournamentId=null;state.role='local_owner';state.isReadOnly=false;
      loadLocal();render();
      setSync('','Qurilmada saqlanmoqda','Mehmon rejimi · ma’lumotlar shu brauzerda');
      document.getElementById('authButton').textContent='Bulutga ulanish ↗';
      showToast('Hisobdan chiqildi. Qurilmadagi nusxa saqlanib qoldi.');
    }
    function handleChange(event){
      const target=event.target;
      if(!target.dataset || !target.dataset.field) return;
      if(!canEdit()){showToast('Sizda natijani o‘zgartirish ruxsati yo‘q.');return;}
      const team=state.teams.find(t=>String(t.id)===target.dataset.team);
      if(!team) return;
      const field=target.dataset.field;const previous=team[field];
      if(field==='name') team.name=target.value.slice(0,80);
      if(field==='wins'||field==='draws'||field==='losses') team[field]=clampInt(target.value);
      if(String(previous)!==String(team[field]))recordAudit('Jamoa natijasi o‘zgardi',(team.name||'Jamoa')+' · '+field+': '+previous+' → '+team[field]);
      state.isSample=false;
      render();
      scheduleCloudSave();
      if(!state.user) setSync('','Qurilmada saqlanmoqda','O‘zgarishlar shu brauzerda avtomatik saqlandi.');
    }
    function resetTeams(clear){
      if(!canEdit()){showToast('Sizda natijalarni tozalash ruxsati yo‘q.');return;}
      if(!window.confirm(clear?'Barcha natijalarni nolga tushirasizmi?':'Namuna ma’lumotlariga qaytasizmi?')) return;
      state.teams=clear?SAMPLE.map((t)=>({...t,wins:0,draws:0,losses:0})):cloneTeams(SAMPLE);
      state.isSample=!clear;recordAudit(clear?'Natijalar tozalandi':'Namuna natijalari tiklandi','4 ta jamoa bo‘yicha natijalar yangilandi');render();scheduleCloudSave();
      showToast(clear?'Natijalar tozalandi.':'Namuna qayta tiklandi.');
    }
    function exportCsv(){
      const rows=[['O‘rin','Jamoa','O‘yin','G‘alaba','Durang','Mag‘lubiyat','Ochko'],...ranked().map(t=>[t.rank,t.name,t.played,t.wins,t.draws,t.losses,t.points])];
      const csv='\uFEFF'+rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(';')).join('\r\n');
      const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));
      const a=document.createElement('a');a.href=url;a.download='bilet-023-turnir-jadvali.csv';a.click();URL.revokeObjectURL(url);
      showToast('Jadval CSV formatida yuklandi.');
    }
    function toggleTheme(){
      document.body.classList.toggle('dark');
      localStorage.setItem('yoshlar-ishi-turnir-theme',document.body.classList.contains('dark')?'dark':'light');
    }
    function initEvents(){
      document.getElementById('teamRows').addEventListener('change',handleChange);
      document.getElementById('sampleBtn').addEventListener('click',()=>resetTeams(false));
      document.getElementById('clearBtn').addEventListener('click',()=>resetTeams(true));
      document.getElementById('csvBtn').addEventListener('click',exportCsv);
      document.getElementById('printBtn').addEventListener('click',()=>window.print());
      document.getElementById('themeBtn').addEventListener('click',toggleTheme);
      document.getElementById('saveMetaBtn')?.addEventListener('click',saveMetadata);
      document.getElementById('publishBtn')?.addEventListener('click',togglePublication);
      document.getElementById('copyPublicBtn')?.addEventListener('click',copyPublicLink);
      document.getElementById('memberForm')?.addEventListener('submit',addMember);
    }
    async function initCloud(){
      try{
        const publicId=new URLSearchParams(window.location.search).get('tournament');
        if(publicId){await loadPublic(publicId);return;}
        const identity=await getVerifiedIdentity({force:true});
        state.user=identity?.user||null;
        loadLocal();
        if(state.user){await loadCloud();await loadYiAssessmentProgress();}
        else{setSync('','Qurilmada saqlanmoqda','Mehmon rejimi · bulut uchun Yoshlar-Ishi profiliga kiring.');await loadYiAssessmentProgress();}
        supabase.auth.onAuthStateChange((event,session)=>{
          if(event==='SIGNED_IN' && session?.user){state.user=session.user;loadLocal();loadCloud().then(loadYiAssessmentProgress);}
          if(event==='SIGNED_OUT'){state.user=null;state.tournamentId=null;state.role='local_owner';state.isReadOnly=false;loadLocal();render();loadYiAssessmentProgress();}
        });
      }catch(error){console.error('Yoshlar-Ishi session initialization failed',error);setSync('bad','Sessiya tekshirilmadi','YI profilingizga qayta kiring va sahifani yangilang.');}
    }
    function init(){
      if(localStorage.getItem('yoshlar-ishi-turnir-theme')==='dark')document.body.classList.add('dark');
      loadLocal();initEvents();render();initRubric();
      if('serviceWorker' in navigator && import.meta.env.PROD) window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
      initCloud();
    }
    init();
  