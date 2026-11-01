import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {HALL,STAIR} from './layout.js';

export function buildHall(parent,{box,cylinder,mats,mat,furnitureSystem}) {
 const g=new T.Group();g.name='Коридор по обмерам';parent.add(g);
 const oak=mat('#b9a58b'),gray=mat('#555655'),mirror=mat('#abb8b8',{metalness:.85,roughness:.16});
 const add=(name,x,y,z,w,h,d,m,solid=false)=>box(g,name,x,y,z,w,h,d,m,solid);
 // Wardrobe back against the bathroom partition, facing the entrance across X.
 const w=HALL.wardrobe,carcassDepth=w.depth-.0475,front=w.backX+carcassDepth,cell=(w.width-.08)/3;
 const carcass=new T.Group();carcass.name='Шкаф-купе коридора';g.add(carcass);
 const shell=(name,x,y,z,ww,h,d)=>box(carcass,name,x,y,z,ww,h,d,mats.dark,true);
 shell('Задняя панель шкафа-купе',w.backX+.008,w.height/2,w.centerZ,.016,w.height,w.width);
 for(const z of [w.centerZ-w.width/2+.009,w.centerZ+w.width/2-.009])shell('Боковина шкафа-купе',w.backX+carcassDepth/2,w.height/2,z,carcassDepth,w.height,.018);
 for(const y of [.009,w.height-.009])shell('Панель шкафа-купе',w.backX+carcassDepth/2,y,w.centerZ,carcassDepth,.018,w.width);
 for(const y of [.48,2.10])add('Внутренняя полка шкафа-купе',w.backX+.24,y,w.centerZ,.46,.02,w.width-.06,oak);
 // Two leaves cover two of the three bays; one bay always remains accessible.
 for(let i=0;i<2;i++){
  const z=w.centerZ+(i-1)*cell,trackFront=front+(i-1)*.052,parts=[];
  parts.push(add('Створка шкафа-купе',trackFront+.014,w.height/2,z,.028,w.height-.10,cell-.025,oak));
  if(i===0)parts.push(add('Зеркало шкафа-купе',trackFront+.030,1.30,z,.008,1.52,cell-.045,mirror));
  for(const zz of [z-cell/2,z+cell/2])parts.push(add('Профиль шкафа-купе',trackFront+.035,w.height/2,zz,.022,w.height-.06,.018,mats.metal));
  for(const y of [.54,2.06])parts.push(add('Разделитель створки',trackFront+.036,y,z,.016,.012,cell-.025,mats.metal));
  furnitureSystem.register(g,{id:'hall-slider-'+i,label:'Шкаф-купе · '+['зеркальная','деревянная'][i]+' створка',roomId:'room-3',parts,offset:[0,0,i===0?cell:-cell]});
 }
 for(const y of [.045,w.height-.045])add('Направляющая шкафа-купе',front+.025,y,w.centerZ,.045,.04,w.width,mats.metal);
 // Office-side wall: bench below the mirror/coat rack, left of the entrance
 // when looking at the entrance from inside the hall. Fronts face toward -Z.
 const b=HALL.bench,bz=b.backZ-b.depth/2;
 add('Скамья обувницы',b.centerX,.44,bz,b.width,.045,b.depth,oak,true);
 for(const x of [b.centerX-b.width/2+.02,b.centerX+b.width/2-.02])add('Боковина обувницы',x,.23,bz,.025,.42,b.depth-.03,oak,true);
 for(const y of [.12,.27])add('Полка обувницы',b.centerX,y,bz,b.width-.07,.025,b.depth-.04,gray);
 add('Панель вешалки с зеркалом',b.centerX,1.58,b.backZ-.025,b.width,1.12,.045,oak);
 add('Зеркало прихожей',b.centerX-.30,1.59,b.backZ-.054,.33,.87,.014,mirror);
 add('Верхняя полка вешалки',b.centerX,2.15,b.backZ-.11,b.width+.04,.035,.22,oak);
 for(const x of [b.centerX-.04,b.centerX+.16,b.centerX+.36]){
  add('Крючок вешалки',x,1.95,b.backZ-.085,.018,.025,.08,mats.dark);
  add('Кончик крючка',x,1.97,b.backZ-.12,.018,.055,.018,mats.dark);
 }
 const c=HALL.shoeCabinet;
 add('Тумба для обуви',c.centerX,.43,c.centerZ,.60,.86,.36,oak,true);
 for(const y of [.23,.61]){
  add('Фасад обувницы',c.centerX,y,c.centerZ-.194,.53,.33,.022,gray);
  add('Ручка обувницы',c.centerX,y+.09,c.centerZ-.213,.17,.022,.025,mats.metal);
 }
 const entranceZ=HALL.entrance.at+HALL.entrance.width/2;
 add('Придверный коврик',6.45,.006,entranceZ,1.30,.012,1.65,mat('#636766'));
 add('Ковёр коридора',4.28,.005,6.28,1.70,.010,1.95,mat('#b9b8ad'));

 // Three-drawer cabinet in the outer corner below the stair turn.
 // Approximate photo dimensions: 72 × 42 × 115 cm, with a raised open shelf.
 const cabinet=new T.Group();cabinet.name='Тумбочка под лестницей';g.add(cabinet);
 const x=STAIR.x1-.37,back=HALL.bounds[1]+.035,depth=.42,z=back+depth/2,frontZ=back+depth;
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;
 const ctx=canvas.getContext('2d');ctx.fillStyle='#c4bba6';ctx.fillRect(0,0,512,256);
 for(let n=0;n<180;n++){
  const y=n*256/180;ctx.strokeStyle=n%3?'rgba(102,88,69,.12)':'rgba(248,239,215,.28)';ctx.lineWidth=n%4===0?1.2:.5;ctx.beginPath();
  for(let i=0;i<=64;i++){const px=i*8,py=y+1.8*Math.sin(px*.019+n*.39)+.6*Math.cos(px*.047+n);if(i)ctx.lineTo(px,py);else ctx.moveTo(px,py);}ctx.stroke();
 }
 const grain=new T.CanvasTexture(canvas);grain.colorSpace=T.SRGBColorSpace;
 mats.stairCabinetWood=mat('#ffffff',{map:grain,roughness:.66});
 mats.stairCabinetChrome=mat('#d9dedd',{metalness:.45,roughness:.24});
 const wood=mats.stairCabinetWood,chrome=mats.stairCabinetChrome;
 const panel=(name,xx,y,zz,w,h,d,solid=false)=>box(cabinet,name,xx,y,zz,w,h,d,wood,solid);
 const shelf=(name,y)=>{const o=new T.Mesh(new RoundedBoxGeometry(.72,.025,.44,3,.012),wood);o.name=name;o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;cabinet.add(o);};
 panel('Цоколь тумбочки под лестницей',x,.044,z,.65,.088,.35,true);
 panel('Задняя стенка тумбочки',x,.477,back+.009,.69,.79,.018,true);
 for(const xx of [x-.337,x+.337])panel('Боковина тумбочки',xx,.477,z,.022,.79,depth,true);
 panel('Дно тумбочки',x,.10,z,.67,.022,depth);
 shelf('Столешница тумбочки',.88);
 panel('Спинка открытой полки',x,1.014,back+.012,.67,.25,.018);
 shelf('Верхняя полка тумбочки',1.14);
 for(const xx of [x-.283,x+.283]){
  const postZ=frontZ-.048;
  const post=cylinder(cabinet,xx,1.01,postZ,.012,.012,.235,chrome,32);post.name='Хромированная стойка полки';
  for(const y of [.898,1.122]){const foot=cylinder(cabinet,xx,y,postZ,.027,.027,.008,chrome,32);foot.name='Фланец стойки полки';}
 }
 for(let i=0;i<3;i++){
  const y=.231+i*.255;
  const face=panel('Фасад ящика тумбочки под лестницей',x,y,frontZ+.004,.654,.248,.020);
  const curve=new T.CatmullRomCurve3([new T.Vector3(-.073,.012,0),new T.Vector3(-.048,-.002,.022),new T.Vector3(0,-.008,.029),new T.Vector3(.048,-.002,.022),new T.Vector3(.073,.012,0)]);
  const handle=new T.Mesh(new T.TubeGeometry(curve,24,.0055,8,false),mats.white);handle.name='Белая изогнутая ручка';handle.position.set(x,y+.016,frontZ+.017);cabinet.add(handle);
  furnitureSystem.drawer(cabinet,{id:'hall-stair-drawer-'+i,label:'Тумбочка под лестницей · ящик '+(3-i),roomId:'room-3',front:face,handle,axis:'z',travel:.27,width:.654,height:.22,depth:.36,bodyMaterial:wood});
 }
 return ()=>{grain.dispose();oak.dispose();gray.dispose();mirror.dispose();};
}
