import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {LEVEL,CHILD,CLOSET} from './layout.js';

// Photo-based furniture estimates, anchored to the existing room and openings.
export function buildChildRoom(parent,ceilings,{box,cylinder,sphere,mat,mats,colliders}){
 const g=new T.Group();g.name='Детская по фотографиям';parent.add(g);
 const materials=[],textures=[],m=(color,p={})=>{const v=mat(color,p);materials.push(v);return v;};
 const cream=m('#e5dad0'),white=m('#f3efe5'),wood=m('#ac8054'),dark=m('#332825'),metal=m('#a7afb0',{metalness:.65,roughness:.32});
 const pink=m('#d55487'),grey=m('#95999b'),wine=m('#552327',{roughness:.32});
 const add=(name,x,y,z,w,h,d,material,solid=false,wall=false)=>box(wall?parent:g,name,x,LEVEL+y,z,w,h,d,material,solid,wall);
 const round=(name,x,y,z,w,h,d,material,r=.035)=>{const o=new T.Mesh(new RoundedBoxGeometry(w,h,d,3,r),material);o.name=name;o.position.set(x,LEVEL+y,z);o.castShadow=o.receiveShadow=true;g.add(o);return o;};
 const ball=(name,x,y,z,a,b,c,material)=>{const o=sphere(g,x,LEVEL+y,z,a,b,c,material);o.name=name;return o;};
 const cyl=(name,x,y,z,r,h,material)=>{const o=cylinder(g,x,LEVEL+y,z,r,r,h,material);o.name=name;return o;};
 const rod=(name,a,b,r,material,target=g)=>{const p=new T.Vector3(a[0],LEVEL+a[1],a[2]),q=new T.Vector3(b[0],LEVEL+b[1],b[2]);const o=cylinder(target,...p.clone().add(q).multiplyScalar(.5).toArray(),r,r,p.distanceTo(q),material,8);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),q.sub(p).normalize());o.name=name;return o;};
 const solid=(x,z,w,d,h)=>colliders.push({minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2,minY:LEVEL,maxY:LEVEL+h});
 const [x0,z0,x1,z1]=CHILD.bounds,window=CHILD.window,opening=CHILD.closetOpening;
 // Move complete furniture assemblies with their colliders, preserving object sizes.
 const placement=()=>{const start=g.children.length,firstCollider=colliders.length;return(dx,dz)=>{
  for(const part of g.children.slice(start)){part.position.x+=dx;part.position.z+=dz;}
  for(const c of colliders.slice(firstCollider)){c.minX+=dx;c.maxX+=dx;c.minZ+=dz;c.maxZ+=dz;}
 };};
 let seed=72;const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
 const texture=draw=>{const c=document.createElement('canvas');c.width=c.height=512;draw(c.getContext('2d'));const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;textures.push(t);return t;};
 const woodTex=texture(c=>{c.fillStyle='#b29069';c.fillRect(0,0,512,512);for(let i=0;i<700;i++){const y=rand()*512;c.strokeStyle=i%2?'#a28360':'#c7a982';c.lineWidth=.4+rand();c.beginPath();c.moveTo(0,y);c.bezierCurveTo(180,y-8,260,y+10,512,y);c.stroke();}});
 const oak=m('#ffffff',{map:woodTex});
 const loops=texture(c=>{c.fillStyle='#e4dbcd';c.fillRect(0,0,512,512);for(let i=0;i<30;i++){c.strokeStyle=i%2?'#c9bcaa':'#d6c9b7';c.lineWidth=2;const x=rand()*512,y=rand()*512;c.beginPath();c.ellipse(x,y,30+rand()*75,15+rand()*35,rand()*Math.PI,0,Math.PI*2);c.stroke();}});
 const patterned=m('#ffffff',{map:loops});
 add('Узорные обои за кроватью детской',x0+.015,1.35,(z0+z1)/2,.018,2.7,z1-z0,patterned,false,true);
 const door=CHILD.door;
 for(const [a,b]of [[x0,door.at],[door.at+door.width,x1]])add('Обои детской у входа',(a+b)/2,1.35,z1-.012,b-a,2.7,.018,cream,false,true);
 add('Обои детской над дверью',door.at+door.width/2,2.4,z1-.012,door.width,.6,.018,cream,false,true);
 for(const [a,b]of [[z0,opening.at],[opening.at+opening.width,z1]])add('Обои детской у гардеробной',x1-.012,1.35,(a+b)/2,.018,2.7,b-a,cream,false,true);
 add('Обои над гардеробной',x1-.012,2.4,opening.at+opening.width/2,.018,.6,opening.width,cream,false,true);
 for(const [a,b]of [[x0,window.at],[window.at+window.width,x1]])add('Обои детской у окна',(a+b)/2,1.35,z0+.012,b-a,2.7,.018,cream,false,true);
 add('Обои под окном детской',window.at+window.width/2,.45,z0+.012,window.width,.9,.018,cream,false,true);
 add('Обои над окном детской',window.at+window.width/2,2.55,z0+.012,window.width,.3,.018,cream,false,true);
 for(const [x,ranges]of [[x0+.035,[[z0,z1]]],[x1-.035,[[z0,opening.at],[opening.at+opening.width,z1]]]])for(const [a,b]of ranges)add('Плинтус детской',x,.035,(a+b)/2,.025,.07,b-a,grey);

 // Bed: wooden frame and a loose, broad-striped blanket with real folds.
 const placeBed=placement();
 const bedX=.94,bedZ=1.92;
 add('Кровать детской · основание',bedX,.23,bedZ,2.06,.40,1.52,oak,true);
 round('Матрас детской',bedX,.47,bedZ,2.04,.20,1.50,white,.09);
 add('Изголовье детской',-.04,.65,bedZ,.09,.96,1.59,oak);
 const stripe=texture(c=>{c.fillStyle='#d3c8b9';c.fillRect(0,0,512,512);for(let i=0;i<12;i++){c.fillStyle=['#b1aaa0','#ddd3c5','#8e8b88','#ebe1d2'][i%4];c.fillRect(0,i*44,512,22);for(let k=0;k<100;k++){c.strokeStyle='rgba(255,255,255,.13)';const x=rand()*512,y=i*44+rand()*22;c.beginPath();c.moveTo(x,y);c.lineTo(x+2,y+7);c.stroke();}}});
 const blanketMat=m('#ffffff',{map:stripe,roughness:1,side:T.DoubleSide});
 const blanketGeo=new T.PlaneGeometry(2.10,1.89,60,54),bp=blanketGeo.attributes.position;
 for(let i=0;i<bp.count;i++){const x=bp.getX(i),z=bp.getY(i),edge=Math.max(0,Math.abs(z)-.66);bp.setXYZ(i,x,.62-edge*1.35+.028*Math.sin(z*32+x*3)+.014*Math.cos(x*21-z*12),z);}
 blanketGeo.computeVertexNormals();const blanket=new T.Mesh(blanketGeo,blanketMat);blanket.name='Полосатое покрывало детской';blanket.position.set(bedX,LEVEL,bedZ);blanket.castShadow=blanket.receiveShadow=true;g.add(blanket);
 for(const z of [bedZ-.36,bedZ+.36])round('Подушка кровати детской',.19,.63,z,.48,.15,.65,cream,.065);
 add('Тёмная тумба детской',.16,.29,.87,.53,.55,.42,dark,true);
 for(const y of [.16,.39]){add('Ящик тумбы детской',.435,y,.87,.02,.20,.37,dark);add('Ручка тумбы детской',.455,y,.87,.025,.014,.12,metal);}
 for(const y of [.07,.38,.67])cyl('Круглая прикроватная полка',.17,y,2.91,.23,.03,oak);
 for(const z of [2.76,3.06])rod('Опора круглой тумбы',[.17,.07,z],[.17,.67,z],.022,dark);
 solid(.17,2.91,.46,.46,.70);
 // Three small cat illustrations above the headboard, without personal photos.
 const catArt=texture(c=>{c.fillStyle='#e9ddc4';c.fillRect(0,0,512,512);for(const [x,col]of [[170,'#9b8c79'],[330,'#b1a38e']]){c.fillStyle=col;c.beginPath();c.ellipse(x,340,77,104,0,0,7);c.fill();c.beginPath();c.arc(x,215,63,0,7);c.fill();c.beginPath();c.moveTo(x-58,192);c.lineTo(x-58,123);c.lineTo(x-15,170);c.lineTo(x+20,168);c.lineTo(x+58,124);c.lineTo(x+59,198);c.fill();c.fillStyle='#313132';for(const d of [-22,22]){c.beginPath();c.arc(x+d,211,6,0,7);c.fill();}}});
 const art=m('#ffffff',{map:catArt});
 for(const z of [1.12,1.89,2.66]){add('Рамка с котами детской',-.125,1.62,z,.035,.38,.35,dark);add('Иллюстрация котов',-.102,1.62,z,.008,.33,.30,art);}
 placeBed(x0+.18,z0-.69*.75);

 // Corner wardrobe behind the sofa: diagonal mirror front between two oak sides.
 const placeCabinet=placement();
 const cabinet=new T.Shape();cabinet.moveTo(-.13,3.34);cabinet.lineTo(.38,3.34);cabinet.lineTo(.80,3.76);cabinet.lineTo(.80,4.16);cabinet.lineTo(-.13,4.16);cabinet.closePath();
 const cg=new T.ExtrudeGeometry(cabinet,{depth:2.20,bevelEnabled:false});cg.rotateX(Math.PI/2);const co=new T.Mesh(cg,oak);co.position.y=LEVEL+2.23;co.name='Угловой шкаф детской';co.castShadow=true;g.add(co);solid(.33,3.75,.94,.82,2.23);
 const mirrorMat=m('#aab8b4',{metalness:.35,roughness:.17});
 const mirror=add('Зеркальная дверь углового шкафа',.583,1.15,3.533,.54,2.10,.015,mirrorMat);mirror.rotation.y=-Math.PI/4;
 placeCabinet(x0+.18,z1-4.2);
 // Sofa faces into the room, leaving the hall doorway on its right clear.
 const placeSofa=placement();
 round('Диван детской · основание',1.95,.25,3.72,2.08,.38,.80,wine,.07);
 round('Диван детской · спинка',1.95,.68,4.04,1.98,.72,.18,wine,.06);
 for(const x of [.94,2.96])round('Деревянный подлокотник дивана',x,.56,3.73,.14,.62,.86,wine,.06);
 const woven=texture(c=>{c.fillStyle='#b0afa7';c.fillRect(0,0,512,512);for(let i=0;i<512;i+=4){c.fillStyle=i%16?'#b9b9b0':'#969991';c.fillRect(0,i,512,1);}for(let i=0;i<512;i+=64){c.fillStyle='#d0cec0';c.fillRect(i,0,3,512);}});
 const sofaCloth=m('#ffffff',{map:woven,roughness:1});
 round('Серое покрывало дивана',1.95,.48,3.69,1.86,.13,.74,sofaCloth);
 round('Покрывало спинки дивана',1.95,.76,3.94,1.85,.48,.13,sofaCloth);
 for(const x of [1.25,2.64]){round('Светлая подушка дивана',x,.79,3.85,.42,.43,.17,white);const p=round('Серая пушистая подушка дивана',x,.77,3.74,.39,.39,.16,m('#a5aeb6'));p.rotation.x=-.15;}
 solid(1.95,3.72,2.20,.92,1.06);
 // Recognisable pink flamingo plush on the backrest.
 ball('Розовый фламинго · тело',1.95,1.06,3.98,.28,.12,.14,pink);
 rod('Фламинго · шея',[1.75,1.07,3.98],[1.29,1.10,3.98],.045,pink);
 ball('Фламинго · голова',1.25,1.11,3.98,.07,.055,.055,pink);
 ball('Фламинго · клюв',1.16,1.10,3.98,.055,.03,.034,m('#dbb13c'));
 ball('Кончик клюва',1.12,1.10,3.98,.026,.032,.033,dark);
 for(const x of [2.10,2.18])rod('Фламинго · лапа',[x,1.05,3.98],[x+.29,1.02,3.94],.015,pink);
 placeSofa(x0+.18,z1-4.2);

 // Desk and pink adjustable child's chair beside the dressing-room entrance.
 const placeDesk=placement();
 add('Стол детской · столешница',4.70,.77,1.25,.67,.065,1.39,oak,true);
 for(const z of [.61,1.89])add('Ножка стола детской',4.70,.38,z,.62,.73,.075,oak);
 add('Белая тумба стола',4.70,.39,.84,.56,.67,.42,white,true);
 for(let i=0;i<3;i++){add('Фасад ящика стола',4.405,.19+i*.21,.84,.02,.19,.39,white);add('Ручка ящика стола',4.38,.19+i*.21,.84,.025,.065,.055,cream);}
 solid(4.70,1.25,.70,1.43,.82);
 const chairStart=g.children.length;
 round('Розовое сиденье кресла',4.03,.48,1.25,.46,.12,.49,pink,.08);
 for(const z of [1.11,1.39])round('Розовая половинка спинки кресла',3.84,.86,z,.12,.47,.24,pink,.075);
 rod('Стойка спинки кресла',[3.78,.19,1.25],[3.78,1.08,1.25],.026,metal);
 cyl('Опора кресла детской',4.03,.23,1.25,.045,.43,metal);
 for(const z of [.99,1.51]){rod('Основание кресла',[3.77,.07,z],[4.25,.07,z],.027,white);for(const x of [3.77,4.25])ball('Колесо кресла',x,.055,z,.045,.045,.028,grey);}
 for(const part of g.children.slice(chairStart))part.position.x+=.22;
 solid(4.23,1.25,.58,.61,1.10);
 cyl('Основание настольной лампы',4.67,.825,1.60,.10,.025,metal);
 rod('Стойка настольной лампы',[4.67,.84,1.60],[4.88,1.25,1.60],.013,metal);rod('Плечо настольной лампы',[4.88,1.25,1.60],[4.53,1.28,1.60],.013,metal);
 const shade=cylinder(g,4.51,LEVEL+1.24,1.60,.04,.085,.12,metal);shade.name='Плафон настольной лампы';
 const bookM=[m('#c68886'),m('#bbb7aa'),m('#6b828c'),m('#d4ba86')];
 for(let i=0;i<6;i++)add('Книги на столе',4.88,.94,.65+i*.035,.17,.27+(i%3)*.02,.028,bookM[i%4]);
 cyl('Карандашница',4.60,.88,1.78,.035,.14,white);for(let i=0;i<5;i++)rod('Карандаш',[4.60+i*.008,.88,1.78],[4.59+i*.008,1.04,1.78],.003,bookM[i%4]);
 // Television has a quiet illustrative menu, without recreating private content.
 const screen=texture(c=>{c.fillStyle='#172232';c.fillRect(0,0,512,512);for(let row=0;row<3;row++)for(let col=0;col<4;col++){c.fillStyle=['#345b75','#3b4764','#49667b','#5d536b'][(row+col)%4];c.fillRect(20+col*122,45+row*133,104,95);}c.fillStyle='#95b9cd';c.fillRect(20,17,180,8);});
 add('Настенная пластина кронштейна телевизора',5.046,1.63,1.48,.024,.23,.16,dark);
 rod('Плечо кронштейна телевизора',[5.027,1.63,1.48],[4.87,1.63,1.58],.023,dark);
 rod('Поворотное плечо кронштейна телевизора',[4.87,1.63,1.58],[4.85,1.63,1.48],.023,dark);
 add('Крепление кронштейна к телевизору',4.856,1.63,1.48,.025,.26,.25,dark);
 add('Телевизор детской',4.80,1.63,1.48,.085,.58,.97,dark);
 add('Экран телевизора детской',4.753,1.63,1.48,.008,.52,.90,m('#ffffff',{map:screen,emissive:'#425c75',emissiveIntensity:.16}));
 placeDesk(x1-5.08,z0-.69*.45);
 add('Узкое зеркало у входной двери детской',x1-.43,1.31,z1-.037,.26,.89,.025,white);add('Полотно узкого зеркала',x1-.43,1.31,z1-.055,.21,.83,.008,mirrorMat);
 // Keyboard on a black X stand, at the window side of the bed.
 const placeKeyboard=placement();
 add('Синтезатор детской',.61,.77,.40,1.03,.075,.29,white);
 for(let i=0;i<28;i++)add('Белая клавиша синтезатора',.13+i*.034,.815,.465,.031,.015,.14,white);
 for(let i=0;i<27;i++)if(![2,6].includes(i%7))add('Чёрная клавиша синтезатора',.15+i*.034,.83,.415,.018,.023,.085,dark);
 for(const z of [.32,.51]){rod('Крестовина стойки синтезатора',[.19,.04,z],[.99,.73,z],.018,dark);rod('Крестовина стойки синтезатора',[.99,.04,z],[.19,.73,z],.018,dark);}
 solid(.61,.40,1.08,.36,.84);
 rod('Пюпитр',[.38,.82,.30],[.40,1.02,.22],.009,white);rod('Пюпитр',[.84,.82,.30],[.82,1.02,.22],.009,white);rod('Пюпитр',[.40,1.02,.22],[.82,1.02,.22],.009,white);
 placeKeyboard(x0+.18,z0);

 // Textile textures and folds, with no loose clutter on the furniture.
 const fur=texture(c=>{c.fillStyle='#a3a5a4';c.fillRect(0,0,512,512);for(let i=0;i<22000;i++){const x=rand()*512,y=rand()*512;c.strokeStyle=['#babbb7','#777c7e','#d1d1ca','#999c9a'][i%4];c.lineWidth=.6;c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+3,y+5,x+rand()*10-5,y+9);c.stroke();}});
 const rugTex=fur.clone();rugTex.needsUpdate=true;rugTex.wrapS=rugTex.wrapT=T.RepeatWrapping;rugTex.repeat.set(3,3);textures.push(rugTex);
 round('Большой серый ковёр детской',2.87+x0+.18,.044,(z0+z1)/2,2.46,.05,z1-z0-.70,m('#ffffff',{map:rugTex,roughness:1}),.02);
 function curtain(name,x,width,material){const geo=new T.PlaneGeometry(width,2.57,48,1),p=geo.attributes.position;for(let i=0;i<p.count;i++)p.setZ(i,.055*Math.cos((p.getX(i)/width+.5)*Math.PI*18));const o=new T.Mesh(geo,material);o.name=name;o.position.set(x,LEVEL+1.37,z0+.14);o.castShadow=true;o.userData.pickThrough=material.transparent;g.add(o);}
 const drape=m('#5c574e',{side:T.DoubleSide,roughness:1});
 const wc=window.at+window.width/2;
 curtain('Левая плотная штора детской',window.at-.23,.65,drape);curtain('Правая плотная штора детской',window.at+window.width+.15,.44,drape);
 curtain('Белый тюль детской',wc,window.width+.10,m('#ffffff',{transparent:true,opacity:.28,side:T.DoubleSide,depthWrite:false}));
 rod('Карниз детской',[window.at-.57,2.67,z0+.13],[x1-.02,2.67,z0+.13],.016,white);
 for(let i=0;i<11;i++)round('Секция радиатора детской',wc-.40+i*.08,.40,z0+.09,.073,.54,.14,white,.01);
 add('Подоконник детской',wc,.87,z0-.04,window.width+.10,.05,.40,white);

 // Printed hot-air-balloon pendant. Counter-wound ribs form real diamond holes.
 const lamp=new T.Group();lamp.name='Лампа детской · воздушный шар';ceilings.add(lamp);
 const lx=(x0+x1)/2,lz=(z0+z1)/2,base=1.96;
 const pearl=m('#fff6df',{roughness:.30,metalness:.10,emissive:'#fff0ce',emissiveIntensity:.12});
 const gold=m('#b98b27',{metalness:.62,roughness:.34});
 const profile=t=>{const points=[[0,.075],[.12,.095],[.32,.17],[.56,.235],[.76,.215],[.91,.135],[1,.012]];for(let i=1;i<points.length;i++)if(t<=points[i][0]){const [a,r]=points[i-1],[b,s]=points[i];const f=(t-a)/(b-a);return r+(s-r)*(f*f*(3-2*f));}return .012;};
 for(const winding of [-1,1])for(let i=0;i<18;i++){
  const points=[];for(let j=0;j<=56;j++){const t=j/56,r=profile(t),a=i/18*Math.PI*2+winding*t*Math.PI*.78;points.push(new T.Vector3(lx+r*Math.cos(a),LEVEL+base+t*.56,lz+r*Math.sin(a)));}
  const rib=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),56,.0033,5,false),pearl);rib.name='Ажурное ребро воздушного шара';lamp.add(rib);
 }
 const ring=(name,y,r,material)=>{const o=new T.Mesh(new T.TorusGeometry(r,.006,6,48),material);o.rotation.x=Math.PI/2;o.position.set(lx,LEVEL+y,lz);o.name=name;lamp.add(o);};
 ring('Нижний обод воздушного шара',base,.075,pearl);
 rod('Подвес воздушного шара',[lx,2.70,lz],[lx,base+.56,lz],.006,white,lamp);
 const bulb=new T.Mesh(new T.SphereGeometry(.065,16,12),m('#fff9e5',{emissive:'#fff2d3',emissiveIntensity:1.2}));bulb.position.set(lx,LEVEL+base+.24,lz);bulb.name='Лампочка внутри воздушного шара';lamp.add(bulb);
 const basket=cylinder(lamp,lx,LEVEL+1.73,lz,.067,.061,.105,gold,32);basket.name='Золотистая корзинка воздушного шара';ring('Верх корзинки',1.785,.067,gold);
 for(let i=0;i<8;i++){const a=i/8*Math.PI*2,b=a+.5;rod('Верёвка корзинки',[lx+.064*Math.cos(a),1.785,lz+.064*Math.sin(a)],[lx+.075*Math.cos(b),base,lz+.075*Math.sin(b)],.0025,white,lamp);}
 for(let i=0;i<14;i++)ring('Плетение корзинки',1.68+i*.007,.066,gold);
 const glow=new T.PointLight('#ffe9c1',.35,4,2);glow.position.copy(bulb.position);lamp.add(glow);

 // Looking toward -Z from the entrance: storage on the left, ironing on the right.
 // buildHouse reflects X, so the storage wall is the HIGH source-X wall.
 const closet=new T.Group();closet.name='Гардеробная при детской';parent.add(closet);
 const closetStart=g.children.length;
 const closetColliderStart=colliders.length;
 const ashTex=texture(c=>{c.fillStyle='#d7d0c0';c.fillRect(0,0,512,512);for(let i=0;i<650;i++){const y=rand()*512;c.strokeStyle=i%2?'#c6bfaf':'#e2ddcf';c.lineWidth=.6;c.beginPath();c.moveTo(0,y);c.bezierCurveTo(170,y-5,350,y+6,512,y);c.stroke();}});
 const ash=m('#ffffff',{map:ashTex}),fabric=m('#d0b9b0'),shelfDark=m('#353333');
 // Low chest and its landscape mirror, closest to the entrance end.
 add('Комод гардеробной',7.01,.52,3.57,.62,1.04,1.08,ash);
 for(let i=0;i<4;i++){
  add('Фасад комода гардеробной',6.687,.15+i*.245,3.57,.026,.229,1.05,ash);
  rod('Ручка комода гардеробной',[6.658,.15+i*.245,3.32],[6.658,.15+i*.245,3.82],.009,metal);
 }
 add('Рама зеркала над комодом гардеробной',7.27,1.40,3.57,.035,.68,1.02,white);
 add('Зеркало над комодом гардеробной',7.246,1.40,3.57,.009,.61,.95,mirrorMat);
 solid(7.01,3.57,.69,1.10,1.07);
 // Three columns of fabric cubbies above drawers and open bottom compartments.
 add('Задняя стенка шкафа гардеробной',7.315,1.12,2.25,.025,2.20,1.44,ash);
 for(const y of [.05,.43,.91,1.34,1.77,2.20])add('Полка гардеробной',7.05,y,2.25,.56,.027,1.44,ash);
 for(const z of [1.53,2.01,2.49,2.97])add('Перегородка стеллажа гардеробной',7.05,1.13,z,.56,2.18,.025,ash);
 for(let col=0;col<3;col++){
  const z=1.77+col*.48;
  for(let row=0;row<3;row++){
   add('Короб для хранения',7.03,1.115+row*.43,z,.47,.37,.42,fabric);
   add('Ручка короба',6.789,1.23+row*.43,z,.008,.025,.12,cream);
  }
  for(let row=0;row<2;row++){
   add('Ящик шкафа гардеробной',7.02,.55+row*.23,z,.48,.21,.43,ash);
   rod('Ручка ящика шкафа',[6.755,.55+row*.23,z-.15],[6.755,.55+row*.23,z+.15],.008,metal);
  }
  round('Верхняя корзина гардеробной',7.05,2.36,z,.46,.29,.42,white,.025);
 }
 solid(7.05,2.25,.62,1.46,2.52);
 // Open rail continues along the same wall toward the rear bookcase.
 add('Верхняя полка над одеждой',7.04,2.18,.97,.58,.035,1.06,ash);
 rod('Штанга одежды гардеробной',[7.02,1.93,.47],[7.02,1.93,1.47],.016,metal);
 const coats=[m('#e0d8ca'),m('#44474a'),m('#c36b3e'),m('#6b7c87')];
 for(let i=0;i<9;i++){
  const z=.51+i*.105,h=.90+(i%3)*.15;
  rod('Плечики одежды',[6.81,1.79,z],[7.02,1.90,z],.007,dark);
  rod('Плечики одежды',[7.02,1.90,z],[7.22,1.79,z],.007,dark);
  round('Одежда на штанге',7.02,1.78-h/2,z,.41,h,.07,coats[i%4],.025);
 }
 solid(7.04,.97,.60,1.08,2.21);
 // Open black bookcase on the far short wall, with books and storage baskets.
 add('Задний стеллаж гардеробной',6.23,.95,.065,1.16,1.86,.035,shelfDark);
 for(const x of [5.65,6.81])add('Боковина заднего стеллажа',x,.95,.23,.025,1.86,.36,shelfDark);
 for(const y of [.07,.45,.85,1.25,1.65,1.88])add('Полка заднего стеллажа',6.23,y,.23,1.18,.028,.36,shelfDark);
 for(let row=0;row<2;row++)for(let i=0;i<9;i++)add('Книги гардеробной',6.72-i*.047,.64+row*.40,.24,.036,.32,.23,bookM[(i+row)%4]);
 for(const y of [.25,.65,1.05,1.45])round('Корзина заднего стеллажа',5.94,y,.24,.43,.32,.30,fabric,.018);
 solid(6.23,.23,1.20,.40,1.90);
 // Ironing board sits opposite the cabinets; leave the side entry and aisle open.
 round('Гладильная доска',5.51,.83,1.95,.40,.045,1.22,m('#7ab5b3'),.09);
 for(const x of [5.37,5.65]){
  rod('Ножка гладильной доски',[x,.03,1.47],[x,.81,2.40],.015,dark);
  rod('Ножка гладильной доски',[x,.03,2.40],[x,.81,1.47],.015,dark);
 }
 solid(5.51,1.95,.43,1.27,.88);
 round('Подошва утюга',5.51,.88,2.22,.13,.025,.23,metal,.025);
 round('Утюг на гладильной доске',5.51,1.00,2.22,.11,.22,.18,dark,.04);
 rod('Ручка утюга',[5.51,1.04,2.29],[5.51,1.12,2.19],.021,dark);
 // Drying rack and fan along the same side, farther from the entrance.
 for(const x of [5.34,5.85]){
  rod('Опора сушилки',[x,.04,.61],[x,.88,1.28],.012,metal);
  rod('Опора сушилки',[x,.04,1.28],[x,.88,.61],.012,metal);
  rod('Рама сушилки',[x,.88,.61],[x,.88,1.28],.010,metal);
 }
 for(let i=0;i<9;i++)rod('Струна сушилки',[5.34,.88,.61+i*.083],[5.85,.88,.61+i*.083],.003,metal);
 solid(5.595,.945,.54,.70,.91);
 cyl('Основание вентилятора гардеробной',5.44,.04,.35,.15,.06,dark);
 rod('Стойка вентилятора гардеробной',[5.44,.07,.35],[5.44,1.02,.35],.019,dark);
 const fan=new T.Mesh(new T.TorusGeometry(.16,.009,6,32),dark);fan.name='Решётка вентилятора гардеробной';fan.position.set(5.44,LEVEL+1.16,.35);g.add(fan);
 for(let i=0;i<12;i++){const a=i*Math.PI/6;rod('Спица вентилятора',[5.44,1.16,.35],[5.44+.16*Math.cos(a),1.16+.16*Math.sin(a),.35],.003,metal);}
 ball('Мотор вентилятора',5.44,1.16,.35,.05,.05,.065,dark);
 add('Зеркало на торцевой стене гардеробной',6.23,1.48,4.175,.43,.73,.012,mirrorMat);
 // Helpers use the children's room group; collect closet meshes in their own group.
 for(const part of g.children.slice(closetStart))closet.add(part);
 // Closet furniture is still estimated from photos; fit its complete storage run
 // to the measured footprint without reversing its established handedness.
 const [cx0,cz0,cx1,cz1]=CLOSET.bounds,sx=(cx1-cx0)/2.12,sz=(cz1-cz0)/4.2;
 closet.scale.set(sx,1,sz);closet.position.set(cx0-5.23*sx,0,cz0);
 for(const c of colliders.slice(closetColliderStart)){
  c.minX=cx0+(c.minX-5.23)*sx;c.maxX=cx0+(c.maxX-5.23)*sx;
  c.minZ=cz0+c.minZ*sz;c.maxZ=cz0+c.maxZ*sz;
 }
 return()=>{materials.forEach(v=>v.dispose());textures.forEach(v=>v.dispose());};
}
