import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {planRooms} from './layout.js';

// Visual reconstruction, not an installation diagram. Sizes estimated from photos.
export function buildBoilerRoom(parent,ceilings,{box,cylinder,sphere,mat,mats,colliders,pickables}){
 const g=new T.Group();g.name='Котельная по фотографиям';parent.add(g);
 const [x0,z0,x1,z1]=planRooms.find(r=>r.id==='room-1').bounds,materials=[];
 const m=(color,extra={})=>{const a=mat(color,extra);materials.push(a);return a;};
 const green=m('#8dafa2'),beige=m('#c3b9a5'),seam=m('#ddd4c3'),timber=m('#8a7052'),steel=m('#747e80',{metalness:.35,roughness:.4});
 const white=m('#eeece6',{roughness:.3}),black=m('#222727'),pipeMetal=m('#55463b',{metalness:.35,roughness:.42}),ivory=m('#d7d4bc'),brass=m('#9e9575',{metalness:.5}),red=m('#b6242e',{roughness:.25}),teal=m('#16878c',{roughness:.34});
 const add=(name,x,y,z,w,h,d,a,solid=false)=>box(g,name,x,y,z,w,h,d,a,solid);
 const round=(name,x,y,z,w,h,d,a,r=.025)=>{const o=new T.Mesh(new RoundedBoxGeometry(w,h,d,3,r),a);o.name=name;o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;g.add(o);return o;};
 const tube=(name,points,r,a)=>{const path=new T.CurvePath();for(let i=1;i<points.length;i++)path.add(new T.LineCurve3(new T.Vector3(...points[i-1]),new T.Vector3(...points[i])));const mesh=new T.Mesh(new T.TubeGeometry(path,Math.max(8,points.length*8),r,8,false),a);mesh.name=name;mesh.castShadow=mesh.receiveShadow=true;g.add(mesh);return mesh;};
 const cable=(name,points,r,a)=>{const o=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),40,r,7,false),a);o.name=name;g.add(o);return o;};
 const solid=(x,y,z,w,h,d)=>colliders.push({minX:x-w/2,maxX:x+w/2,minY:y-h/2,maxY:y+h/2,minZ:z-d/2,maxZ:z+d/2});
 // Fixed wall lining only; no stored sheets or construction debris.
 const lining=(...args)=>box(g,...args,false,true);
 lining('Зелёная стена с трубами',x0+.012,1.5,(z0+z1)/2,.018,3,z1-z0,green);
 lining('Стена вешалки и щитков',(x0+x1)/2,1.5,z0+.012,x1-x0,3,.018,beige);
 for(const [a,b]of [[z0,8.15],[8.95,z1]])lining('Стена со стремянкой',x1-.012,1.5,(a+b)/2,.018,3,b-a,beige);
 lining('Над входом из кабинета',x1-.012,2.55,8.55,.018,.9,.8,beige);
 for(const z of [8.95,10.05,11.15])lining('Шов обшивки',x0+.024,1.5,z,.006,3,.027,seam);
 for(const y of [1.2,2.4])lining('Горизонтальный шов обшивки',x0+.024,y,(z0+z1)/2,.006,.026,z1-z0,seam);
 // Clean timber floor and a ceiling retaining the installed partial lining.
 for(let n=0;n<14;n++){const d=(z1-z0)/14;const f=add('Доска пола котельной',(x0+x1)/2,.014,z0+(n+.5)*d,x1-x0,.025,d-.007,n%3?timber:beige);f.userData.roomId='room-1';pickables.push(f);}
 const top=new T.Group();top.name='Потолок котельной по фото';ceilings.add(top);
 for(let n=0;n<15;n++){const d=(z1-z0)/15;box(top,'Доска потолка котельной',(x0+x1)/2,2.985,z0+(n+.5)*d,x1-x0,.028,d-.006,timber);}
 for(const z of [8.4,9.25,10.1,10.95,11.8])box(top,'Профиль потолка котельной',(x0+x1)/2,2.92,z,x1-x0,.05,.035,steel);
 for(const z of [9.65,11.45])box(top,'Закреплённая панель потолка',1.72,2.887,z,1.3,.018,1.05,beige);
 for(const z of [9.25,11.1]){cylinder(top,1.52,2.75,z,.004,.004,.25,ivory);cylinder(top,1.52,2.60,z,.023,.023,.06,white);sphere(top,1.52,2.55,z,.035,.047,.035,m('#ffffe5',{emissive:'#fff5cd',emissiveIntensity:.45}));}
 // All heating equipment faces into the room (+X in the source plan).
 const wallX=x0+.15;
 const gauge=(x,y,z,r=.039)=>{const rim=cylinder(g,x,y,z,r,r,.018,steel,32);rim.rotation.z=Math.PI/2;rim.name='Манометр';const face=cylinder(g,x+.012,y,z,r*.82,r*.82,.004,white,32);face.rotation.z=Math.PI/2;tube('Стрелка манометра',[[x+.016,y,z],[x+.016,y+r*.42,z-r*.35]],.002,black);};
 const tankX=x0+.30,tankZ=8.75;
 cylinder(g,tankX,1.27,tankZ,.235,.235,1.33,white,48).name='Вертикальный бойлер Termica';
 for(const y of [.605,1.935])sphere(g,tankX,y,tankZ,.235,.038,.235,white);
 solid(tankX,1.27,tankZ,.47,1.42,.47);gauge(tankX+.238,1.72,tankZ);
 for(const y of [.73,1.07])tube('Подключение бойлера',[[tankX,y,tankZ+.23],[wallX,y,tankZ+.33],[wallX,y,9.65]],.017,brass);
 const expansion=round('Красный расширительный бак',wallX+.055,1.75,9.40,.28,.51,.31,red,.12);solid(...expansion.position.toArray(),.28,.51,.31);
 tube('Подключение расширительного бака',[[wallX+.055,1.50,9.4],[wallX+.055,1.03,9.4]],.018,brass);
 // Two steel manifolds with white risers, service fittings and red valves.
 for(const y of [1.02,1.38]){
  tube('Стальной коллектор',[[wallX,y,9.57],[wallX,y,10.27]],.047,pipeMetal);
  for(let n=0;n<4;n++){
   const z=9.63+n*.17,up=y>1.1,end=up?2.83:.46;
   tube('Белая труба коллектора',[[wallX,y,z],[wallX,end,z]],.015,ivory);
   for(const yy of [y+(up?.12:-.12),y+(up?.23:-.23)]){cylinder(g,wallX,yy,z,.024,.024,.053,brass,12).name='Муфта трубопровода';}
   add('Красная рукоятка вентиля',wallX+.027,y+(up?.16:-.16),z,.014,.058,.018,red);
   if(up)tube('Труба у потолка',[[wallX,2.83,z],[x0+.03,2.83,z]],.015,ivory);
  }
 }
 for(const y of [.34,.57])tube('Нижняя стальная магистраль',[[wallX,y,9.02],[wallX,y,11.16],[x0+.48,y,11.16]],.031,pipeMetal);
 for(const z of [9.43,10.0,10.72]){tube('Отвод нижней магистрали',[[wallX,.34,z],[wallX,.78,z]],.017,ivory);add('Вентиль нижней магистрали',wallX+.033,.65,z,.012,.026,.078,red);}
 for(const [z,y]of [[9.82,.57],[10.66,1.03]]){const pump=cylinder(g,wallX+.06,y,z,.066,.066,.10,red,24);pump.rotation.z=Math.PI/2;pump.name='Циркуляционный насос';const cap=cylinder(g,wallX+.118,y,z,.043,.043,.016,black,24);cap.rotation.z=Math.PI/2;}
 round('Настенный электрический котёл',x0+.22,1.48,10.68,.25,.72,.35,white);
 add('Панель электрического котла',x0+.349,1.58,10.68,.012,.17,.095,steel);
 add('Красный индикатор котла',x0+.357,1.62,10.68,.006,.024,.053,m('#d73836',{emissive:'#bb1818',emissiveIntensity:.4}));
 add('Автоматы на котле',x0+.355,1.27,10.68,.014,.06,.105,black);
 tube('Обвод котла',[[wallX,1.38,10.27],[wallX,1.38,10.40],[wallX,2.12,10.40],[wallX,2.12,11.12],[wallX,.34,11.12]],.035,pipeMetal);
 tube('Подача электрокотла',[[wallX,2.12,10.68],[wallX,1.84,10.68]],.017,brass);gauge(wallX+.07,1.95,11.12,.031);
 // Turquoise floor-standing boiler and its grey hopper, clear of the yard door.
 const bx=x0+.48,bz=11.24;
 add('Основание напольного котла',bx,.075,bz,.60,.15,.70,black,true);
 round('Бирюзовый напольный котёл',bx,.77,bz,.58,1.34,.66,teal,.035);solid(bx,.77,bz,.58,1.34,.66);
 for(const [y,h]of [[.43,.48],[1.0,.39]]){add('Тёмная дверца котла',bx+.303,y,bz,.035,h,.53,black);add('Ручка дверцы котла',bx+.34,y+.10,bz-.15,.06,.027,.14,steel);}
 round('Бункер котла',bx,.81,11.79,.58,1.45,.42,steel,.018);solid(bx,.81,11.79,.58,1.45,.42);
 const lid=add('Наклонная крышка бункера',bx,1.55,11.79,.62,.035,.47,steel);lid.rotation.x=-.18;
 add('Ручка крышки бункера',bx,1.61,11.78,.16,.025,.04,black);
 const control=add('Контроллер напольного котла',bx,1.50,bz,.28,.09,.20,black);control.rotation.z=-.15;
 add('Экран контроллера котла',bx,1.547,bz,.12,.006,.065,m('#617a8f'));
 // Folded aluminium stepladder alongside the office partition.
 const lz=9.62;
 for(const side of [-1,1]){
  tube('Алюминиевая стойка стремянки',[[x1-.34,.055,lz+side*.23],[x1-.075,1.92,lz+side*.19]],.021,steel);
  round('Красная ножка стремянки',x1-.34,.055,lz+side*.23,.07,.10,.07,red,.015);
 }
 for(let i=0;i<5;i++){
  const y=.19+i*.29,x=x1-.34+(y/1.92)*.265;
  add('Ступень стремянки',x,y,lz,.15,.026,.41,steel);
  for(let n=0;n<5;n++)add('Рифление ступени стремянки',x-.06+n*.029,y+.016,lz,.005,.004,.36,black);
 }
 tube('Красная верхняя ручка стремянки',[[x1-.075,1.79,lz-.19],[x1-.075,1.94,lz-.19],[x1-.075,1.94,lz+.19],[x1-.075,1.79,lz+.19]],.031,red);
 solid(x1-.22,.98,lz,.30,1.96,.5);
 // Ornamental metal coat rack, left of the entrance when facing it from inside.
 const rz=z0+.12,rx=1.82;
 for(const x of [rx-.33,rx+.33])tube('Стойка кованой вешалки',[[x,.12,rz],[x,2.12,rz]],.014,black);
 for(const y of [.20,.46,1.78,2.10])tube('Поперечина вешалки',[[rx-.34,y,rz],[rx+.34,y,rz]],.012,black);
 add('Верхняя полка вешалки',rx,2.13,rz+.06,.77,.023,.30,timber);
 add('Полка для обуви вешалки',rx,.26,rz+.12,.72,.035,.35,timber);
 for(let i=0;i<5;i++){
  const x=rx-.27+i*.135;
  cable('Крючок вешалки',[[x,1.78,rz],[x,1.76,rz+.10],[x,1.82,rz+.13]],.009,black);
  for(const y of [1.93,1.53]){const pts=[];for(let j=0;j<=24;j++){const a=j/24*Math.PI*2,r=.052*(1-j/32);pts.push([x+Math.cos(a)*r,y+Math.sin(a)*r,rz]);}cable('Завиток вешалки',pts,.005,black);}
 }
 // Network equipment and electrical boards. These are visual objects, not HA controls.
 const nz=z0+.075;
 round('Белый электрический щиток',.93,1.45,nz+.045,.44,.53,.13,white);
 for(let row=0;row<3;row++)for(let i=0;i<7;i++){
  const x=.765+i*.053,y=1.61-row*.16;
  add('Модуль автомата',x,y,nz+.116,.044,.10,.019,ivory);
  add('Рычажок автомата',x,y+.018,nz+.13,.025,.021,.012,i===0?red:black);
 }
 round('Сетевой шкаф',.94,2.22,nz+.08,.49,.59,.23,steel);
 add('Тёмное окно сетевого шкафа',.94,2.23,nz+.201,.39,.43,.015,black);
 for(let i=0;i<3;i++){add('Устройство в сетевом шкафу',.94,2.08+i*.13,nz+.216,.31,.07,.035,steel);for(let n=0;n<6;n++)add('Порт сетевого устройства',.82+n*.04,2.08+i*.13,nz+.237,.024,.014,.006,black);}
 for(const [x,y,w,h]of [[1.42,2.41,.20,.26],[1.75,2.40,.22,.34],[2.09,2.24,.24,.12]]){
  round('Сетевое оборудование над вешалкой',x,y,nz+.08,w,h,.08,black,.015);
  for(const side of [-1,1])tube('Антенна маршрутизатора',[[x+side*w*.38,y+h/2,nz+.08],[x+side*w*.48,y+h/2+.16,nz+.08]],.006,black);
  add('Индикатор сетевого устройства',x+w*.25,y-h*.25,nz+.124,.01,.008,.003,m('#4f9856',{emissive:'#3c8f44',emissiveIntensity:.4}));
 }
 for(let i=0;i<10;i++){
  const x=.62+i*.067;
  cable('Кабельная гофра щитка',[[x,2.96,z0+.04],[x+.045,2.72,z0+.05],[x,2.58,nz],[x,1.1,nz],[.75+i*.033,.94,nz+.04]],.009,ivory);
 }
 for(let i=0;i<4;i++)cable('Сетевой кабель',[[1.35+i*.19,2.28,nz+.15],[1.22+i*.1,2.10,nz+.20],[1.15,2.27-i*.05,nz+.21]],.003,black);
 for(const x of [.58,1.30])add('Монтажный профиль щитков',x,1.98,z0+.025,.026,1.91,.027,steel);
 return ()=>materials.forEach(a=>a.dispose());
}
