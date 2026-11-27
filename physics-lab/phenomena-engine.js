export function createPhenomenaEngine(THREE, world, camera, orbit) {
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rand = (a, b) => a + Math.random() * (b - a);
  let root = null, state = {}, active = "";
  const modes = new Set(["solarSystem","blackHole","supernova","volcano","earthquake","tsunami","tornado","lightning","aurora"]);
  const vec = (x,y,z) => new THREE.Vector3(x,y,z);
  const add = (obj, parent=root) => { parent.add(obj); return obj; };
  const material = (color, extra={}) => new THREE.MeshStandardMaterial({color,roughness:.72,...extra});
  const basic = (color, extra={}) => new THREE.MeshBasicMaterial({color,...extra});
  const sphere = (r, mat, pos=[0,0,0], parent=root, detail=32) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r,detail,Math.max(12,Math.floor(detail*.65))),mat);
    m.position.set(...pos); parent.add(m); return m;
  };
  const box = (w,h,d,mat,pos=[0,0,0],parent=root) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat); m.position.set(...pos); parent.add(m); return m;
  };
  const line = (points,color=0xffffff,opacity=1,radius=0) => {
    const curve = new THREE.CatmullRomCurve3(points);
    if(radius>0){
      const m = new THREE.Mesh(new THREE.TubeGeometry(curve,Math.max(24,points.length*5),radius,7,false),new THREE.MeshBasicMaterial({color,transparent:opacity<1,opacity,depthWrite:false}));
      return add(m);
    }
    const m = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color,transparent:opacity<1,opacity}));
    return add(m);
  };
  const orbitLine = (radius,color=0x54748b,opacity=.42) => {
    const points=[]; for(let i=0;i<=160;i++){const a=i/160*Math.PI*2;points.push(vec(Math.cos(a)*radius,0,Math.sin(a)*radius));}
    const m = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color,transparent:true,opacity}));
    return add(m);
  };
  const pointsObject = (positions,color,size=.08,opacity=.85,parent=root) => {
    const g=new THREE.BufferGeometry(); g.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));
    const m=new THREE.PointsMaterial({color,size,transparent:opacity<1,opacity,sizeAttenuation:true,depthWrite:false});
    const p=new THREE.Points(g,m); parent.add(p); return p;
  };
  const starfield = (count=1000,radius=72) => {
    const a=new Float32Array(count*3);
    for(let i=0;i<count;i++){
      const u=rand(-1,1),v=rand(0,Math.PI*2),r=rand(radius*.6,radius);
      const k=Math.sqrt(1-u*u);a[i*3]=r*k*Math.cos(v);a[i*3+1]=r*u;a[i*3+2]=r*k*Math.sin(v);
    }
    const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.BufferAttribute(a,3));
    return add(new THREE.Points(g,new THREE.PointsMaterial({color:0xc8e5ff,size:.075,transparent:true,opacity:.78,sizeAttenuation:true,depthWrite:false})));
  };
  function view(position,target=[0,0,0]){
    camera.position.set(position[0],position[1],position[2]);
    orbit.target.set(target[0],target[1],target[2]);
    orbit.update();
  }
  function makeGround(color=0x1c2c31,size=42){
    const m=new THREE.Mesh(new THREE.PlaneGeometry(size,size),material(color,{roughness:1}));
    m.rotation.x=-Math.PI/2;m.position.y=-.08;add(m);return m;
  }
  function mount(key,p={}){
    active=key;root=new THREE.Group();world.add(root);state={};
    switch(key){
      case "solarSystem": buildSolarSystem(p); break;
      case "blackHole": buildBlackHole(p); break;
      case "supernova": buildSupernova(p); break;
      case "volcano": buildVolcano(p); break;
      case "earthquake": buildEarthquake(p); break;
      case "tsunami": buildTsunami(p); break;
      case "tornado": buildTornado(p); break;
      case "lightning": buildLightning(p); break;
      case "aurora": buildAurora(p); break;
    }
    return state;
  }

  function buildSolarSystem(p){
    starfield(1300,88);
    const sunMat=material(0xffb33d,{color:0xffc24d,emissive:0xff7100,emissiveIntensity:2.6,roughness:.3});
    const sun=sphere(1.55,sunMat,[0,0,0],root,56);
    const corona1=sphere(1.85,basic(0xffad34,{transparent:true,opacity:.14,side:THREE.BackSide,depthWrite:false}));
    const corona2=sphere(2.12,basic(0xff7b26,{transparent:true,opacity:.065,side:THREE.BackSide,depthWrite:false}));
    const light=new THREE.PointLight(0xffb45e,150,90,1.5);add(light);
    const data=[
      ["Merkur",.22,4.2,0xaaa9a4,.055],
      ["Venera",.34,5.8,0xe8b96e,.035],
      ["Yer",.39,7.6,0x258bd4,.025],
      ["Mars",.29,9.5,0xc85e42,.018],
      ["Yupiter",.92,13.2,0xd8ad7c,.009],
      ["Saturn",.76,17.2,0xd8c28e,.006],
      ["Uran",.55,21,0x83d5d8,.004],
      ["Neptun",.53,24.3,0x3e79d5,.003]
    ];
    const planets=[];
    for(let i=0;i<data.length;i++){
      const [name,size,r,color,speed]=data[i];orbitLine(r,i===2?0x65c7ff:0x55728a,.34);
      const pivot=new THREE.Group();add(pivot);
      const globe=sphere(size,material(color,{roughness:.58,metalness:.06}),[r,0,0],pivot,32);
      const glow=sphere(size*1.18,basic(color,{transparent:true,opacity:.1,side:THREE.BackSide,depthWrite:false}),[r,0,0],pivot,24);
      if(name==="Yer"){
        const clouds=sphere(size*1.025,basic(0xd9f4ff,{transparent:true,opacity:.18,side:THREE.DoubleSide,depthWrite:false}),[r,0,0],pivot,28);
        const moonPivot=new THREE.Group();moonPivot.position.set(r,0,0);pivot.add(moonPivot);
        const moon=sphere(.105,material(0xc5ced7,{roughness:.92}),[1.1,0,0],moonPivot,18);
        planets.push({name,pivot,globe,glow,clouds,moonPivot,moon,speed});
      }else{
        let ring=null;
        if(name==="Saturn"){
          ring=new THREE.Mesh(new THREE.RingGeometry(size*1.25,size*2.15,96),new THREE.MeshStandardMaterial({color:0xdcc59b,roughness:.78,side:THREE.DoubleSide,transparent:true,opacity:.8}));
          ring.rotation.x=-Math.PI/2+.22;ring.position.set(r,0,0);pivot.add(ring);
        }
        planets.push({name,pivot,globe,glow,ring,speed});
      }
    }
    const asteroidPositions=[];
    for(let i=0;i<900;i++){const a=rand(0,Math.PI*2),r=rand(10.7,11.9);asteroidPositions.push(Math.cos(a)*r,rand(-.18,.18),Math.sin(a)*r);}
    const asteroids=pointsObject(asteroidPositions,0xa5a6a2,.045,.68);
    state={sun,corona1,corona2,light,planets,asteroids,phase:"Orbital dinamika"};
    view([31,23,34],[0,0,0]);
  }

  function buildBlackHole(p){
    starfield(1600,75);
    const disk=new THREE.Group();add(disk);
    const shadow=sphere(1.7,basic(0x010208),[0,0,0],root,64);
    const horizon=sphere(1.76,basic(0x172b45,{wireframe:true,transparent:true,opacity:.22,depthWrite:false}),[0,0,0],root,42);
    const photon=new THREE.Mesh(new THREE.TorusGeometry(1.92,.075,12,160),new THREE.MeshBasicMaterial({color:0xe4f8ff,transparent:true,opacity:.92}));
    photon.rotation.x=Math.PI/2;add(photon);
    const diskMaterial=new THREE.MeshBasicMaterial({color:0xff8a38,side:THREE.DoubleSide,transparent:true,opacity:.82,depthWrite:false});
    const hotDisk=new THREE.Mesh(new THREE.RingGeometry(2.2,5.6,160,8),diskMaterial);hotDisk.rotation.x=-Math.PI/2;disk.add(hotDisk);
    const inner=new THREE.Mesh(new THREE.RingGeometry(2.15,3.05,128,5),basic(0xffd18a,{side:THREE.DoubleSide,transparent:true,opacity:.88,depthWrite:false}));
    inner.rotation.x=-Math.PI/2;inner.position.y=.045;disk.add(inner);
    const outer=new THREE.Mesh(new THREE.RingGeometry(4.8,6.3,140,5),basic(0xc64728,{side:THREE.DoubleSide,transparent:true,opacity:.42,depthWrite:false}));
    outer.rotation.x=-Math.PI/2;outer.position.y=-.04;disk.add(outer);
    const dustPos=[];
    for(let i=0;i<1800;i++){const a=rand(0,Math.PI*2),r=rand(2.3,6.1);dustPos.push(Math.cos(a)*r,rand(-.16,.16),Math.sin(a)*r);}
    const dust=pointsObject(dustPos,0xffc078,.055,.92,disk);
    const sparkPos=[];
    for(let i=0;i<360;i++){const a=rand(0,Math.PI*2),r=rand(2.4,5.6);sparkPos.push(Math.cos(a)*r,rand(.12,.35),Math.sin(a)*r);}
    const sparks=pointsObject(sparkPos,0xfff0c8,.035,.95,disk);
    const arcs=[];
    for(let j=0;j<3;j++){
      const pts=[];for(let i=0;i<=90;i++){const a=Math.PI*(i/90);pts.push(vec(Math.cos(a)*(2.1+j*.42),Math.sin(a)*(2.3+j*.5)+.4,0));}
      arcs.push(line(pts,j===0?0xa8eaff:0x4f8bcc,.48,.018));
    }
    const lensGlow=sphere(2.35,basic(0x367db4,{transparent:true,opacity:.08,side:THREE.BackSide,depthWrite:false}));
    const light=new THREE.PointLight(0xff9a48,36,28,1.2);add(light,[0,.3,0]);
    state={disk,shadow,horizon,photon,dust,sparks,arcs,lensGlow,light};
    view([15,10,19],[0,0,0]);
  }

  function buildSupernova(p){
    starfield(1800,78);
    const coreMat=material(0xffc16b,{emissive:0xff6a13,emissiveIntensity:3.8,roughness:.28});
    const core=sphere(1.15,coreMat,[0,0,0],root,56);
    const corona=sphere(1.38,basic(0xff9138,{transparent:true,opacity:.22,side:THREE.BackSide,depthWrite:false}),[0,0,0],root,42);
    const flash=sphere(1,basic(0xffffff,{transparent:true,opacity:0,depthWrite:false}),[0,0,0],root,40);
    const shock1=new THREE.Mesh(new THREE.SphereGeometry(1,36,28),new THREE.MeshBasicMaterial({color:0xffa34f,wireframe:true,transparent:true,opacity:0,depthWrite:false}));add(shock1);
    const shock2=new THREE.Mesh(new THREE.TorusGeometry(1,.045,8,120),new THREE.MeshBasicMaterial({color:0x9adfff,transparent:true,opacity:0,depthWrite:false}));shock2.rotation.x=Math.PI/2;add(shock2);
    const light=new THREE.PointLight(0xffa24b,8,50,1.5);add(light);
    const dirs=[],base=[];
    const count=Math.round(950*clamp(p.debris||1,.5,1.8));
    const positions=new Float32Array(count*3);
    for(let i=0;i<count;i++){
      const u=rand(-1,1),a=rand(0,Math.PI*2),k=Math.sqrt(1-u*u);
      const d=vec(k*Math.cos(a),u,k*Math.sin(a)).normalize();
      dirs.push(d);base.push(rand(.5,1.6));positions[i*3]=d.x*.08;positions[i*3+1]=d.y*.08;positions[i*3+2]=d.z*.08;
    }
    const debris=pointsObject(Array.from(positions),0xffcf98,.07,.0);
    const cloudPos=[];
    for(let i=0;i<900;i++){const d=vec(rand(-1,1),rand(-1,1),rand(-1,1)).normalize().multiplyScalar(rand(2,11));cloudPos.push(d.x,d.y,d.z);}
    const nebula=pointsObject(cloudPos,0x8c9fff,.11,0,root);
    state={core,corona,flash,shock1,shock2,light,dirs,base,debris,nebula,phase:"Yulduz barqaror"};
    view([18,12,22],[0,0,0]);
  }

  function buildVolcano(p){
    makeGround(0x28352b,42);
    const cone=new THREE.Mesh(new THREE.ConeGeometry(7.3,8.6,96,32,false),material(0x4d3b31,{roughness:1}));
    cone.position.y=4.15;add(cone);
    const skirt=new THREE.Mesh(new THREE.ConeGeometry(9.4,3.5,96,10),material(0x3c4032,{roughness:1}));
    skirt.position.y=1.45;add(skirt);
    const crater=new THREE.Mesh(new THREE.CylinderGeometry(1.2,1.85,.42,64,1,true),material(0x171d1b,{color:0x171d1b,emissive:0x641d08,emissiveIntensity:.7,side:THREE.DoubleSide}));
    crater.position.y=7.9;add(crater);
    const rim=new THREE.Mesh(new THREE.TorusGeometry(1.45,.19,12,96),material(0xff7a24,{color:0xff7a24,emissive:0xff4300,emissiveIntensity:2.2}));
    rim.rotation.x=Math.PI/2;rim.position.y=8.02;add(rim);
    const lavaMat=material(0xff5d18,{color:0xff7428,emissive:0xe83300,emissiveIntensity:2.5,roughness:.3});
    const lavaStreams=[];
    for(let j=0;j<4;j++){
      const a=j*Math.PI/2+.3,points=[];
      for(let k=0;k<=14;k++){const f=k/14,r=1.3+f*5.3;points.push(vec(Math.cos(a)*r,7.8-f*6.4+Math.sin(f*10+j)*.16,Math.sin(a)*r));}
      const curve=new THREE.CatmullRomCurve3(points);
      const tube=new THREE.Mesh(new THREE.TubeGeometry(curve,100,.12+(j%2)*.035,9,false),lavaMat);add(tube);lavaStreams.push(tube);
    }
    const smokePos=[];
    const smokeCount=1300;
    const smokeBase=[];
    for(let i=0;i<smokeCount;i++){const a=rand(0,Math.PI*2),r=rand(.1,1.2);smokeBase.push({a,r,y:rand(7.8,16),phase:rand(0,6.28),speed:rand(.4,1.3)});smokePos.push(Math.cos(a)*r,rand(7.8,16),Math.sin(a)*r);}
    const smoke=pointsObject(smokePos,0x99a3a0,.12,.45);
    const emberPos=[],embers=[];
    for(let i=0;i<180;i++){const a=rand(0,Math.PI*2),r=rand(.2,1.1);embers.push({a,r,y:rand(7.8,11),phase:rand(0,6.28),speed:rand(1.4,3)});emberPos.push(Math.cos(a)*r,rand(7.8,11),Math.sin(a)*r);}
    const embersPoints=pointsObject(emberPos,0xff9d38,.07,.85);
    const glow=new THREE.PointLight(0xff4b14,28,24,1.5);glow.position.set(0,7.8,0);add(glow);
    state={cone,crater,rim,lavaStreams,lavaMat,smoke,smokeBase,embersPoints,embers,glow,phase:"Bosim yig‘ilishi"};
    view([17,15,20],[0,4,0]);
  }

  function buildEarthquake(p){
    makeGround(0x263d3b,42);
    const leftPlate=box(16,.5,20,material(0x405b55),[-8,-.28,0]);
    const rightPlate=box(16,.5,20,material(0x53665a),[8,-.28,0]);
    const fault=line([vec(0,.03,-11),vec(0,.03,11)],0xff6b48,.96,.085);
    const city=new THREE.Group();add(city);
    const buildings=[];
    const palette=[0x54718c,0x6c8194,0x9b8b72,0x788d80,0x857a91];
    for(let i=0;i<18;i++){
      const x=rand(-12,12),z=rand(-9,9),w=rand(.8,1.65),d=rand(.8,1.7),h=rand(1.8,6.2);
      if(Math.abs(x)<1.4)continue;
      const g=new THREE.Group();city.add(g);
      const body=box(w,h,d,material(palette[i%palette.length],{roughness:.7}),[x,h/2,z],g);
      const roof=box(w*1.04,.14,d*1.04,material(0x344250),[x,h+.05,z],g);
      const windowMat=basic(i%2?0xb6dcf2:0xf5d89a,{transparent:true,opacity:.78});
      for(let y=.55;y<h-.3;y+=.82)for(let xx=-w/2+.2;xx<w/2-.1;xx+=.42){
        const win=box(.18,.32,.035,windowMat,[x+xx,y,z+d/2+.025],g);
      }
      buildings.push({g,x,h,z,phase:rand(0,6.28),body});
    }
    const rings=[];
    for(let i=0;i<5;i++){
      const ring=new THREE.Mesh(new THREE.TorusGeometry(1,.045,8,110),new THREE.MeshBasicMaterial({color:i%2?0x70d6ff:0xff9b68,transparent:true,opacity:0,depthWrite:false}));
      ring.rotation.x=Math.PI/2;ring.position.set(0,.12+i*.015,0);add(ring);rings.push(ring);
    }
    const faultGlow=sphere(.16,basic(0xff8a62,{transparent:true,opacity:.95}),[0,.1,0],root,18);
    state={leftPlate,rightPlate,fault,buildings,rings,faultGlow,phase:"Tebranish boshlanishi"};
    view([22,19,25],[0,1.4,0]);
  }

  function buildTsunami(p){
    const land=box(40,.7,13,material(0x8c8767,{roughness:1}),[0,-.35,15]);
    const sand=box(40,.12,3,material(0xd3bd87,{roughness:1}),[0,.05,8.2]);
    const waterMat=material(0x0879ae,{color:0x0879ae,emissive:0x00334c,emissiveIntensity:.55,roughness:.22,metalness:.16,transparent:true,opacity:.94});
    const geo=new THREE.PlaneGeometry(40,24,76,48);geo.rotateX(-Math.PI/2);
    const water=new THREE.Mesh(geo,waterMat);water.position.set(0,.1,-4);add(water);
    const pos=geo.attributes.position;
    const buildings=[];
    const colors=[0xe0d0b0,0xe6e3d6,0xb7c6c9,0xdbc6a4];
    for(let i=0;i<9;i++){
      const x=-16+(i%3)*15,z=11+Math.floor(i/3)*3.1,h=rand(2.3,5.8),w=rand(1.3,2.1),d=rand(1.1,1.8);
      const b=box(w,h,d,material(colors[i%colors.length],{roughness:.83}),[x,h/2,z]);
      const roof=box(w*1.06,.14,d*1.06,material(0x465b68),[x,h+.05,z]);
      buildings.push(b);
    }
    const foamPos=new Float32Array(240*3);
    const foamGeo=new THREE.BufferGeometry();foamGeo.setAttribute("position",new THREE.BufferAttribute(foamPos,3));
    const foam=new THREE.Points(foamGeo,new THREE.PointsMaterial({color:0xe9fbff,size:.085,transparent:true,opacity:.9,depthWrite:false}));add(foam);
    const waveLine=new THREE.Line(foamGeo,new THREE.LineBasicMaterial({color:0xc9f7ff,transparent:true,opacity:.78}));
    const light=new THREE.DirectionalLight(0x8bdcff,1.6);light.position.set(-8,12,-10);add(light);
    state={land,sand,water,waterGeo:geo,waterPositions:pos,foam,foamPos,buildings,light,phase:"Ochiq okean"};
    view([19,14,25],[0,1,4]);
  }

  function buildTornado(p){
    makeGround(0x28352e,44);
    const floorRing=new THREE.Mesh(new THREE.TorusGeometry(4.1,.18,12,90),material(0x6b746a,{color:0x77847a,emissive:0x263c3c,emissiveIntensity:.45,transparent:true,opacity:.7}));
    floorRing.rotation.x=Math.PI/2;floorRing.position.y=.08;add(floorRing);
    const cloudGroup=new THREE.Group();add(cloudGroup);
    for(let i=0;i<18;i++){
      const a=i/18*Math.PI*2,r=rand(1.4,3.5),sz=rand(1,2.1);
      const c=sphere(sz,material(i%3?0x66757d:0x849198,{roughness:1}),[Math.cos(a)*r,11+rand(-.6,.8),Math.sin(a)*r],cloudGroup,22);
    }
    const funnelGeo=new THREE.BufferGeometry(),verts=[],indices=[];
    const radial=48,rows=36;
    for(let j=0;j<=rows;j++){
      const v=j/rows,y=v*10,r=.32+Math.pow(v,.82)*3.1;
      for(let i=0;i<=radial;i++){const a=i/radial*Math.PI*2;verts.push(Math.cos(a)*r,y,Math.sin(a)*r);}
    }
    for(let j=0;j<rows;j++)for(let i=0;i<radial;i++){
      const a=j*(radial+1)+i,b=a+radial+1;indices.push(a,b,a+1,b,b+1,a+1);
    }
    funnelGeo.setAttribute("position",new THREE.Float32BufferAttribute(verts,3));funnelGeo.setIndex(indices);funnelGeo.computeVertexNormals();
    const funnel=new THREE.Mesh(funnelGeo,new THREE.MeshStandardMaterial({color:0x8b9ba3,transparent:true,opacity:.36,roughness:1,side:THREE.DoubleSide,depthWrite:false}));funnel.position.y=.5;add(funnel);
    const spirals=[];
    for(let j=0;j<6;j++){
      const pts=[];for(let k=0;k<=100;k++){const v=k/100,y=.7+v*9.6,r=.34+Math.pow(v,.82)*3.1,a=v*Math.PI*8+j*Math.PI/3;pts.push(vec(Math.cos(a)*r,y,Math.sin(a)*r));}
      spirals.push(line(pts,j%2?0x8be1e8:0xc4e4e8,.34,.023));
    }
    const dustBase=[],dustPos=[];
    for(let i=0;i<640;i++){const a=rand(0,Math.PI*2),h=rand(.3,10),r=.3+Math.pow(h/10,.82)*3.2+rand(-.25,.25);dustBase.push({a,h,r,phase:rand(0,6.28),speed:rand(.5,1.5)});dustPos.push(Math.cos(a)*r,h,Math.sin(a)*r);}
    const dust=pointsObject(dustPos,0xc9d7d9,.07,.82);
    const debrisBase=[],debrisPos=[];
    for(let i=0;i<110;i++){const a=rand(0,Math.PI*2),r=rand(3.2,5.2);debrisBase.push({a,r,y:rand(.1,1.1),speed:rand(1,2.5)});debrisPos.push(Math.cos(a)*r,rand(.1,1.1),Math.sin(a)*r);}
    const debris=pointsObject(debrisPos,0xd5a77a,.12,.9);
    state={funnel,cloudGroup,spirals,dust,dustBase,debris,debrisBase,floorRing,phase:"Vortex shakllanmoqda"};
    view([17,13,20],[0,5,0]);
  }

  function buildLightning(p){
    makeGround(0x162923,42);
    const cloudGroup=new THREE.Group();add(cloudGroup);
    for(let i=0;i<24;i++){
      const a=i/24*Math.PI*2,r=rand(1.2,4.3),sz=rand(.9,2.2);
      const c=sphere(sz,material(i%3?0x3b4854:0x55616d,{roughness:1}),[Math.cos(a)*r,rand(8.7,10.6),Math.sin(a)*r],cloudGroup,20);
    }
    const boltMaterials=[],bolts=[];
    function bolt(start,end,depth=9,thickness=.035){
      let points=[start.clone()];
      for(let i=1;i<depth;i++){
        const f=i/depth,base=start.clone().lerp(end,f);
        base.x+=rand(-.55,.55);base.z+=rand(-.4,.4);points.push(base);
      }
      points.push(end.clone());
      const tube=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),depth*4,thickness,5,false),basic(0xcafaff,{transparent:true,opacity:0,depthWrite:false}));
      add(tube);bolts.push(tube);
      return points;
    }
    const main=bolt(vec(-.2,9.0,0),vec(.6,.15,.15),13,.055);
    for(let i=0;i<5;i++){
      const from=main[Math.floor(rand(3,main.length-2))],end=from.clone().add(vec(rand(-2.8,2.8),-rand(1,3),rand(-2,2)));
      bolt(from,end,6,.024);
    }
    const glow=new THREE.PointLight(0xa6eaff,0,52,1.6);glow.position.set(0,4,0);add(glow);
    const flash=sphere(1,basic(0xd6f7ff,{transparent:true,opacity:0,depthWrite:false}),[0,4,0],root,24);flash.scale.set(15,9,15);
    const houses=[];
    for(let i=0;i<6;i++){
      const x=-13+i*5.1,h=rand(1.5,3.2);
      const b=box(rand(1.8,2.8),h,2.3,material(0x33413e),[x,h/2,5]);
      const roof=box(2.9,.16,2.5,material(0x222b2b),[x,h+.06,5]);
      houses.push(b);
    }
    const rods=[];
    for(let i=0;i<7;i++){const x=-15+i*5;const pole=new THREE.Mesh(new THREE.CylinderGeometry(.025,.045,2.7,8),material(0x37494b));pole.position.set(x,1.35,2);add(pole);rods.push(pole);}
    state={cloudGroup,bolts,glow,flash,houses,phase:"Elektr zaryadlari to‘planmoqda"};
    view([17,14,22],[0,4,0]);
  }

  function buildAurora(p){
    starfield(1200,70);
    const earth=sphere(3,material(0x145c88,{color:0x155c8d,emissive:0x062449,emissiveIntensity:.5,roughness:.62,metalness:.12}),[0,0,0],root,64);
    const atmo=sphere(3.22,basic(0x5bbcff,{transparent:true,opacity:.13,side:THREE.BackSide,depthWrite:false}),[0,0,0],root,48);
    const earthGrid=new THREE.Mesh(new THREE.SphereGeometry(3.035,36,24),new THREE.MeshBasicMaterial({color:0x5db6c9,wireframe:true,transparent:true,opacity:.09}));add(earthGrid);
    const colors=[0x49ffc0,0x29d9ef,0x9c85ff,0x7affad];
    const bands=[];
    for(let j=0;j<4;j++){
      const geo=new THREE.PlaneGeometry(15,5,100,18);
      const pos=geo.attributes.position;
      for(let i=0;i<pos.count;i++){
        const x=pos.getX(i),y=pos.getY(i),u=(x+7.5)/15;
        pos.setZ(i,Math.sin(u*8+j*1.6)*.6+Math.cos(y*1.2+j)*.35);
      }
      geo.computeVertexNormals();
      const mat=new THREE.MeshBasicMaterial({color:colors[j],transparent:true,opacity:.22+j*.035,side:THREE.DoubleSide,depthWrite:false});
      const curtain=new THREE.Mesh(geo,mat);curtain.position.set(0,3.6+j*.24,-.5+j*.38);curtain.rotation.x=-.18+j*.1;add(curtain);
      bands.push({curtain,geo,base:Float32Array.from(pos.array),phase:j*1.7});
    }
    const magnetic=[];
    for(let j=0;j<7;j++){
      const pts=[];for(let i=0;i<=90;i++){const a=-Math.PI/2+i/90*Math.PI;const x=Math.sin(a)*(4+j*.35),y=Math.cos(a)*(5+j*.3),z=(j-3)*.2;pts.push(vec(x,y,z));}
      magnetic.push(line(pts,j%2?0x69b8ff:0x8a92ff,.18,.018));
    }
    const particlePos=[];
    for(let i=0;i<650;i++){const a=rand(0,Math.PI*2),r=rand(3.2,6.5);particlePos.push(Math.cos(a)*r,rand(2,7),Math.sin(a)*r);}
    const particles=pointsObject(particlePos,0x76ffd4,.065,.72);
    const sun=new THREE.DirectionalLight(0x8bbcff,2.5);sun.position.set(-13,8,-8);add(sun);
    state={earth,atmo,earthGrid,bands,magnetic,particles,phase:"Quyosh zarralari magnitosferaga kiradi"};
    view([13,8,17],[0,1.5,0]);
  }

  function update(t,p={},dt=0){
    if(!root)return;
    if(active==="solarSystem"){
      state.sun.rotation.y+=dt*.12;
      state.corona1.rotation.y-=dt*.06;state.corona2.rotation.y+=dt*.04;
      state.planets.forEach(b=>{b.pivot.rotation.y=t*b.speed*(p.speed||1);b.globe.rotation.y+=dt*.3;if(b.moonPivot)b.moonPivot.rotation.y=t*1.8*(p.speed||1);if(b.clouds)b.clouds.rotation.y-=dt*.22;});
    }
    if(active==="blackHole"){
      state.disk.rotation.y+=dt*(p.spin||1)*.48;
      state.photon.rotation.z+=dt*.13;
      state.lensGlow.material.opacity=.06+.035*Math.sin(t*1.7);
      state.light.intensity=31+8*Math.sin(t*2.1);
      state.horizon.rotation.y+=dt*.09;
    }
    if(active==="supernova"){
      const collapse=clamp((t-2.4)/1.8,0,1),blast=clamp((t-4.2)/6.2,0,1),neb=clamp((t-8)/10,0,1);
      const pulse=1+.08*Math.sin(t*5);
      const starScale=t<2.4?pulse:t<4.2?1-collapse*.84:Math.max(.13,1-blast*.82);
      state.core.scale.setScalar(starScale);
      state.corona.scale.setScalar(1.2+collapse*.55+blast*.3);
      state.corona.material.opacity=t<4.2?.2:Math.max(.015,.2-blast*.18);
      state.flash.material.opacity=t>4.1&&t<5.4?Math.sin((t-4.1)/1.3*Math.PI)*.94:0;
      state.flash.scale.setScalar(1+blast*8.4);
      state.shock1.scale.setScalar(.7+blast*10);state.shock1.material.opacity=blast>0?Math.max(0,.62-blast*.62):0;
      state.shock2.scale.setScalar(.5+blast*8);state.shock2.material.opacity=blast>0?Math.max(0,.72-blast*.72):0;
      state.light.intensity=t<4?8:t<5.5?100*(1-(t-4)/1.5):Math.max(1,8*(1-blast));
      const attr=state.debris.geometry.attributes.position;
      const distance=Math.max(0,t-4.2)*.82*(p.expansion||1);
      for(let i=0;i<state.dirs.length;i++){const d=state.dirs[i],r=distance*state.base[i];attr.setXYZ(i,d.x*r,d.y*r,d.z*r);}
      attr.needsUpdate=true;state.debris.material.opacity=clamp((t-4)/1.2,0,.92);
      state.nebula.material.opacity=neb*.42;
      if(t<2.4)state.phase="Yulduz barqaror holatda";
      else if(t<4.2)state.phase="Yadro siqilishi";
      else if(t<8)state.phase="Supernova chaqnashi va zarba to‘lqini";
      else state.phase="Kengayayotgan gaz va chang buluti";
    }
    if(active==="volcano"){
      const intensity=p.intensity||1,ash=p.ash||1;
      state.rim.material.emissiveIntensity=1.7+.9*Math.sin(t*3);
      state.lavaMat.emissiveIntensity=1.7+.55*Math.sin(t*2.3);
      state.glow.intensity=22+9*Math.sin(t*2.6);
      const pos=state.smoke.geometry.attributes.position;
      for(let i=0;i<state.smokeBase.length;i++){
        const q=state.smokeBase[i],age=(q.y-7.8)/q.speed+(t*intensity*.8);
        const y=7.8+(age%9.2),r=q.r+y*.12*ash,a=q.a+Math.sin(t*.45+q.phase)*.35;
        pos.setXYZ(i,Math.cos(a)*r,y,Math.sin(a)*r);
      }
      pos.needsUpdate=true;
      const ep=state.embersPoints.geometry.attributes.position;
      for(let i=0;i<state.embers.length;i++){const q=state.embers[i],a=q.a+t*q.speed*.6,y=7.8+((q.y-7.8+t*q.speed*intensity)%4.7),r=q.r+y*.12;ep.setXYZ(i,Math.cos(a)*r,y,Math.sin(a)*r);}
      ep.needsUpdate=true;
      state.phase=t%12<3?"Kraterda bosim va issiqlik ortishi":t%12<7?"Lava va kulning otilishi":"Lava oqimlari yonbag‘ir bo‘ylab tarqalishi";
    }
    if(active==="earthquake"){
      const magnitude=clamp((p.intensity||5)/10,.15,1),cycle=t%12;
      const shake=cycle<7?Math.sin(cycle*9)*magnitude*.12:Math.sin(t*2)*.018;
      state.leftPlate.position.x=-8+Math.max(0,cycle-1)*.025*magnitude;
      state.rightPlate.position.x=8-Math.max(0,cycle-1)*.025*magnitude;
      state.buildings.forEach(b=>{const near=1/(1+Math.abs(b.x)*.1);b.g.rotation.z=Math.sin(t*15+b.phase)*shake*near;b.g.rotation.x=Math.cos(t*13+b.phase)*shake*.65*near;b.g.position.y=Math.abs(Math.sin(t*14+b.phase))*shake*.45;});
      state.rings.forEach((r,i)=>{const age=(cycle-i*1.1+12)%12,scale=.5+age*1.2;r.scale.setScalar(scale);r.material.opacity=age<8?Math.max(0,.72-age*.09):0;});
      state.faultGlow.material.opacity=.35+.5*Math.abs(Math.sin(t*12));
      state.phase=cycle<1.2?"Yer po‘stida siljish boshlanishi":cycle<3.3?"Birlamchi P-to‘lqin tarqalishi":cycle<6.5?"Ikkilamchi S-to‘lqin tarqalishi":"Sirt to‘lqinlari va binolarning tebranishi";
    }
    if(active==="tsunami"){
      const speed=p.speed||1,height=p.height||1,center=-12+((t*1.22*speed)%27);
      const pos=state.waterPositions;
      for(let i=0;i<pos.count;i++){
        const x=pos.getX(i),z=pos.getZ(i),d=(z-center),width=1.65;
        const crest=Math.exp(-(d*d)/(width*width));
        const shoulder=Math.exp(-Math.pow((d-2.1)/3.4,2))*.22;
        const shoal=clamp((z+8)/17,.35,1.7);
        const y=.1+height*shoal*(crest*2.25+shoulder)+.055*Math.sin(x*.55+t*1.4)*Math.exp(-Math.pow(d/6,2));
        pos.setY(i,y);
      }
      pos.needsUpdate=true;state.waterGeo.computeVertexNormals();
      const f=state.foam.geometry.attributes.position;
      for(let i=0;i<240;i++){const x=-19+(i/239)*38,z=center+Math.sin(i*.28+t*2)*.12;const d=0;f.setXYZ(i,x,.16+height*clamp((z+8)/17,.35,1.7)*2.25,z);}
      f.needsUpdate=true;
      state.phase=center<-4?"Chuqur okeanda to‘lqin shakllanishi":center<3?"To‘lqin okean bo‘ylab tarqalmoqda":center<8?"Sohil yaqinida to‘lqin balandlashmoqda":"To‘lqin qirg‘oqqa yetib kelmoqda";
    }
    if(active==="tornado"){
      state.cloudGroup.rotation.y+=dt*.035;
      state.floorRing.rotation.z+=dt*.7;
      state.spirals.forEach((s,i)=>{s.rotation.y+=dt*(.4+i*.08)*(p.wind||1);});
      const pos=state.dust.geometry.attributes.position;
      for(let i=0;i<state.dustBase.length;i++){const q=state.dustBase[i],a=q.a+t*q.speed*(p.wind||1),h=.35+((q.h-.35+t*(.8+q.speed*.3))%9.8),r=.3+Math.pow(h/10,.82)*3.2;pos.setXYZ(i,Math.cos(a)*r,h+.5,Math.sin(a)*r);}
      pos.needsUpdate=true;
      const deb=state.debris.geometry.attributes.position;
      for(let i=0;i<state.debrisBase.length;i++){const q=state.debrisBase[i],a=q.a+t*q.speed*(p.wind||1),r=q.r+Math.sin(t*1.1+i)*.2;deb.setXYZ(i,Math.cos(a)*r,q.y+Math.abs(Math.sin(t+q.a))*1.4,Math.sin(a)*r);}
      deb.needsUpdate=true;
      state.phase="Aylanuvchi havo ustuni va yuqoriga ko‘tarilgan chang";
    }
    if(active==="lightning"){
      const freq=p.frequency||1,period=4.8/freq,phase=t%period;
      const flash=phase<.22?Math.pow(Math.sin(phase/.22*Math.PI),.45):0;
      state.bolts.forEach((b,i)=>{b.material.opacity=flash*(i===0?1:.8);});
      state.glow.intensity=flash*185;
      state.flash.material.opacity=flash*.22;
      state.cloudGroup.children.forEach((c,i)=>{if(c.material&&c.material.emissive)c.material.emissiveIntensity=.05+flash*.6;});
      state.phase=flash>.05?"Atmosferada elektr razryadi":"Bulutlarda zaryadlar ajralishi";
    }
    if(active==="aurora"){
      state.earth.rotation.y+=dt*.08;
      state.atmo.material.opacity=.1+.045*Math.sin(t*1.2);
      state.bands.forEach((b,i)=>{
        const a=b.geo.attributes.position,base=b.base;
        for(let j=0;j<a.count;j++){const x=base[j*3],y=base[j*3+1],u=(x+7.5)/15;a.setZ(j,base[j*3+2]+Math.sin(u*8+t*1.15+b.phase+y*.42)*.72);}
        a.needsUpdate=true;b.curtain.rotation.y=Math.sin(t*.2+b.phase)*.12;
      });
      state.magnetic.forEach((m,i)=>{m.rotation.y+=dt*(i%2?.08:-.06);});
      const pos=state.particles.geometry.attributes.position;
      for(let i=0;i<pos.count;i++){const x=pos.getX(i),z=pos.getZ(i),a=t*.28+i*.008,r=Math.hypot(x,z);pos.setXYZ(i,Math.cos(a)*r,pos.getY(i)+Math.sin(t+i)*.003,Math.sin(a)*r);}
      pos.needsUpdate=true;
      state.phase="Quyosh zarralari va Yer magnitosferasining o‘zaro ta’siri";
    }
  }

  function snapshot(t,p={}){
    const phase=state.phase||"Model ishlayapti";
    const make=(a,b,c)=>({phase,progress:clamp((t%12)/12,0,1),metrics:[[a[0],a[1]],[b[0],b[1]],[c[0],c[1]]]});
    if(active==="solarSystem")return make(["Sayyoralar","8 ta"],["Model tezligi",(p.speed||1).toFixed(1)+"×"],["Quyosh","Faol"]);
    if(active==="blackHole")return make(["Akkretsiya diski","Faol"],["Aylanish",(p.spin||1).toFixed(1)+"×"],["Markaz","Qora tuynuk"]);
    if(active==="supernova"){
      const v=clamp(t/18,0,1);
      return {phase,progress:v,metrics:[["Bosqich",t<2.4?"Barqaror":t<4.2?"Siqilish":t<8?"Chaqnash":"Tumanlik"],["Zarracha",state.dirs.length+" ta"],["Vaqt",t.toFixed(1)+" s"]]};
    }
    if(active==="volcano")return make(["Eruvchan lava","Faol"],["Kul zarralari",state.smokeBase.length+" ta"],["Model intensivligi",(p.intensity||1).toFixed(1)+"×"]);
    if(active==="earthquake")return make(["Model intensivligi",(p.intensity||5)+"/10"],["Shahar binolari",state.buildings.length+" ta"],["To‘lqin",t%12<3.3?"P-to‘lqin":"Sirt to‘lqini"]);
    if(active==="tsunami")return make(["Shartli to‘lqin balandligi",(p.height||1).toFixed(1)+" m"],["Okean to‘lqini","Tarqalmoqda"],["Sohil","Vizual zona"]);
    if(active==="tornado")return make(["Aylanish tezligi",(p.wind||1).toFixed(1)+"×"],["Vortex zarralari",state.dustBase.length+" ta"],["Holat","Faol"]);
    if(active==="lightning")return make(["Razryad chastotasi",(p.frequency||1).toFixed(1)+"×"],["Tarmoqlar",state.bolts.length+" ta"],["Muhit","Momaqaldiroq"]);
    if(active==="aurora")return make(["Aurora qatlamlari",state.bands.length+" ta"],["Magnit chiziqlar",state.magnetic.length+" ta"],["Faollik",(p.activity||1).toFixed(1)+"×"]);
    return make(["3D model","Faol"],["Vaqt",t.toFixed(1)+" s"],["Holat","Tayyor"]);
  }
  return {has:key=>modes.has(key),mount,update,snapshot,modes:[...modes]};
}