import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {HALL,BATHROOM,EXTERIOR_THICKNESS} from './layout.js';

// Furniture sizes are estimated from the three photographs, inside the existing plan.
export function buildBathroom(parent,ceilings,{box,cylinder,sphere,mat,colliders,pickables}){
 const g=new T.Group();g.name='Ванная первого этажа по фотографиям';parent.add(g);
 const [x0,z0,x1,z1]=BATHROOM.bounds,w=BATHROOM.window;
 const materials=[],textures=[];
 const m=(color,props={})=>{const v=mat(color,props);materials.push(v);return v;};
 const white=m('#f3f3ef',{roughness:.25}),black=m('#24282a'),rubber=m('#171c1e'),wood=m('#b77943'),chrome=m('#b6c1c5',{metalness:.8,roughness:.22});
 const glass=m('#39484d',{roughness:.15,metalness:.35}),blue=m('#149dc8'),green=m('#74a092'),purple=m('#704880');
 const add=(name,x,y,z,w,h,d,material,solid=false,wall=false)=>box(g,name,x,y,z,w,h,d,material,solid,wall);
 const round=(name,x,y,z,w,h,d,material,r=.025)=>{const o=new T.Mesh(new RoundedBoxGeometry(w,h,d,3,r),material);o.name=name;o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;g.add(o);return o;};
 const solid=(x,z,w,d,h)=>colliders.push({minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2,minY:0,maxY:h});
 const tube=(name,points,r,material)=>{const path=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));const o=new T.Mesh(new T.TubeGeometry(path,32,r,8,false),material);o.name=name;o.castShadow=true;g.add(o);return o;};
 const ring=(name,x,y,z,r,t,material,axis='x')=>{const o=new T.Mesh(new T.TorusGeometry(r,t,12,48),material);o.name=name;o.position.set(x,y,z);if(axis==='x')o.rotation.y=Math.PI/2;else if(axis==='y')o.rotation.x=Math.PI/2;g.add(o);return o;};
 const rod=(name,a,b,r,material)=>{const p=new T.Vector3(...a),q=new T.Vector3(...b),o=cylinder(g,...p.clone().add(q).multiplyScalar(.5).toArray(),r,r,p.distanceTo(q),material);o.name=name;o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),q.sub(p).normalize());return o;};
 const hose=(name,points)=>{
  const path=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),geo=new T.TubeGeometry(path,360,.009,8,false),positions=geo.attributes.position;
  for(let i=0;i<=360;i++){const center=path.getPointAt(i/360);for(let j=0;j<=8;j++){const n=i*9+j,v=new T.Vector3().fromBufferAttribute(positions,n).sub(center).multiplyScalar(i%2?1.13:.92).add(center);positions.setXYZ(n,v.x,v.y,v.z);}}
  geo.computeVertexNormals();const o=new T.Mesh(geo,chrome);o.name=name;o.castShadow=true;g.add(o);return o;
 };
 const canvas=(draw)=>{const c=document.createElement('canvas');c.width=c.height=512;draw(c.getContext('2d'));const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=4;textures.push(t);return t;};
 const waffle=canvas(c=>{c.fillStyle='#a1a1a1';c.fillRect(0,0,512,512);for(let y=0;y<512;y+=32)for(let x=0;x<512;x+=32){c.fillStyle='#535353';c.fillRect(x+5,y+5,22,22);c.fillStyle='#cecece';c.fillRect(x,y,32,4);c.fillRect(x,y,4,32);}});
 waffle.colorSpace=T.NoColorSpace;
 function cloth(name,x,top,z,width,height,color){
  const geometry=new T.PlaneGeometry(width,height,24,40),p=geometry.attributes.position;
  for(let i=0;i<p.count;i++){const u=p.getX(i)/width,v=.5-p.getY(i)/height;
   p.setXYZ(i,x+u*width*(.28+.72*Math.sin(v*Math.PI/2))+.025*Math.sin(v*8),top-v*height+.03*Math.sin(u*8+v*6)*v,z+.028*Math.sin(u*15+v*7)+.016*Math.sin(v*13));
  }geometry.computeVertexNormals();
  const o=new T.Mesh(geometry,m(color,{side:T.DoubleSide,roughness:1,bumpMap:waffle,bumpScale:.005}));o.name=name;o.castShadow=o.receiveShadow=true;g.add(o);return o;
 }
 let seed=41;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const marble=canvas(c=>{
  c.fillStyle='#494f53';c.fillRect(0,0,512,512);
  for(let i=0;i<3600;i++){const v=50+rand()*65;c.fillStyle=`rgba(${v},${v+3},${v+5},.14)`;c.fillRect(rand()*512,rand()*512,2+rand()*30,2+rand()*10);}
  for(let i=0;i<19;i++){const a=rand()*700-100;c.beginPath();c.moveTo(a,0);for(let y=0;y<=540;y+=22)c.lineTo(a-y*.6+Math.sin(y*.034+i)*8+rand()*8,y);c.strokeStyle=i%3?'rgba(211,216,211,.32)':'rgba(238,237,224,.65)';c.lineWidth=i%3?1:2;c.stroke();}
  c.strokeStyle='#777976';c.lineWidth=3;c.strokeRect(0,0,512,512);
 });marble.repeat.set((x1-x0)/.60,(z1-z0)/.60);
 const floor=add('Тёмная мраморная плитка ванной',(x0+x1)/2,.014,(z0+z1)/2,x1-x0,.02,z1-z0,m('#ffffff',{map:marble,roughness:.42}));floor.userData.roomId='room-4';pickables.push(floor);
 const board=canvas(c=>{
  c.fillStyle='#8ab3a6';c.fillRect(0,0,512,512);
  for(let i=0;i<3500;i++){c.fillStyle=rand()>.5?'rgba(235,241,225,.035)':'rgba(43,82,76,.025)';c.fillRect(rand()*512,rand()*512,3,3);}
  c.strokeStyle='#6e958a';c.lineWidth=1;c.strokeRect(1,1,510,510);
  c.fillStyle='#536f66';for(let y=20;y<512;y+=65)for(const x of [8,504]){c.beginPath();c.arc(x,y,1.3,0,Math.PI*2);c.fill();}
 });board.repeat.set(1,1.25);
 const wallMat=m('#ffffff',{map:board,roughness:1});
 for(const [a,b]of [[z0,w.at],[w.at+w.width,z1]])add('Зелёная стена за ванной',x0+.012,1.5,(a+b)/2,.018,3,b-a,wallMat,false,true);
 add('Зелёная стена под окном',x0+.012,w.bottom/2,w.at+w.width/2,.018,w.bottom,w.width,wallMat,false,true);
 add('Зелёная стена над окном',x0+.012,(w.top+3)/2,w.at+w.width/2,.018,3-w.top,w.width,wallMat,false,true);
 // Measured bathroom end is 25 cm inward of the old provisional partition.
 add('Стена за встроенной инсталляцией',(x0+x1)/2,1.5,(z1+HALL.bounds[3])/2,x1-x0,3,HALL.bounds[3]-z1,wallMat,true,true);
 const windowZ=w.at+w.width/2,depth=EXTERIOR_THICKNESS;
 add('Подоконник ванной',x0-depth/2+.065,w.bottom-.025,windowZ,depth+.13,.045,w.width+.10,white);
 for(const z of [w.at+.01,w.at+w.width-.01])add('Откос окна ванной',x0-depth/2,(w.bottom+w.top)/2,z,depth,w.top-w.bottom,.02,white,false,true);
 add('Верхний откос окна ванной',x0-depth/2,w.top-.01,windowZ,depth,.02,w.width,white,false,true);
 add('Основание ручки окна ванной',x0-depth/2+.051,1.48,w.at+w.width-.07,.014,.095,.025,white);
 rod('Ручка окна ванной',[x0-depth/2+.076,1.49,w.at+w.width-.07],[x0-depth/2+.076,1.40,w.at+w.width-.07],.009,white);
 for(let i=0;i<7;i++)round('Секция радиатора ванной',x0+.10,.43,windowZ-.30+i*.10,.16,.49,.082,white,.012);
 for(const y of [.22,.64])rod('Коллектор радиатора',[x0+.10,y,windowZ-.35],[x0+.10,y,windowZ+.35],.023,white);
 tube('Труба радиатора',[[x0+.09,.14,windowZ+.40],[x0+.09,.69,windowZ+.40],[x0+.09,.69,windowZ+.31]],.009,chrome);
 add('Вентиль радиатора',x0+.13,.65,windowZ+.40,.045,.025,.06,m('#9e4038'));
 for(const z of [z0+.012,z1-.012])add('Зелёный торец ванной',(x0+x1)/2,1.5,z,x1-x0,3,.018,wallMat,false,true);
 const opening=HALL.bathroom;
 for(const [a,b]of [[z0,opening.at],[opening.at+opening.width,z1]])add('Зелёная стена у входа',x1-.012,1.5,(a+b)/2,.018,3,b-a,wallMat,false,true);
 add('Зелёная стена над дверью',x1-.012,2.55,opening.at+opening.width/2,.018,.9,opening.width,wallMat,false,true);

 // Successive rounded rings make a genuine hollow basin, including its bottom.
 function basin(name,x,z,levels,material,power=.34){
  const positions=[],indices=[],n=64;
  for(const [w,d,y] of levels)for(let i=0;i<n;i++){const a=i/n*Math.PI*2,cs=Math.cos(a),sn=Math.sin(a);positions.push(x+w*Math.sign(cs)*Math.abs(cs)**power,y,z+d*Math.sign(sn)*Math.abs(sn)**power);}
  for(let j=0;j<levels.length-1;j++)for(let i=0;i<n;i++){const a=j*n+i,b=j*n+(i+1)%n;indices.push(a,b,a+n,b,b+n,a+n);}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setIndex(indices);geo.computeVertexNormals();
  const mesh=new T.Mesh(geo,material);mesh.name=name;mesh.castShadow=mesh.receiveShadow=true;g.add(mesh);return mesh;
 }
 const porcelain=m('#f7f6f0',{roughness:.2,side:T.DoubleSide}),shell=m('#22282a',{roughness:.55,side:T.DoubleSide});
 const bx=x0+.39,bz=z0+.81;
 basin('Чёрная наружная чаша ванны',bx,bz,[[.27,.62,.16],[.34,.72,.56],[.365,.75,.58]],shell);
 basin('Белая ванна · бортик и углубление',bx,bz,[[.365,.75,.58],[.365,.75,.605],[.295,.665,.605],[.27,.61,.52],[.21,.50,.22],[.001,.001,.22]],porcelain);
 solid(bx,bz,.73,1.50,.61);
 cylinder(g,bx,.225,bz-.45,.031,.031,.004,chrome).name='Слив ванны';
 for(let i=0;i<6;i++){const a=i*Math.PI/3;cylinder(g,bx+Math.cos(a)*.019,.228,bz-.45+Math.sin(a)*.019,.006,.006,.004,black,10);}
 tube('Ручка ванны',[[bx+.30,.55,bz-.16],[bx+.26,.50,bz-.12],[bx+.26,.50,bz+.12],[bx+.30,.55,bz+.16]],.012,chrome);
 const faucetZ=z0+.07;
 rod('Белый корпус смесителя ванны',[bx-.15,.89,faucetZ+.075],[bx+.15,.89,faucetZ+.075],.033,white);
 for(const x of [bx-.155,bx+.155])rod('Хромированный торец смесителя',[x-.005,.89,faucetZ+.075],[x+.005,.89,faucetZ+.075],.034,chrome);
 cylinder(g,bx,.943,faucetZ+.075,.029,.029,.11,white);
 round('Рычаг смесителя ванны',bx,1.008,faucetZ+.10,.058,.021,.095,chrome,.012);
 tube('Длинный белый излив',[[bx,.845,faucetZ+.08],[bx,.80,faucetZ+.15],[bx,.78,faucetZ+.42]],.017,white);
 cylinder(g,bx,.763,faucetZ+.42,.02,.02,.018,chrome);
 cylinder(g,bx,.862,faucetZ+.135,.014,.014,.035,chrome).name='Переключатель душа';
 rod('Ручка душевой лейки',[bx-.13,.935,faucetZ+.025],[bx+.10,.97,faucetZ+.025],.013,chrome);
 const shower=sphere(g,bx+.17,.99,faucetZ+.03,.078,.012,.059,chrome);shower.name='Круглая душевая лейка';
 sphere(g,bx+.17,1.001,faucetZ+.03,.072,.004,.054,white);
 for(let i=0;i<24;i++){const a=i*2.4,r=.012+.046*Math.sqrt(i/24);sphere(g,bx+.17+Math.cos(a)*r,1.006,faucetZ+.03+Math.sin(a)*r*.7,.002,.002,.002,rubber);}
 hose('Гофрированный шланг ванны',[[bx,.835,faucetZ+.09],[bx+.12,.37,faucetZ+.30],[bx+.02,.25,faucetZ+.49],[bx-.14,.37,faucetZ+.36],[bx-.17,.92,faucetZ+.025]]);
 const overflow=cylinder(g,bx,.48,bz-.627,.028,.028,.005,chrome);overflow.rotation.x=Math.PI/2;overflow.name='Перелив ванны';
 tube('Цепочка пробки ванны',[[bx,.46,bz-.70],[bx+.16,.30,bz-.65],[bx+.26,.27,bz-.44]],.0025,chrome);
 sphere(g,bx-.23,.617,bz-.69,.075,.016,.06,white).name='Мыльница';
 round('Мыло',bx-.23,.638,bz-.69,.09,.026,.052,m('#d5aa50'),.012);

 // Toilet faces the bath, with the cistern hidden in the green wall boxing.
 const tx=x0+.61,tz=z1-.38;
 round('Опора подвесного унитаза',tx,.25,tz+.07,.30,.34,.32,white,.10);
 basin('Открытая чаша унитаза',tx,tz-.03,[[.12,.17,.23],[.20,.265,.39],[.205,.27,.44],[.15,.21,.44],[.125,.16,.31],[.001,.001,.30]],porcelain,1);
 const lid=sphere(g,tx,.68,tz+.21,.205,.27,.027,white);lid.name='Поднятая крышка унитаза';lid.rotation.x=-.10;
 solid(tx,tz,.43,.55,.48);
 add('Панель смыва заподлицо со стеной',tx,1.12,z1-.025,.25,.24,.008,chrome);
 ring('Круглая кнопка смыва',tx,1.12,z1-.031,.057,.004,chrome,'z');
 cylinder(g,tx,1.12,z1-.034,.049,.049,.006,chrome).rotation.x=Math.PI/2;
 // Recessed cistern: only a hairline access-panel outline, no protruding box.
 const seam=m('#62877b');for(const x of [tx-.32,tx+.32])add('Шов встроенной инсталляции',x,.66,z1-.023,.003,1.31,.003,seam);
 add('Шов встроенной инсталляции',tx,1.315,z1-.023,.64,.003,.003,seam);
 const tapX=tx-.34,tapZ=z1-.075;
 for(const x of [tapX-.085,tapX+.085])rod('Розетка крана унитаза',[x,.72,z1-.025],[x,.72,tapZ],.038,chrome);
 rod('Кран у унитаза',[tapX-.085,.72,tapZ],[tapX+.085,.72,tapZ],.018,chrome);
 cylinder(g,tapX-.085,.675,tapZ-.027,.014,.014,.08,chrome);
 rod('Рычаг крана унитаза',[tapX-.10,.70,tapZ-.03],[tapX-.10,.61,tapZ-.05],.006,chrome);
 rod('Ручная лейка крана',[tapX+.085,.72,tapZ-.035],[tapX+.085,.855,tapZ-.045],.013,chrome);
 rod('Носик ручной лейки',[tapX+.055,.86,tapZ-.045],[tapX+.115,.86,tapZ-.045],.018,chrome);
 hose('Шланг крана унитаза',[[tapX-.085,.65,tapZ-.027],[tapX+.05,.23,tz-.15],[tapX+.15,.039,tz-.40],[tapX-.12,.045,tz-.47],[tapX-.15,.21,tz-.21],[tapX+.085,.71,tapZ-.035]]);
 // White paper holder with a shelf and aerosol, on the window wall.
 add('Полочка туалетной бумаги',x0+.13,.99,z1-.39,.24,.017,.25,white);
 add('Основание держателя бумаги',x0+.026,.895,z1-.39,.022,.20,.24,white);
 rod('Ось рулона',[x0+.12,.83,z1-.49],[x0+.12,.83,z1-.29],.012,white);
 const roll=cylinder(g,x0+.12,.83,z1-.39,.064,.064,.12,white);roll.rotation.x=Math.PI/2;
 add('Край туалетной бумаги',x0+.174,.755,z1-.39,.005,.095,.12,white);
 cylinder(g,x0+.12,1.115,z1-.39,.028,.028,.23,white);
 cylinder(g,x0+.12,1.263,z1-.39,.029,.029,.067,purple);
 cylinder(g,tx+.39,.20,tz-.08,.12,.095,.36,black);ring('Ободок корзины',tx+.39,.39,tz-.08,.105,.014,rubber,'y');

 // Two front-loading appliances, fronts toward the centre aisle. Tops stay clear.
 for(const [i,z]of [6.20,6.89].entries()){
  const x=x1-.32,face=x-.305;
  round(i?'Вторая стиральная машина':'Стиральная машина',x,.44,z,.59,.84,.60,i?m('#c9cecb'):white,.025);solid(x,z,.60,.60,.86);
  add('Панель управления стиральной машины',face-.006,.745,z,.018,.14,.56,white);
  add('Дисплей стиральной машины',face-.018,.76,z+.10,.006,.039,.11,glass);
  const knob=cylinder(g,face-.03,.755,z-.14,.028,.028,.022,chrome);knob.rotation.z=Math.PI/2;
  add('Лоток стиральной машины',face-.021,.79,z-.02,.008,.035,.10,white);
  for(let j=0;j<3;j++){const b=cylinder(g,face-.022,.72,z+.04+j*.045,.006,.006,.008,rubber,12);b.rotation.z=Math.PI/2;}
  const drum=cylinder(g,face-.008,.43,z,.205,.205,.025,glass,48);drum.rotation.z=Math.PI/2;
  ring('Резиновая манжета люка',face-.025,.43,z,.199,.023,rubber);
  ring('Белый ободок люка',face-.048,.43,z,.217,.028,i?chrome:white);
  const window=cylinder(g,face-.046,.43,z,.174,.174,.012,glass,48);window.rotation.z=Math.PI/2;
  round('Ручка люка стиральной машины',face-.073,.44,z+.187,.04,.105,.034,white,.012);
  add('Цоколь стиральной машины',face-.008,.09,z,.01,.09,.54,white);
 }

 // Open wooden household shelving with a restrained set of bottles and baskets.
 const sx=x0+.23,sz=w.at-.28;
 for(const x of [sx-.19,sx+.19])for(const z of [sz-.23,sz+.23])add('Стойка деревянного стеллажа',x,1.02,z,.036,2.02,.036,wood);
 for(const y of [.10,.48,.87,1.26,1.65,2.01])add('Полка деревянного стеллажа',sx,y,sz,.42,.035,.50,wood);
 solid(sx,sz,.43,.52,2.04);
 const bottleMats=[m('#e3e5cf'),m('#3a9e72'),m('#32a2b7'),m('#ededdf'),m('#c6bd86')];
 function bottle(x,y,z,index){const h=.14+(index%3)*.045,r=.025+(index%2)*.007;const b=cylinder(g,x,y+h/2,z,r*.8,r,h,bottleMats[index%5],16);b.name='Бытовая химия на стеллаже';cylinder(g,x,y+h+.014,z,r*.45,r*.45,.028,white,12);}
 for(const [j,y] of [.13,.90,1.68].entries())for(let i=0;i<5;i++)bottle(sx+.09,y,sz-.18+i*.09,i+j);
 for(const y of [.50,1.28]){add('Корзина на стеллаже',sx,y+.065,sz,.32,.13,.43,y<1?green:wood);for(let i=0;i<3;i++)bottle(sx+.03,y+.13,sz-.15+i*.14,i+1);}
 add('Рама зеркала за стеллажом',x0+.036,1.59,sz,.035,.85,.56,white);
 add('Зеркало за стеллажом',x0+.057,1.59,sz,.008,.78,.49,m('#a8bbb6',{metalness:.92,roughness:.07}));

 // Small mirror, towel, blue trolley and laundry basket at the bath end.
 add('Зеркало у ванны',1.46,1.61,z0+.031,.32,.58,.018,m('#93aaa5',{metalness:.9,roughness:.08}));
 for(const x of [1.31,1.61])for(const y of [1.34,1.88])add('Уголок зеркала',x,y,z0+.045,.027,.046,.014,black);
 add('Полочка под зеркалом',1.46,1.29,z0+.07,.34,.018,.12,white);
 add('Белая планка для полотенец',1.04,1.72,z0+.045,.38,.032,.018,white);
 for(const x of [.88,1.04,1.20])tube('Крючок для полотенца',[[x,1.71,z0+.045],[x,1.70,z0+.075],[x,1.765,z0+.088]],.009,white);
 cloth('Длинное вафельное полотенце',1.04,1.69,z0+.092,.24,.82,'#505564');
 cloth('Короткое серое полотенце',.88,1.74,z0+.10,.20,.47,'#555856');
 tube('Петля полотенца',[[1.015,1.65,z0+.092],[1.04,1.76,z0+.095],[1.06,1.65,z0+.092]],.004,white);
 for(const y of [.14,.39,.64])add('Синяя полка тележки',1.46,y,z0+.22,.38,.036,.34,blue);
 for(const x of [1.29,1.63])for(const z of [z0+.07,z0+.37])add('Ножка тележки',x,.35,z,.022,.68,.022,chrome);
 for(let i=0;i<3;i++)bottle(1.37+i*.09,.66,z0+.22,i);
 solid(1.46,z0+.22,.38,.36,.85);
 round('Корзина для белья',1.98,.29,z0+.25,.40,.54,.39,black,.05);solid(1.98,z0+.25,.40,.39,.56);
 add('Крышка корзины для белья',1.98,.575,z0+.25,.41,.035,.40,rubber);
 tube('Швабра',[[2.04,.55,z0+.24],[2.13,1.26,z0+.08]],.013,blue);

 // Wall-mounted stick vacuum and floor canister vacuum beside the machines.
 const vx=x1-.12,vz=5.71;
 round('Корпус вертикального пылесоса',vx,1.46,vz,.16,.29,.19,white,.055);
 round('Прозрачный контейнер пылесоса',vx-.075,1.40,vz,.065,.17,.13,glass,.018);
 tube('Ручка вертикального пылесоса',[[vx,1.58,vz-.06],[vx,1.69,vz-.07],[vx,1.72,vz+.06],[vx,1.58,vz+.08]],.017,white);
 cylinder(g,vx,.86,vz,.018,.018,.93,white);add('Красная кнопка пылесоса',vx-.092,1.53,vz,.012,.03,.034,m('#93383c'));
 round('Щётка вертикального пылесоса',vx-.02,.09,vz,.20,.11,.24,white,.025);
 const cvx=x1-.27,cvz=5.57;
 solid(cvx,cvz,.42,.40,1.10);
 sphere(g,cvx,.22,cvz,.18,.21,.19,chrome);cylinder(g,cvx,.34,cvz,.15,.17,.12,black);
 for(const z of [cvz-.18,cvz+.18]){const wheel=cylinder(g,cvx,.11,z,.085,.085,.04,rubber);wheel.rotation.x=Math.PI/2;}
 tube('Шланг напольного пылесоса',[[cvx-.08,.33,cvz],[cvx-.26,.46,cvz-.16],[cvx-.30,.78,cvz-.07],[cvx-.14,1.10,cvz-.02],[cvx-.10,.85,cvz-.01]],.025,black);
 tube('Труба напольного пылесоса',[[cvx-.10,.92,cvz-.01],[cvx-.03,.13,cvz-.19]],.018,black);
 round('Щётка напольного пылесоса',cvx-.03,.065,cvz-.19,.23,.075,.13,black,.018);
 // One low basin contains two tall nested buckets, as seen beside the bath.
 const bucketX=x0+.61,bucketZ=5.95,basinMat=m('#729b98',{side:T.DoubleSide}),bucketGreen=m('#a7b887',{side:T.DoubleSide}),bucketPurple=m('#783b85',{side:T.DoubleSide});
 basin('Таз под двумя вёдрами',bucketX,bucketZ,[[.155,.155,.035],[.21,.21,.18],[.195,.195,.18],[.145,.145,.049],[.001,.001,.049]],basinMat,1);
 ring('Светлый ободок таза',bucketX,.18,bucketZ,.202,.008,white,'y');
 for(const [i,bottom,top,r,material]of [[0,.07,.365,.168,bucketGreen],[1,.20,.46,.149,bucketPurple]]){
  basin(i?'Фиолетовое ведро внутри зелёного':'Зелёное ведро в тазу',bucketX,bucketZ,[[r*.74,r*.74,bottom],[r,r,top],[r-.009,r-.009,top],[r*.74-.009,r*.74-.009,bottom+.012],[.001,.001,bottom+.012]],material,1);
  ring('Ободок ведра',bucketX,top,bucketZ,r,.007,i?bucketPurple:white,'y');
  tube('Опущенная ручка ведра',[[bucketX-r,top-.03,bucketZ],[bucketX-r*.85,top-.12,bucketZ+.10],[bucketX,top-.17,bucketZ+.14],[bucketX+r*.85,top-.12,bucketZ+.10],[bucketX+r,top-.03,bucketZ]],.006,white);
 }
 cloth('Ткань в верхнем ведре',bucketX+.035,.51,bucketZ+.13,.25,.28,'#713d83');
 solid(bucketX,bucketZ,.42,.42,.47);

 const fixture=new T.Group();fixture.name='Линейный светильник ванной';ceilings.add(fixture);
 box(fixture,'Основание светильника ванной',1.44,2.974,5.99,.065,.035,1.18,white);
 box(fixture,'Рассеиватель светильника ванной',1.44,2.949,5.99,.044,.025,1.14,m('#f3f4e8',{emissive:'#fff5df',emissiveIntensity:.6}));
 fixture.traverse(o=>{if(o.isMesh){o.userData.deviceId='bathroom-light';o.userData.channelId='bathroom';pickables.push(o);}});
 return ()=>{materials.forEach(v=>v.dispose());textures.forEach(t=>t.dispose());};
}
