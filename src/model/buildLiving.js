import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {LIVING as L} from './layout.js';

// Photo-based furniture estimates, inside the measured 6.72 × 3.76 m room.
export function buildLiving(parent,ceilings,{box,cylinder,mat,mats,colliders,pickables,deviceMeshes}) {
 const g=new T.Group();g.name='Кухня-гостиная по фотографиям';parent.add(g);
 const materials=[],textures=[];
 const material=(color,props={})=>{const m=mat(color,props);materials.push(m);return m;};
 const red=material('#c92317',{roughness:.30}),white=material('#f0efeb',{roughness:.32});
 const black=material('#25272b'),chrome=material('#b6bfc0',{metalness:.85,roughness:.20});
 const fabric=material('#555258',{roughness:.95}),cream=material('#d0cbc0'),glass=material('#ebedf0',{transparent:true,opacity:.48,roughness:.13,depthWrite:false});
 const add=(name,x,y,z,w,h,d,m,solid=false)=>box(g,name,x,y,z,w,h,d,m,solid);
 const round=(p,name,x,y,z,w,h,d,r,m)=>{const mesh=new T.Mesh(new RoundedBoxGeometry(w,h,d,3,r),m);mesh.name=name;mesh.position.set(x,y,z);mesh.castShadow=mesh.receiveShadow=true;p.add(mesh);return mesh;};
 function rod(p,name,points,r,m){const curve=new T.CatmullRomCurve3(points.map(v=>new T.Vector3(...v))),mesh=new T.Mesh(new T.TubeGeometry(curve,24,r,8,false),m);mesh.name=name;mesh.castShadow=true;p.add(mesh);return mesh;}
 function canvas(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;textures.push(t);return t;}
 function device(group,id){group.userData.deviceId=id;group.traverse(o=>{if(o.isMesh){o.userData.deviceId=id;pickables.push(o);}});deviceMeshes[id]=group;}
 // Red lower cabinets, white upper cabinets with the continuous red band.
 // Rear run faces +X. Its return, against the hall wall, faces -Z.
 function run(name,x,z,length,angle,upper=false){
  const y=upper?1.94:.46,h=upper?1.05:.80,depth=upper?.34:.59;
  const local=new T.Group();local.name=name;local.position.set(x,0,z);local.rotation.y=angle;g.add(local);
  const b=(label,xx,yy,zz,w,hh,d,m)=>box(local,label,xx,yy,zz,w,hh,d,m);
  b(name+' · корпус',0,y,0,length,h,depth,white);
  const count=Math.max(1,Math.round(length/.55)),cell=length/count;
  for(let i=0;i<count;i++){
   const xx=-length/2+cell*(i+.5);
   if(upper){
    for(const yy of [y-.255,y+.285])b('Белый фасад кухни',xx,yy,depth/2+.013,cell-.012,.48,.025,white);
    b('Красная полоса кухни',xx,y+.025,depth/2+.028,cell-.010,.08,.015,red);
    for(const yy of [y-.46,y+.08])b('Ручка верхнего шкафа',xx,yy,depth/2+.046,cell*.58,.012,.019,chrome);
   } else {
    b('Красный фасад кухни',xx,y,depth/2+.013,cell-.012,h-.02,.025,red);
    b('Ручка нижнего шкафа',xx+cell*.32,y+.21,depth/2+.045,.014,.20,.024,chrome);
   }
  }
  if(!upper){
   b('Светлая столешница кухни',0,.885,.012,length+.025,.035,depth+.055,white);
   b('Цоколь кухни',0,.055,-.025,length-.025,.09,depth-.08,white);
  }
  const w=Math.abs(Math.cos(angle))*length+Math.abs(Math.sin(angle))*depth,d=Math.abs(Math.sin(angle))*length+Math.abs(Math.cos(angle))*depth;
  colliders.push({minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2,minY:y-h/2,maxY:y+h/2});
 }
 const back=L.x0,side=L.z1;
 // Fridge sits at the rear/window corner, then the hob/oven and corner units.
 run('Кухня · задний ряд',back+.30,2.66,2.64,Math.PI/2);
 run('Кухня · боковой ряд',1.95,side-.30,1.86,Math.PI);
 run('Кухня · верхний задний ряд',back+.175,2.66,2.64,Math.PI/2,true);
 run('Кухня · верхний боковой шкаф',1.61,side-.175,.65,Math.PI,true);
 add('Духовой шкаф',back+.619,.47,2.12,.042,.64,.56,black);
 add('Стекло духовки',back+.644,.44,2.12,.012,.39,.44,material('#152026',{roughness:.16}));
 add('Ручка духовки',back+.676,.715,2.12,.038,.023,.42,chrome);
 for(const zz of [1.97,2.27]){const k=cylinder(g,back+.651,.75,zz,.026,.026,.018,black);k.rotation.z=Math.PI/2;}
 add('Варочная поверхность',back+.31,.909,2.12,.51,.018,.56,black);
 for(const xx of [back+.17,back+.43])for(const zz of [1.97,2.27]){const ring=new T.Mesh(new T.TorusGeometry(.078,.003,5,32),chrome);ring.rotation.x=Math.PI/2;ring.position.set(xx,.920,zz);ring.name='Конфорка';g.add(ring);}
 // Dark sink with a raised rim makes the basin readable without clutter.
 add('Чёрная мойка',1.50,.907,side-.29,.54,.022,.40,black);
 add('Дно мойки',1.50,.917,side-.29,.43,.01,.29,material('#111619'));
 for(const x of [1.235,1.765])add('Борт мойки',x,.930,side-.29,.018,.04,.40,chrome);
 for(const z of [side-.485,side-.095])add('Борт мойки',1.50,.930,z,.53,.04,.018,chrome);
 rod(g,'Смеситель',[[1.51,.92,side-.09],[1.51,1.20,side-.09],[1.51,1.22,side-.27],[1.51,1.13,side-.28]],.013,chrome);
 const kettle=new T.Group();kettle.name='Умный чайник';kettle.position.set(back+.32,.903,3.15);g.add(kettle);
 cylinder(kettle,0,.013,0,.096,.096,.026,black,48);
 cylinder(kettle,0,.143,0,.082,.092,.235,material('#c5c8c7',{metalness:.72,roughness:.25}),48);
 cylinder(kettle,0,.263,0,.077,.083,.019,black,48);
 round(kettle,'Чайник · ручка крышки',0,.283,0,.043,.028,.035,.008,black);
 rod(kettle,'Чайник · ручка',[[-.068,.238,0],[-.143,.23,0],[-.16,.11,0],[-.082,.059,0]],.016,black);
 const spout=new T.Mesh(new T.CylinderGeometry(.035,.046,.085,32,1,true),chrome);spout.name='Чайник · носик';spout.position.set(.09,.224,0);spout.rotation.z=-.65;kettle.add(spout);
 round(kettle,'Чайник · кнопка',-.1,.07,0,.043,.015,.029,.004,black);
 device(kettle,'living-kettle');
 // Two columns of drawers on the return, matching the photo.
 for(const x of [2.12,2.62])for(const y of [.25,.54,.77]){
  add('Красный ящик кухни',x,y,side-.616,.47,y===.77?.17:.27,.022,red);
  add('Ручка ящика кухни',x,y+.06,side-.637,.30,.014,.021,chrome);
 }
 add('Полка микроволновки',2.33,1.65,side-.20,.61,.025,.40,white);
 add('Микроволновая печь',2.33,1.82,side-.23,.55,.32,.38,white);
 add('Микроволновка · стекло',2.25,1.82,side-.425,.36,.25,.012,black);
 for(const yy of [1.75,1.81,1.87])add('Микроволновка · кнопка',2.53,yy,side-.431,.026,.023,.008,black);
 const fridgeX=back+.38,fridgeZ=L.z0+.57;
 add('Двухдверный холодильник',fridgeX,.94,fridgeZ,.73,1.88,.91,black,true);
 for(const zz of [fridgeZ-.223,fridgeZ+.223]){
  add('Холодильник · дверь',fridgeX+.374,.95,zz,.025,1.82,.435,material('#3c4245',{metalness:.45,roughness:.26}));
  add('Холодильник · вертикальная ручка',fridgeX+.412,1.05,zz+(zz<fridgeZ?.15:-.15),.032,.68,.023,chrome);
 }
 add('Холодильник · дисплей',fridgeX+.393,1.40,fridgeZ-.21,.010,.17,.12,black);
 // Sofa on the corridor partition, facing the long window wall.
 const sofaX=5.88,sofaZ=side-.51;
 add('Диван · основание',sofaX,.25,sofaZ,2.06,.34,.88,fabric,true);
 add('Диван · светлая полоса',sofaX,.26,sofaZ-.456,2.01,.055,.014,cream);
 for(const dx of [-.66,0,.66]){
  round(g,'Диван · подушка сиденья',sofaX+dx,.48,sofaZ-.07,.655,.19,.70,.07,fabric);
  const backrest=round(g,'Диван · подушка спинки',sofaX+dx,.79,sofaZ+.32,.65,.60,.19,.07,fabric);backrest.rotation.x=-.09;
  for(const seam of [-.24,.24])add('Диван · шов обивки',sofaX+dx+seam,.585,sofaZ-.09,.002,.001,.50,cream);
 }
 for(const dx of [-1.055,1.055])round(g,'Диван · подлокотник',sofaX+dx,.55,sofaZ,.15,.52,.88,.035,fabric);
 for(const x of [4.97,6.79])for(const z of [sofaZ-.32,sofaZ+.31])cylinder(g,x,.065,z,.025,.025,.13,chrome);
 for(const [dx,color] of [[-.86,red],[-.58,cream],[.66,cream],[.94,red]]){
  const p=round(g,'Декоративная подушка дивана',sofaX+dx,.73,sofaZ+.09,.34,.35,.12,.045,color);p.rotation.z=dx*.18;p.rotation.x=-.17;
 }
 // Side tables and carpet, without bags, boxes or scattered household items.
 add('Столик рядом с диваном',4.68,.66,sofaZ,.30,.035,.79,black,true);
 for(const x of [4.57,4.79])for(const z of [sofaZ-.34,sofaZ+.34])cylinder(g,x,.32,z,.012,.012,.64,chrome);
 add('Нижняя полка столика',4.68,.08,sofaZ,.30,.028,.79,black);
 add('Столик у фронтального окна',6.83,.60,2.21,.46,.035,.40,mats.wood);
 for(const x of [6.65,7.01])add('Ножка столика',x,.30,2.21,.023,.60,.34,black);
 const rugMap=canvas(512,256,(c,w,h)=>{let seed=73;for(let y=0;y<h;y+=2)for(let x=0;x<w;x+=2){seed=(seed*1664525+1013904223)>>>0;const edge=Math.min(x/w,1-x/w,y/h,1-y/h),v=Math.round((edge<.07?35:180)+(seed/4294967296)*65);c.fillStyle=`rgb(${v},${v},${Math.max(0,v-4)})`;c.fillRect(x,y,2,2);}});
 add('Ковёр гостиной',5.38,.007,1.97,2.45,.014,2.22,material('#ffffff',{map:rugMap,roughness:1}));
 // Dark sideboard below the left-wall window, with a corner TV stand.
 add('Тумба телевизора',5.35,.50,L.z0+.32,2.14,.94,.59,black,true);
 for(const x of [4.54,6.15]){
  add('Тумба ТВ · дверца',x,.50,L.z0+.63,.49,.86,.025,black);
  add('Тумба ТВ · ручка',x,.81,L.z0+.653,.10,.023,.018,chrome);
 }
 for(let i=0;i<5;i++){
  const y=.14+i*.176;add('Тумба ТВ · ящик',5.35,y,L.z0+.634,.80,.165,.025,black);
  add('Тумба ТВ · ручка',5.35,y+.03,L.z0+.653,.12,.022,.018,chrome);
 }
 add('Угловая тумба ТВ',6.62,.50,L.z0+.43,.42,.94,.78,black,true);
 const tv=new T.Group();tv.name='Телевизор в углу';tv.position.set(6.30,0,L.z0+.52);tv.rotation.y=-.28;g.add(tv);
 round(tv,'Телевизор · рамка',0,1.47,0,1.14,.67,.045,.012,black);
 box(tv,'Телевизор · экран',0,1.47,.025,1.10,.625,.008,material('#17232c',{roughness:.20}));
 for(const x of [-.39,.39])rod(tv,'Телевизор · ножка',[[x,1.15,0],[x-.075,1.00,.13]],.013,black);
 device(tv,'living-tv');
 const alice=new T.Group();alice.name='Алиса 2';alice.position.set(4.47,.97,L.z0+.49);g.add(alice);
 const weave=canvas(128,128,c=>{c.fillStyle='#313238';c.fillRect(0,0,128,128);c.fillStyle='#5b5c62';for(let y=0;y<128;y+=4)for(let x=0;x<128;x+=4)c.fillRect(x+(y%8?1:0),y,1,2);});
 weave.wrapS=weave.wrapT=T.RepeatWrapping;weave.repeat.set(2,3);
 round(alice,'Алиса 2 · тканевый корпус',0,.118,0,.123,.23,.099,.016,material('#ffffff',{map:weave,roughness:1}));
 round(alice,'Алиса 2 · основание',0,.006,0,.116,.012,.093,.008,black);
 round(alice,'Алиса 2 · верхняя световая панель',0,.235,0,.118,.006,.094,.014,material('#9b84b2',{roughness:.42}));
 round(alice,'Алиса 2 · панель управления',0,.239,0,.102,.003,.078,.012,black);
 for(const x of [-.031,0,.031])cylinder(alice,x,.242,0,.006,.006,.001,chrome,16);
 device(alice,'living-speaker');
 // Dining table and five light upholstered chairs beside the kitchen window.
 const tx=2.47,tz=1.19;
 const diningChildStart=g.children.length,diningColliderStart=colliders.length;
 add('Обеденный стол',tx,.77,tz,1.30,.055,.82,white,true);
 for(const dx of [-.57,.57])for(const dz of [-.33,.33])add('Ножка обеденного стола',tx+dx,.38,tz+dz,.055,.76,.055,white);
 for(const dx of [-.32,.32])for(const dz of [-.20,.20])cylinder(g,tx+dx,.802,tz+dz,.165,.165,.004,cream,48);
 function diningChair(x,z,angle){
  const p=new T.Group();p.name='Обеденный стул';p.position.set(x,0,z);p.rotation.y=angle;g.add(p);
  round(p,'Сиденье обеденного стула',0,.46,0,.43,.065,.43,.02,cream);
  const b=round(p,'Спинка обеденного стула',0,.78,.19,.43,.63,.045,.022,cream);b.rotation.x=-.09;
  for(const xx of [-.175,.175])for(const zz of [-.17,.17])rod(p,'Ножка обеденного стула',[[xx,.44,zz],[xx*1.14,.015,zz*1.18]],.013,white);
  colliders.push({minX:x-.23,maxX:x+.23,minZ:z-.23,maxZ:z+.23,minY:0,maxY:1.1});
 }
 for(const dx of [-.32,.32]){diningChair(tx+dx,tz-.63,Math.PI);diningChair(tx+dx,tz+.63,0);}
 diningChair(tx+.89,tz,Math.PI/2);
 // Rotate the entire dining set. The short edge sits 7 cm from the inner wall;
 // the fifth chair stays at the room-facing end, leaving the kitchen aisle clear.
 const parts=g.children.slice(diningChildStart),nearWindowZ=L.z0+.65+.07;
 const dining=new T.Group();dining.name='Обеденная группа у окна';dining.position.set(tx,0,nearWindowZ);dining.rotation.y=-Math.PI/2;g.add(dining);
 for(const part of parts){part.position.sub(new T.Vector3(tx,0,tz));dining.add(part);}
 for(const b of colliders.slice(diningColliderStart)){
  const {minX,maxX,minZ,maxZ}=b;
  Object.assign(b,{minX:tx-(maxZ-tz),maxX:tx-(minZ-tz),minZ:nearWindowZ+(minX-tx),maxZ:nearWindowZ+(maxX-tx)});
 }
 // Open numeral clock above the sofa. Plane coordinates compensate the house mirror.
 const clockTexture=canvas(256,256,c=>{c.clearRect(0,0,256,256);c.fillStyle='#17191b';c.font='bold 34px sans-serif';c.textAlign='center';c.textBaseline='middle';for(const [s,x,y] of [['12',128,25],['3',226,128],['6',128,229],['9',29,128]])c.fillText(s,x,y);});
 const clockMat=new T.MeshBasicMaterial({map:clockTexture,transparent:true,side:T.DoubleSide,depthWrite:false});materials.push(clockMat);
 const face=new T.Mesh(new T.PlaneGeometry(.68,.68),clockMat);face.name='Часы над диваном';face.position.set(5.75,2.08,side-.02);face.rotation.y=Math.PI;face.scale.x=-1;g.add(face);
 const hub=cylinder(g,5.75,2.08,side-.038,.036,.036,.018,black);hub.rotation.x=Math.PI/2;
 rod(g,'Часовая стрелка',[[5.75,2.08,side-.053],[5.93,2.19,side-.053]],.010,black);
 rod(g,'Минутная стрелка',[[5.75,2.08,side-.055],[5.66,2.36,side-.055]],.006,black);
 // Curtains: long sheer panels plus gathered grey drops, matching the three windows.
 const sheer=material('#f1f0e8',{transparent:true,opacity:.16,depthWrite:false,side:T.DoubleSide});
 const drape=material('#74717b',{roughness:1,side:T.DoubleSide});
 function curtain(x,z,width,angle,m,name){
  const geo=new T.PlaneGeometry(width,2.94,Math.max(24,Math.round(width*70)),1),positions=geo.attributes.position;
  for(let i=0;i<positions.count;i++)positions.setZ(i,Math.sin(positions.getX(i)*85)*.027);geo.computeVertexNormals();
  const p=new T.Mesh(geo,m);p.name=name;p.position.set(x,1.51,z);p.rotation.y=angle;p.receiveShadow=true;g.add(p);
 }
 curtain((L.x0+L.x1)/2,L.z0+.09,L.x1-L.x0-.08,0,sheer,'Тюль вдоль двух окон');
 for(const [x,w] of [[L.x0+.16,.30],[3.73,.35],[L.x1-.17,.30]])curtain(x,L.z0+.15,w,0,drape,'Серая портьера левой стены');
 curtain(L.x1-.09,(L.z0+L.z1)/2,L.z1-L.z0-.08,Math.PI/2,sheer,'Тюль фронтального окна');
 for(const z of [L.z0+.19,L.z1-.19])curtain(L.x1-.15,z,.34,Math.PI/2,drape,'Серая портьера фронтальной стены');
 for(const at of L.leftWindows)add('Радиатор под окном гостиной',at+.90,.29,L.z0+.055,1.15,.40,.10,white);
 add('Радиатор фронтального окна',L.x1-.055,.29,L.frontWindow+.90,.10,.40,1.15,white);
 // Two chrome fixtures with eight faceted shades each and twelve perimeter spots.
 const lights=new T.Group();lights.name='Освещение кухни-гостиной';ceilings.add(lights);
 const ceiling=ceilings.getObjectByName('Потолок Гостиная с кухней');if(ceiling)ceiling.material=material('#f7f7f2',{roughness:.16,metalness:.05});
 const lightMat=material('#f3f1df',{emissive:'#f1e9d7',emissiveIntensity:.20});
 const recessed=[];for(let i=0;i<5;i++)for(const z of [L.z0+.38,L.z1-.38])recessed.push([L.x0+.45+i*(L.x1-L.x0-.9)/4,z]);
 recessed.push([L.x0+.42,(L.z0+L.z1)/2],[L.x1-.42,(L.z0+L.z1)/2]);
 for(const [x,z] of recessed){const ring=new T.Mesh(new T.TorusGeometry(.065,.009,8,32),chrome);ring.rotation.x=Math.PI/2;ring.position.set(x,2.985,z);ring.name='Точечный светильник гостиной';lights.add(ring);cylinder(lights,x,2.988,z,.054,.054,.008,lightMat);}
 for(const x of [L.x0+1.66,L.x1-1.66]){
  const z=(L.z0+L.z1)/2;
  cylinder(lights,x,2.945,z,.15,.15,.08,chrome);
  for(const side of [-1,1])for(const sign of [-1,1]){
   rod(lights,'Изогнутая штанга люстры',[[x,2.91,z],[x+side*.28,2.83,z+sign*.16],[x+side*.60,2.83,z+sign*.10]],.009,chrome);
   for(const t of [.50,1]){
    const xx=x+side*.60*t,zz=z+sign*(t===1?.10:.17);
    const shade=round(lights,'Гранёный плафон люстры',xx,2.78,zz,.11,.14,.11,.009,glass);shade.rotation.y=side*.30;
    cylinder(lights,xx,2.77,zz,.025,.025,.073,lightMat,12);
   }
  }
 }
 return ()=>{materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());};
}
