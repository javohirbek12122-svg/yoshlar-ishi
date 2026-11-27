(()=>{
"use strict";
const root=document.getElementById("lab2d");
if(!root)return;
const canvas=document.getElementById("lab2dCanvas");
const ctx=canvas.getContext("2d");
const $=id=>document.getElementById(id);
const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const definitions={
 projectile:{label:"Jism trayektoriyasi",short:"Trayektoriya",description:"Ideal parabolik harakat: burchak, tezlik va gravitatsiya o‘zgarishi masofa hamda balandlikka qanday ta’sir qilishini ko‘ring.",formula:"R = v₀² · sin(2θ) / g",defaults:{v0:20,angle:45,g:9.81},controls:[["v0","Boshlang‘ich tezlik",5,35,1,"m/s"],["angle","Uchish burchagi",15,75,1,"°"],["g","Gravitatsiya",1.6,24,.1,"m/s²"]]},
 wave:{label:"To‘lqin generatori",short:"To‘lqin",description:"Sinusoidal tebranishda amplituda, chastota va to‘lqin uzunligi birgalikda to‘lqin shaklini hosil qiladi.",formula:"y = A · sin(2π(x/λ − ft))",defaults:{amplitude:1,frequency:1,wavelength:3},controls:[["amplitude","Amplituda",.2,1.8,.1,"m"],["frequency","Chastota",.2,3,.1,"Hz"],["wavelength","To‘lqin uzunligi",1,6,.1,"m"]]},
 interference:{label:"Ikki manbali interferensiya",short:"Interferensiya",description:"Ikki kogerent manbadan chiqqan to‘lqinlar ustma-ust tushganda kuchayish va susayish chiziqlari yuzaga keladi.",formula:"Δr = mλ  (maksimum)",defaults:{wavelength:.65,separation:1.2},controls:[["wavelength","To‘lqin uzunligi",.25,1.2,.01,"shartli birlik"],["separation","Manbalar oralig‘i",.5,2.4,.05,"shartli birlik"]]},
 optics:{label:"Optik nur yo‘li",short:"Optika",description:"Snell qonuni bo‘yicha yorug‘likning bir muhitdan boshqasiga o‘tishdagi yo‘nalishini kuzating.",formula:"n₁ sin(θ₁) = n₂ sin(θ₂)",defaults:{angle:35,n2:1.5},controls:[["angle","Tushish burchagi",5,70,1,"°"],["n2","Muhit sinish ko‘rsatkichi",1.1,2.4,.05,"n"]]},
 field:{label:"Elektr maydon vektorlari",short:"Elektr maydoni",description:"Musbat va manfiy nuqta zaryadlari atrofidagi elektr maydon yo‘nalishlarini vektorlar orqali ko‘ring.",formula:"E ∝ q / r²",defaults:{separation:1.5,charge:1},controls:[["separation","Zaryadlar oralig‘i",.7,2.8,.1,"shartli birlik"],["charge","Zaryad kattaligi",.4,2,.1,"nisbiy"]]},
 pendulum:{label:"Mayatnik grafigi",short:"Mayatnik",description:"Kichik burchak yaqinlashuvida mayatnik siljishi vaqt bo‘yicha sinusoidal o‘zgaradi.",formula:"T ≈ 2π√(L/g)",defaults:{length:2,g:9.81},controls:[["length","Ip uzunligi",.5,4,.1,"m"],["g","Gravitatsiya",1.6,24,.1,"m/s²"]]},
 decay:{label:"Eksponensial kamayish",short:"Kamayish",description:"Radioaktiv parchalanishning umumiy matematik egri chizig‘i: har bir yarim davrda qolgan yadrolar soni yarmiga tushadi.",formula:"N(t) = N₀ · 2^(−t / T½)",defaults:{halfLife:6},controls:[["halfLife","Yarim yemirilish davri",2,20,.5,"shartli vaqt"]]},
 seismogram:{label:"Seysmogramma — P, S va sirt to‘lqinlari",short:"Seysmogramma",description:"Zilzila signalining vaqt bo‘yicha yozuvi: tez P-to‘lqin, undan keyingi S-to‘lqin va sirt tebranishlari.",formula:"tₚ ≈ r/vₚ  ·  tₛ ≈ r/vₛ",defaults:{magnitude:5,distance:120},controls:[["magnitude","Vizual magnituda",2,8,.1,"M"],["distance","Stansiyagacha masofa",20,500,10,"km"]]},
 tsunamiProfile:{label:"Tsunami — qirg‘oqdagi to‘lqin profili",short:"Tsunami profili",description:"Uzun to‘lqin okean tubi sayozlashgan sari sekinlashib, balandligi ortishi mumkin.",formula:"v ≈ √(g·h)  ·  h↓ → v↓",defaults:{height:2,speed:400},controls:[["height","Okeandagi balandlik",.2,5,.1,"m"],["speed","Tarqalish tezligi",100,800,10,"km/soat"]]},
 keplerOrbit:{label:"Kepler orbitasi — elliptik harakat",short:"Kepler orbitasi",description:"Sayyora elliptik orbitada harakatlanadi; yulduz fokuslardan birida joylashadi va yaqinlashganda tezligi ortadi.",formula:"r = a(1 − e cos E)  ·  M = E − e sin E",defaults:{eccentricity:.35,period:8},controls:[["eccentricity","Orbita eksentrisiteti",0,.8,.01,"e"],["period","Orbital davr",1,20,.5,"yil"]]},
 supernovaCurve:{label:"Supernova — yorqinlik egri chizig‘i",short:"Supernova egri chizig‘i",description:"Yulduz portlashidan keyin yorqinlik tez ko‘tarilib, maksimumga yetadi va keyin pasayadi.",formula:"L(t): ko‘tarilish → maksimum → radioaktiv so‘nish",defaults:{rise:4,peak:8},controls:[["rise","Maksimumgacha vaqt",1,12,.5,"kun"],["peak","Nisbiy cho‘qqi yorqinligi",2,10,.5,"×"]]},
 volcanoCurve:{label:"Vulqon — bosim va lava faolligi",short:"Vulqon grafigi",description:"Gaz bosimi to‘planishi va davriy bo‘shashi, undan keyin lava oqimining kuchayib-susayishini ko‘rsatuvchi sxematik grafik.",formula:"Bosim yig‘ilishi → otilish → bo‘shashish",defaults:{intensity:6,buildRate:1},controls:[["intensity","Otilish intensivligi",1,10,.5,"/10"],["buildRate","Bosim yig‘ilish tezligi",.5,2,.1,"×"]]},
 lightningImpulse:{label:"Chaqmoq — elektr toki impulsi",short:"Chaqmoq impulsi",description:"Qisqa elektr razryadining tok impulsi: keskin ko‘tarilish va undan keyingi tez so‘nish.",formula:"I(t) = I₀(e^(−t/τd) − e^(−t/τr))",defaults:{amplitude:50,rise:3,decay:35},controls:[["amplitude","Eng yuqori tok",10,100,5,"kA"],["rise","Ko‘tarilish doimiysi",1,8,.5,"µs"],["decay","So‘nish doimiysi",10,70,2,"µs"]]}
};
let mode="projectile",params={...definitions.projectile.defaults},running=!reduced,elapsed=0,last=0,raf=0,visible=false;
let width=900,height=480,dpr=1;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function size(){
 const rect=canvas.getBoundingClientRect();
 width=Math.max(320,rect.width);height=Math.max(240,rect.height);
 dpr=Math.min(window.devicePixelRatio||1,2);
 canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
 ctx.setTransform(dpr,0,0,dpr,0,0);
 draw();
}
function reset(){elapsed=0;draw();$("lab2dStatus").textContent="Boshlang‘ich holat tiklandi."}
function drawGrid(pad=48){
 ctx.clearRect(0,0,width,height);
 const grad=ctx.createLinearGradient(0,0,width,height);grad.addColorStop(0,"#15272c");grad.addColorStop(1,"#0c171b");ctx.fillStyle=grad;ctx.fillRect(0,0,width,height);
 ctx.lineWidth=1;ctx.strokeStyle="rgba(190,215,202,.09)";
 for(let x=pad;x<width-pad;x+=Math.max(28,(width-2*pad)/12)){ctx.beginPath();ctx.moveTo(x,18);ctx.lineTo(x,height-35);ctx.stroke()}
 for(let y=24;y<height-34;y+=Math.max(28,(height-58)/8)){ctx.beginPath();ctx.moveTo(pad,y);ctx.lineTo(width-pad,y);ctx.stroke()}
}
function text(t,x,y,color="#dce8dd",font="10px DM Sans"){ctx.fillStyle=color;ctx.font=font;ctx.fillText(t,x,y)}
function arrow(x1,y1,x2,y2,color="#d7ff66",size=8){
 const a=Math.atan2(y2-y1,x2-x1);ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.beginPath();ctx.moveTo(x2,y2);ctx.lineTo(x2-size*Math.cos(a-.45),y2-size*Math.sin(a-.45));ctx.lineTo(x2-size*Math.cos(a+.45),y2-size*Math.sin(a+.45));ctx.closePath();ctx.fill();
}
function setMetrics(items){
 $("lab2dMetrics").innerHTML=items.map(x=>'<div class="lab2d-metric"><strong>'+x[1]+'</strong><span>'+x[0]+'</span></div>').join("");
}
function drawProjectile(t){
 drawGrid();const v=params.v0,a=params.angle*Math.PI/180,g=params.g,T=2*v*Math.sin(a)/g,R=v*Math.cos(a)*T,H=v*v*Math.sin(a)**2/(2*g);
 const pad=55,scaleX=(width-2*pad)/Math.max(1,R*1.12),scaleY=(height-90)/Math.max(1,H*1.35),base=height-48;
 ctx.strokeStyle="#82938c";ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(pad,base);ctx.lineTo(width-pad+8,base);ctx.stroke();
 ctx.strokeStyle="#6f837c";ctx.beginPath();ctx.moveTo(pad,base);ctx.lineTo(pad,24);ctx.stroke();text("x (m)",width-pad-25,base+23);text("y (m)",pad-32,20);
 ctx.strokeStyle="#d7ff66";ctx.lineWidth=3;ctx.beginPath();
 for(let i=0;i<=150;i++){const q=i/150,tt=T*q,x=pad+v*Math.cos(a)*tt*scaleX,y=base-(v*Math.sin(a)*tt-.5*g*tt*tt)*scaleY;i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.stroke();
 const tt=(t%(T||1)),x=pad+v*Math.cos(a)*tt*scaleX,y=base-(v*Math.sin(a)*tt-.5*g*tt*tt)*scaleY;
 ctx.fillStyle="#ffab72";ctx.shadowColor="#ffab72";ctx.shadowBlur=14;ctx.beginPath();ctx.arc(x,y,6,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
 text("Trayektoriya",pad+8,42,"#d7ff66","800 11px DM Sans");
 setMetrics([["Uchish vaqti",T.toFixed(2)+" s"],["Masofa",R.toFixed(2)+" m"],["Maks. balandlik",H.toFixed(2)+" m"]]);
}
function drawWave(t){
 drawGrid();const mid=height*.52,amp=(height*.31)*params.amplitude/1.8,period=1/params.frequency;
 ctx.strokeStyle="#71867e";ctx.beginPath();ctx.moveTo(42,mid);ctx.lineTo(width-32,mid);ctx.stroke();
 ctx.strokeStyle="#7ccfff";ctx.lineWidth=2.4;ctx.beginPath();
 for(let i=0;i<=width-70;i++){const x=45+i,y=mid-amp*Math.sin(2*Math.PI*(i/Math.max(100,width*.52)-params.frequency*t)/(params.wavelength/3));i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.stroke();
 const y=mid-amp*Math.sin(-2*Math.PI*params.frequency*t);
 ctx.fillStyle="#d7ff66";ctx.beginPath();ctx.arc(45,y,5,0,7);ctx.fill();
 text("y(x,t)  ·  sinusoidal to‘lqin",48,35,"#d7ff66","800 11px DM Sans");
 setMetrics([["Davr",(period).toFixed(2)+" s"],["Tezlik",(params.frequency*params.wavelength).toFixed(2)+" m/s"],["Amplituda",params.amplitude.toFixed(2)+" m"]]);
}
function drawInterference(t){
 drawGrid(26);const cx=width*.5,cy=height*.52,sep=params.separation*70,lam=params.wavelength*64;
 const x1=cx-sep/2,x2=cx+sep/2;
 for(let y=28;y<height-28;y+=2){for(let x=24;x<width-24;x+=2){const r1=Math.hypot(x-x1,y-cy),r2=Math.hypot(x-x2,y-cy),phase=Math.cos((r1-r2)/lam*Math.PI*2);const v=Math.pow((phase+1)/2,2);ctx.fillStyle='rgba(125,207,255,'+(v*.32).toFixed(3)+')';ctx.fillRect(x,y,2,2)}}
 for(let r=22;r<Math.max(width,height);r+=lam){ctx.strokeStyle="rgba(215,255,102,.16)";ctx.lineWidth=1;for(const sx of [x1,x2]){ctx.beginPath();ctx.arc(sx,cy,r,0,Math.PI*2);ctx.stroke()}}
 for(const [x,c] of [[x1,"#ffad73"],[x2,"#7ccfff"]]){ctx.fillStyle=c;ctx.shadowColor=c;ctx.shadowBlur=14;ctx.beginPath();ctx.arc(x,cy,7,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0}
 text("Ikki manba · kuchayish va susayish zonalari",32,34,"#d7ff66","800 10px DM Sans");
 setMetrics([["To‘lqin uzunligi",params.wavelength.toFixed(2)],["Manbalar oralig‘i",params.separation.toFixed(2)],["Model","2 manba"]]);
}
function drawOptics(){
 drawGrid();const y=height*.53,x0=width*.48,ang=params.angle*Math.PI/180,n2=params.n2,n1=1,sin2=n1/n2*Math.sin(ang),a2=Math.asin(clamp(sin2,-1,1));
 ctx.fillStyle="rgba(103,180,220,.12)";ctx.fillRect(x0,y,width-x0,height-y);
 ctx.strokeStyle="#b4c5bd";ctx.setLineDash([5,5]);ctx.beginPath();ctx.moveTo(x0,20);ctx.lineTo(x0,height-25);ctx.stroke();ctx.setLineDash([]);
 ctx.strokeStyle="rgba(222,235,227,.58)";ctx.beginPath();ctx.moveTo(35,y);ctx.lineTo(width-25,y);ctx.stroke();
 const len=Math.min(width,height)*.39;
 arrow(x0-len*Math.sin(ang),y-len*Math.cos(ang),x0,y,"#ffad73",10);
 arrow(x0,y,x0+len*Math.sin(a2),y+len*Math.cos(a2),"#7ccfff",10);
 ctx.strokeStyle="#d7ff66";ctx.setLineDash([4,5]);ctx.beginPath();ctx.moveTo(x0,y-len);ctx.lineTo(x0,y+len);ctx.stroke();ctx.setLineDash([]);
 text("n₁ = 1.00",35,36);text("n₂ = "+n2.toFixed(2),x0+18,y+35,"#7ccfff","800 11px DM Sans");text("θ₁ = "+params.angle+"°",x0-115,y-45,"#ffad73","800 10px DM Sans");text("θ₂ = "+(a2*180/Math.PI).toFixed(1)+"°",x0+18,y+len*.45,"#7ccfff","800 10px DM Sans");
 setMetrics([["Tushish burchagi",params.angle+"°"],["Sinish burchagi",(a2*180/Math.PI).toFixed(1)+"°"],["Indeks",n2.toFixed(2)]]);
}
function drawField(t){
 drawGrid();const cy=height*.52,sep=params.separation*72,cx=width*.5,left=cx-sep/2,right=cx+sep/2,q=params.charge;
 const field=(x,y)=>{let ex=0,ey=0;for(const [sx,sign] of [[left,1],[right,-1]]){const dx=x-sx,dy=y-cy,d=Math.max(18,dx*dx+dy*dy);ex+=sign*q*dx/Math.pow(d,1.5);ey+=sign*q*dy/Math.pow(d,1.5)}return [ex,ey]};
 for(let y=44;y<height-30;y+=32){for(let x=35;x<width-25;x+=32){const [ex,ey]=field(x,y),m=Math.hypot(ex,ey);if(m<1e-6)continue;const ux=ex/m,uy=ey/m;arrow(x-ux*7,y-uy*7,x+ux*8,y+uy*8,"rgba(153,210,176,.72)",5)}}
 for(const [x,color,label] of [[left,"#ff9f70","+"],[right,"#7ccfff","−"]]){ctx.fillStyle=color;ctx.shadowColor=color;ctx.shadowBlur=15;ctx.beginPath();ctx.arc(x,cy,11,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;text(label,x-3,cy+4,"#102027","800 13px DM Sans")}
 text("Elektr maydoni vektorlari",36,35,"#d7ff66","800 11px DM Sans");
 setMetrics([["Zaryad jufti","Dipol"],["Oraliq",params.separation.toFixed(1)],["Kattalik",q.toFixed(1)+" ×"]]);
}
function drawPendulum(t){
 drawGrid();const period=2*Math.PI*Math.sqrt(params.length/params.g),omega=Math.sqrt(params.g/params.length),theta=.45*Math.cos(omega*t),cx=width*.28,top=55,L=Math.min(height*.62,params.length*74);
 const bx=cx+Math.sin(theta)*L,by=top+Math.cos(theta)*L;
 ctx.strokeStyle="#8fa39a";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(cx-80,top);ctx.lineTo(cx+80,top);ctx.stroke();
 ctx.strokeStyle="#d7ff66";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(cx,top);ctx.lineTo(bx,by);ctx.stroke();
 ctx.fillStyle="#ffad73";ctx.beginPath();ctx.arc(bx,by,10,0,Math.PI*2);ctx.fill();
 const gx=width*.54,gy=height*.52,gw=width*.39,gh=height*.34;
 ctx.strokeStyle="#70877b";ctx.beginPath();ctx.moveTo(gx,gy-gh);ctx.lineTo(gx,gy+gh);ctx.lineTo(gx+gw,gy+gh);ctx.stroke();
 ctx.strokeStyle="#7ccfff";ctx.lineWidth=2;ctx.beginPath();for(let i=0;i<=120;i++){const q=i/120,x=gx+q*gw,y=gy-Math.cos(q*period*omega)*gh;i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.stroke();
 const q=(t%period)/period,px=gx+q*gw,py=gy-Math.cos(q*2*Math.PI)*gh;ctx.fillStyle="#d7ff66";ctx.beginPath();ctx.arc(px,py,5,0,Math.PI*2);ctx.fill();
 text("Mayatnik",cx-26,top-18,"#d7ff66","800 11px DM Sans");text("θ(t) grafigi",gx,gy-gh-14,"#7ccfff","800 10px DM Sans");
 setMetrics([["Tebranish davri",period.toFixed(2)+" s"],["Chastota",(1/period).toFixed(2)+" Hz"],["Uzunlik",params.length.toFixed(1)+" m"]]);
}
function drawDecay(){
 drawGrid();const left=62,top=38,bottom=height-50,right=width-30,gw=right-left,gh=bottom-top;
 ctx.strokeStyle="#91a399";ctx.beginPath();ctx.moveTo(left,bottom);ctx.lineTo(right,bottom);ctx.moveTo(left,bottom);ctx.lineTo(left,top);ctx.stroke();
 for(let j=0;j<=4;j++){const y=bottom-gh*j/4;ctx.fillStyle="#9fb0a5";ctx.font="8px DM Sans";ctx.fillText((j*25)+"%",12,y+3)}
 ctx.strokeStyle="#ffb077";ctx.lineWidth=2.6;ctx.beginPath();for(let i=0;i<=160;i++){const time=i/160*params.halfLife*5,n=Math.pow(.5,time/params.halfLife),x=left+i/160*gw,y=bottom-n*gh;i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.stroke();
 for(let k=0;k<=5;k++){const x=left+k/5*gw;ctx.strokeStyle="rgba(215,255,102,.55)";ctx.beginPath();ctx.moveTo(x,bottom);ctx.lineTo(x,bottom-5);ctx.stroke();text((k*params.halfLife).toFixed(0),x-5,bottom+15,"#b6c5b8","8px DM Sans")}
 const tt=(t%(params.halfLife*5)),n=Math.pow(.5,tt/params.halfLife),x=left+tt/(params.halfLife*5)*gw,y=bottom-n*gh;
 ctx.fillStyle="#d7ff66";ctx.beginPath();ctx.arc(x,y,5,0,Math.PI*2);ctx.fill();text("Qolgan miqdor",left,top-12,"#d7ff66","800 10px DM Sans");
 setMetrics([["Yarim davr",params.halfLife+" birlik"],["5 davrdan so‘ng","3.13%"],["Model","Eksponensial"]]);
}

function drawSeismogram(){
 drawGrid();const l=60,top=52,r=width-28,b=height-52,gw=r-l,gh=b-top;
 drawAxes(l,top,r,b,"Vaqt (s)","Signal");
 const d=params.distance,m=params.magnitude,tP=d/6,tS=d/3.5,tSurf=d/2.8,total=Math.max(50,tSurf+28),amp=gh*.34*Math.pow(10,(m-5)/4);
 const signal=t=>{
  const pulse=(center,spread,freq,gain)=>Math.exp(-Math.pow((t-center)/spread,2))*Math.sin((t-center)*freq)*gain;
  return pulse(tP,1.8,5,.32)+pulse(tS,5.5,2.2,.65)+pulse(tSurf,13,1.05,1);
 };
 ctx.strokeStyle="#6df0ff";ctx.lineWidth=2.3;ctx.beginPath();
 for(let i=0;i<=gw;i++){const q=i/gw*timeTotal(total),x=l+i,y=b-signal(q)*amp;i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.stroke();
 [[tP,"P-to‘lqin","#6df0ff"],[tS,"S-to‘lqin","#b99bff"],[tSurf,"Sirt to‘lqini","#ffad73"]].forEach(([q,label,color])=>{const x=l+q/total*gw;ctx.strokeStyle=color;ctx.setLineDash([4,5]);ctx.beginPath();ctx.moveTo(x,top);ctx.lineTo(x,b);ctx.stroke();ctx.setLineDash([]);text(label,Math.min(x+5,r-96),top+14,color,"800 8px DM Sans")});
 const now=elapsed%total,x=l+now/total*gw;ctx.strokeStyle="#f4fbff";ctx.beginPath();ctx.moveTo(x,top);ctx.lineTo(x,b);ctx.stroke();ctx.fillStyle="#ffad73";ctx.beginPath();ctx.arc(x,b-signal(now)*amp,4.5,0,Math.PI*2);ctx.fill();
 setMetrics([["P-to‘lqin yetib kelishi",tP.toFixed(1)+" s"],["S-to‘lqin yetib kelishi",tS.toFixed(1)+" s"],["S–P farqi",(tS-tP).toFixed(1)+" s"]]);
}
function timeTotal(v){return v}
function drawTsunamiProfile(){
 drawGrid();const l=54,top=44,r=width-25,b=height-56,gw=r-l,gh=b-top,coast=l+gw*.83,crest=l+((elapsed*(params.speed/400)*.09)%1)*gw*.75+gw*.07;
 drawAxes(l,top,r,b,"Okean → qirg‘oq","Suv sathi");
 ctx.fillStyle="rgba(47,127,174,.12)";ctx.fillRect(l,top,coast-l,gh);ctx.fillStyle="#9c936e";ctx.beginPath();ctx.moveTo(coast,b);ctx.lineTo(r,top+gh*.35);ctx.lineTo(r,b);ctx.closePath();ctx.fill();
 const wave=x=>{const d=(x-crest)/Math.max(18,gw*.09),shoal=1+Math.max(0,(x-coast)/Math.max(1,r-coast))*2.5;return params.height*shoal*Math.exp(-d*d)*Math.sin(d*2.6)};
 ctx.strokeStyle="#64eaff";ctx.lineWidth=3;ctx.beginPath();
 for(let i=0;i<=gw;i++){const x=l+i,y=b-gh*.15-wave(x)*gh*.105;i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.stroke();
 ctx.strokeStyle="#d7f8ff";ctx.lineWidth=1.4;ctx.beginPath();
 for(let i=0;i<=gw;i++){const x=l+i,y=b-gh*.15-wave(x)*gh*.105-7*Math.exp(-Math.pow((x-crest)/(gw*.1),2));i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.stroke();
 text("Ochiq okean",l+10,top+16,"#80dfff","800 9px DM Sans");text("Sayoz qirg‘oq",coast+8,top+16,"#e2d0a8","800 9px DM Sans");
 setMetrics([["To‘lqin balandligi",params.height.toFixed(1)+" m"],["Tarqalish tezligi",params.speed+" km/soat"],["Sayozlik effekti","Kuchayadi"]]);
}
function drawKeplerOrbit(){
 drawGrid();const cx=width*.49,cy=height*.52,a=Math.min(width,height)*.34,e=params.eccentricity,b=a*Math.sqrt(1-e*e),focus=cx-a*e;
 ctx.strokeStyle="rgba(113,208,255,.65)";ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(cx,cy,a,b,0,0,Math.PI*2);ctx.stroke();
 ctx.fillStyle="#ffb95f";ctx.shadowColor="#ff9b45";ctx.shadowBlur=20;ctx.beginPath();ctx.arc(focus,cy,8,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
 text("Yulduz — fokus",focus-35,cy-18,"#ffc27b","800 9px DM Sans");
 const mean=elapsed/params.period*Math.PI*2;let E=mean;for(let i=0;i<7;i++)E-=(E-e*Math.sin(E)-mean)/(1-e*Math.cos(E));
 const x=cx+a*(Math.cos(E)-e),y=cy-b*Math.sin(E),dist=Math.hypot(x-focus,y);
 ctx.strokeStyle="rgba(255,187,117,.55)";ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(focus,cy);ctx.lineTo(x,y);ctx.stroke();ctx.setLineDash([]);
 ctx.fillStyle="#73efff";ctx.shadowColor="#73efff";ctx.shadowBlur=12;ctx.beginPath();ctx.arc(x,y,6.5,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
 setMetrics([["Eksentrisitet",e.toFixed(2)],["Orbital davr",params.period.toFixed(1)+" yil"],["Nisbiy masofa",(dist/a).toFixed(2)+" a"]]);
}
function drawSupernovaCurve(){
 drawGrid();const l=58,top=44,r=width-26,b=height-55,gw=r-l,gh=b-top,tMax=params.rise+35;
 drawAxes(l,top,r,b,"Vaqt (kun)","Yorqinlik");
 const lum=t=>t<params.rise?params.peak*Math.pow(Math.max(0,t/params.rise),2):params.peak*Math.exp(-(t-params.rise)/12);
 ctx.strokeStyle="#ffaf70";ctx.lineWidth=2.8;ctx.beginPath();
 for(let i=0;i<=gw;i++){const t=i/gw*tMax,x=l+i,y=b-lum(t)/10*gh;i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.stroke();
 const now=elapsed%tMax,x=l+now/tMax*gw,y=b-lum(now)/10*gh;
 ctx.fillStyle="#fff0c7";ctx.shadowColor="#ff9d66";ctx.shadowBlur=13;ctx.beginPath();ctx.arc(x,y,5.5,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
 const peakX=l+params.rise/tMax*gw;ctx.strokeStyle="rgba(111,230,255,.65)";ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(peakX,top);ctx.lineTo(peakX,b);ctx.stroke();ctx.setLineDash([]);
 text("Maksimum yorqinlik",peakX+5,top+13,"#ffbf8d","800 8px DM Sans");
 setMetrics([["Cho‘qqi vaqti",params.rise.toFixed(1)+" kun"],["Nisbiy maksimum",params.peak.toFixed(1)+"×"],["Joriy yorqinlik",lum(now).toFixed(2)+"×"]]);
}
function drawVolcanoCurve(){
 drawGrid();const l=58,top=44,r=width-26,b=height-55,gw=r-l,gh=b-top,cycle=12/params.buildRate;
 drawAxes(l,top,r,b,"Vaqt (shartli birlik)","Faollik");
 const activity=t=>{const q=(t%cycle)/cycle,pressure=25+75*q,lava=q>.72?params.intensity*Math.sin((q-.72)/.28*Math.PI):0;return [pressure,lava*10]};
 ctx.strokeStyle="#6deeff";ctx.lineWidth=2.3;ctx.beginPath();
 for(let i=0;i<=gw;i++){const t=i/gw*cycle*2,[pressure]=activity(t),x=l+i,y=b-pressure/110*gh;i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.stroke();
 ctx.strokeStyle="#ff9a62";ctx.lineWidth=2.5;ctx.beginPath();
 for(let i=0;i<=gw;i++){const t=i/gw*cycle*2,[,lava]=activity(t),x=l+i,y=b-lava/100*gh;i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.stroke();
 const now=elapsed%cycle,[pressure,lava]=activity(now),x=l+now/cycle/2*gw;
 ctx.strokeStyle="#f3f8ff";ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(x,top);ctx.lineTo(x,b);ctx.stroke();ctx.setLineDash([]);
 setMetrics([["Gaz bosimi",pressure.toFixed(0)+"%"],["Lava faolligi",lava.toFixed(0)+"%"],["Otilish intensivligi",params.intensity.toFixed(1)+"/10"]]);
}
function drawLightningImpulse(){
 drawGrid();const l=58,top=44,r=width-26,b=height-55,gw=r-l,gh=b-top;
 drawAxes(l,top,r,b,"Vaqt (µs)","Tok (kA)");
 const tr=params.rise,td=params.decay,tMax=td*4,raw=t=>Math.max(0,Math.exp(-t/td)-Math.exp(-t/tr));
 let maximum=0;for(let i=0;i<=200;i++)maximum=Math.max(maximum,raw(i/200*tMax));
 const current=t=>params.amplitude*raw(t)/maximum;
 ctx.strokeStyle="#c3a0ff";ctx.lineWidth=2.7;ctx.beginPath();
 for(let i=0;i<=gw;i++){const t=i/gw*tMax,x=l+i,y=b-current(t)/params.amplitude*gh;i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.stroke();
 const now=elapsed%tMax,x=l+now/tMax*gw,y=b-current(now)/params.amplitude*gh;
 ctx.fillStyle="#fbf4ff";ctx.shadowColor="#b59bff";ctx.shadowBlur=14;ctx.beginPath();ctx.arc(x,y,5.5,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
 setMetrics([["Eng yuqori tok",params.amplitude+" kA"],["Ko‘tarilish",params.rise+" µs"],["So‘nish",params.decay+" µs"]]);
}
function draw(){
 if(!ctx)return;
 const d=definitions[mode];
 if(mode==="projectile")drawProjectile(elapsed);
 if(mode==="wave")drawWave(elapsed);
 if(mode==="interference")drawInterference(elapsed);
 if(mode==="optics")drawOptics();
 if(mode==="field")drawField(elapsed);
 if(mode==="pendulum")drawPendulum(elapsed);
 if(mode==="decay")drawDecay();
 if(mode==="seismogram")drawSeismogram();
 if(mode==="tsunamiProfile")drawTsunamiProfile();
 if(mode==="keplerOrbit")drawKeplerOrbit();
 if(mode==="supernovaCurve")drawSupernovaCurve();
 if(mode==="volcanoCurve")drawVolcanoCurve();
 if(mode==="lightningImpulse")drawLightningImpulse();
 $("lab2dFormula").textContent=d.formula;
}
function select(key){
 if(!definitions[key])return;mode=key;params={...definitions[key].defaults};elapsed=0;
 root.querySelectorAll(".lab2d-tab").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.mode===mode)));
 $("lab2dTitle").textContent=definitions[key].label;
 $("lab2dDescription").textContent=definitions[key].description;
 $("lab2dPlay").hidden=!["projectile","wave","pendulum","decay"].includes(key);
 $("lab2dPlay").textContent=running?"Ⅱ Pauza":"▶ Davom ettirish";
 $("lab2dStatus").textContent="2D model tayyor.";
 $("lab2dControls").innerHTML=definitions[key].controls.map(c=>'<label class="lab2d-control"><span class="lab2d-control-top"><span>'+c[1]+'</span><output id="lab2d-out-'+c[0]+'">'+params[c[0]]+' '+c[5]+'</output></span><input type="range" data-key="'+c[0]+'" min="'+c[2]+'" max="'+c[3]+'" step="'+c[4]+'" value="'+params[c[0]]+'"><small>'+c[2]+' – '+c[3]+' '+c[5]+'</small></label>').join("");
 $("lab2dControls").querySelectorAll("input").forEach(input=>input.addEventListener("input",()=>{params[input.dataset.key]=Number(input.value);$("lab2d-out-"+input.dataset.key).textContent=input.value+" "+definitions[mode].controls.find(c=>c[0]===input.dataset.key)[5];draw()}));
 draw();start();
}
const animatedMode=()=>["projectile","wave","pendulum","decay","seismogram","tsunamiProfile","keplerOrbit","supernovaCurve","volcanoCurve","lightningImpulse"].includes(mode);
function loop(now){
 raf=0;if(!visible)return;
 if(!running||reduced||!animatedMode()){last=0;draw();return}
 if(last)elapsed=Math.min(elapsed+(now-last)/1000,1e7);last=now;
 draw();raf=requestAnimationFrame(loop);
}
function start(){if(!visible)return;if(running&&!reduced&&animatedMode()){if(!raf)raf=requestAnimationFrame(loop)}else{stop();draw()}}
function stop(){if(raf)cancelAnimationFrame(raf);raf=0;last=0}
root.querySelectorAll(".lab2d-tab").forEach(b=>b.addEventListener("click",()=>select(b.dataset.mode)));
$("lab2dPlay").addEventListener("click",()=>{running=!running;$("lab2dPlay").textContent=running?"Ⅱ Pauza":"▶ Davom ettirish";$("lab2dStatus").textContent=running?"Animatsiya davom etmoqda.":"Animatsiya pauzada.";if(running)start();else{stop();draw()}});
$("lab2dReset").addEventListener("click",reset);
$("lab2dExport").addEventListener("click",()=>{const a=document.createElement("a");a.href=canvas.toDataURL("image/png");a.download="yoshlar-ishi-2d-"+mode+".png";a.click();$("lab2dStatus").textContent="Grafik PNG sifatida yuklandi."});
if("IntersectionObserver"in window){const io=new IntersectionObserver(es=>{visible=es.some(e=>e.isIntersecting);if(visible){size();start()}else stop()},{threshold:.05});io.observe(root)}else{visible=true;size();start()}
window.addEventListener("resize",size,{passive:true});
select("projectile");
})();