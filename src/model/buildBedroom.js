import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {LEVEL,planRooms,UPPER_HALL_PLAN} from './layout.js';

// Furniture dimensions are estimates from the owner's six bedroom photos.
export function buildBedroom(parent,ceilings,{box,cylinder,sphere,mat,mats,colliders,furnitureSystem,registerWall}){
 const g=new T.Group();g.name='Спальня по фотографиям';parent.add(g);
 const materials=[],textures=[],[x0,z0,x1,z1]=planRooms.find(r=>r.id==='room-7').bounds;
 const m=(color,props={})=>{const v=mat(color,props);materials.push(v);return v;};
 const taupe=m('#bcb2a5'),dark=m('#342b29'),rose=m('#b79385',{roughness:1}),cream=m('#e0d5bc'),ivory=m('#ece6dc'),metal=m('#b8b9ad',{metalness:.7,roughness:.3});
 const add=(name,x,y,z,w,h,d,material,solid=false)=>box(g,name,x,LEVEL+y,z,w,h,d,material,solid);
 const finish=(name,x,y,z,w,h,d,material)=>box(g,name,x,LEVEL+y,z,w,h,d,material,false,true);
 const rounded=(name,x,y,z,w,h,d,material,r=.06)=>{
  const mesh=new T.Mesh(new RoundedBoxGeometry(w,h,d,4,r),material);mesh.name=name;mesh.position.set(x,LEVEL+y,z);mesh.castShadow=mesh.receiveShadow=true;g.add(mesh);return mesh;
 };
 const solid=(x,z,w,d,h)=>colliders.push({minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2,minY:LEVEL,maxY:LEVEL+h});
 const canvas=(w,h,draw)=>{const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;textures.push(t);return t;};
 const patterned=(texture)=>m('#ffffff',{map:texture,roughness:1});
 const panel=(name,w,h,texture,position,rotation)=>{const mesh=new T.Mesh(new T.PlaneGeometry(w,h),patterned(texture));mesh.name=name;mesh.position.set(position[0],LEVEL+position[1],position[2]);mesh.rotation.set(...rotation);mesh.receiveShadow=true;g.add(mesh);return mesh;};
 // Interior finishes are kept separate from the shared corridor wall.
 finish('Обои спальни · торец кровати',x0+.012,1.35,(z0+z1)/2,.018,2.7,z1-z0,taupe);
 finish('Обои спальни · торец шкафа',x1-.012,1.35,(z0+z1)/2,.018,2.7,z1-z0,taupe);
 for(const [a,b]of [[x0,2.8],[5.45,x1]])finish('Обои спальни · балконная стена',(a+b)/2,1.35,z1-.012,b-a,2.7,.018,taupe);
 finish('Обои спальни · под окном',3.7,.35,z1-.012,1.8,.7,.018,taupe);
 finish('Обои спальни · над балконным блоком',4.125,2.475,z1-.012,2.65,.45,.018,taupe);
 const opening=UPPER_HALL_PLAN.bedroom;
 for(const [a,b]of [[x0,opening.at],[opening.at+opening.width,x1]]){
  finish('Обои спальни · стена входа',(a+b)/2,1.35,z0+.012,b-a,2.7,.018,taupe);
  add('Плинтус спальни',(a+b)/2,.035,z0+.027,b-a,.07,.025,metal);
 }
 finish('Обои над входом в спальню',opening.at+opening.width/2,2.4,z0+.012,opening.width,.6,.018,taupe);
 for(const x of [x0+.025,x1-.025])add('Плинтус спальни',x,.035,(z0+z1)/2,.025,.07,z1-z0,metal);
 // Copper palm leaves and angular gold lines reproduce the mural's motif.
 const mural=canvas(768,768,(ctx,w,h)=>{
  ctx.fillStyle='#b4a493';ctx.fillRect(0,0,w,h);
  ctx.strokeStyle='#c7a24d';ctx.lineWidth=2.4;
  for(const [px,py]of [[80,100],[270,170],[545,165],[695,335]])for(const [xx,yy]of [[0,0],[190,0],[420,0],[768,0],[0,420],[768,490],[370,550]]){
   ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo((px+xx)/2+35,(py+yy)/2-30);ctx.lineTo(xx,yy);ctx.stroke();
  }
  for(let f=0;f<11;f++){
   const bx=-80+f*92,by=850,tx=bx+(f%2?170:-100),ty=220+(f%4)*62;
   ctx.strokeStyle=f%2?'#8b5637':'#ba8153';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(bx,by);ctx.quadraticCurveTo(bx-30,(by+ty)/2,tx,ty);ctx.stroke();
   for(let i=1;i<32;i++){
    const t=i/33,px=bx+(tx-bx)*t*t,py=by+(ty-by)*t,span=125*Math.sin(Math.PI*t)*(.8+(f%3)*.1);
    for(const side of [-1,1]){
     ctx.fillStyle=(i+f)%3?'#a56e47':'#cf9762';ctx.beginPath();ctx.moveTo(px,py+10);
     ctx.bezierCurveTo(px+side*span*.45,py-12,px+side*span,py-70,px+side*span*.88,py-105);
     ctx.quadraticCurveTo(px+side*span*.67,py-38,px,py+2);ctx.fill();
    }
   }
  }
 });
 registerWall(panel('Фотообои · золотые листья',z1-z0-.07,2.66,mural,[x0+.025,1.35,(z0+z1)/2],[0,Math.PI/2,0]),LEVEL);
 // Main bed points along the room, with a low white upholstered base.
 const bedX=x0+1.17,bedZ=(z0+z1)/2;
 rounded('Основная кровать · белое основание',bedX,.22,bedZ,2.10,.36,1.67,ivory,.10);
 rounded('Основная кровать · матрас',bedX,.45,bedZ,2.07,.23,1.65,cream,.11);
 const duvet=rounded('Основная кровать · розовое одеяло',bedX+.18,.58,bedZ,1.83,.20,1.76,rose,.10);
 const pos=duvet.geometry.attributes.position;
 for(let i=0;i<pos.count;i++){const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i);if(y>0)pos.setY(i,y+.018*Math.sin(x*19+z*7)+.009*Math.cos(z*23-x*11));}
 duvet.geometry.computeVertexNormals();
 for(const z of [bedZ-.41,bedZ+.41])rounded('Основная кровать · подушка',x0+.42,.64,z,.48,.17,.70,rose,.07).rotation.z=-.08;
 solid(bedX,bedZ,2.1,1.76,.69);
 // Two dark bedside units; drawers retain the model's click-to-open behaviour.
 for(const [side,z]of [['левая',bedZ-1.12],['правая',bedZ+1.12]]){
  const x=x0+.37;
  add('Прикроватная тумба · '+side,x,.28,z,.53,.53,.43,dark,true);
  for(let i=0;i<2;i++){
   const y=.16+i*.23,front=add('Фасад тумбы',x+.277,y,z,.024,.21,.385,dark);
   const handle=add('Ручка тумбы',x+.303,y+.035,z,.025,.015,.14,metal);
   furnitureSystem.drawer(g,{id:`bedroom-${side}-${i}`,label:`Тумба ${side} · ящик ${i+1}`,roomId:'room-7',front,handle,axis:'x',travel:.30,width:.385,height:.20,depth:.43,bodyMaterial:dark});
  }
 }
 // Slender white reading lamp and small objects seen on the bedside tables.
 const lampZ=bedZ-1.45,lampX=x0+.27;
 cylinder(g,lampX,LEVEL+.02,lampZ,.13,.13,.04,ivory);
 cylinder(g,lampX,LEVEL+.69,lampZ,.013,.013,1.32,metal);
 const shade=cylinder(g,lampX+.08,LEVEL+1.30,lampZ,.045,.09,.16,ivory);shade.rotation.z=.6;
 for(let i=0;i<3;i++)cylinder(g,x0+.32+(i%2)*.12,LEVEL+.60,bedZ-1.14+i*.08,.025,.03,.15,ivory);
 cylinder(g,x0+.38,LEVEL+.59,bedZ+1.12,.12,.12,.025,metal).rotation.z=Math.PI/2;
 // Valet stand, a simple white tubular frame near the curtains.
 for(const x of [1.9,2.25])cylinder(g,x,LEVEL+.68,z1-.33,.012,.012,1.32,ivory);
 for(const y of [.09,.72,1.36])add('Белая напольная вешалка',2.075,y,z1-.33,.39,.022,.025,ivory);
 for(const x of [1.9,2.25])add('Опора напольной вешалки',x,.025,z1-.33,.035,.03,.40,ivory);
 // Smaller bed across the room at the wardrobe end, head against balcony wall.
 const smallX=6.36,smallZ=z1-1.11;
 rounded('Вторая кровать · основание',smallX,.23,smallZ,1.38,.30,2.02,dark);
 rounded('Вторая кровать · матрас',smallX,.43,smallZ,1.36,.20,2.01,rose);
 rounded('Вторая кровать · светлое покрывало',smallX,.55,smallZ-.10,1.43,.09,1.88,cream,.04);
 add('Вторая кровать · изголовье',smallX,.66,z1-.08,1.45,.87,.055,dark);
 for(const x of [smallX-.35,smallX+.35])add('Вставка изголовья',x,.73,z1-.116,.62,.57,.014,taupe);
 rounded('Вторая кровать · подушка',smallX,.64,z1-.43,1.0,.15,.46,rose,.06);
 solid(smallX,smallZ,1.43,2.02,.70);
 // Corner wardrobe: pentagonal carcass with a diagonal mirrored leaf.
 const points=[[6.13,z0+.05],[x1-.05,z0+.05],[x1-.05,z0+.91],[6.83,z0+.91],[6.13,z0+.50]];
 const shape=new T.Shape();points.forEach(([x,z],i)=>i?shape.lineTo(x,-z):shape.moveTo(x,-z));shape.closePath();
 for(const height of [.05,2.23]){
  const geo=new T.ExtrudeGeometry(shape,{depth:.025,bevelEnabled:false});geo.rotateX(-Math.PI/2);
  const mesh=new T.Mesh(geo,dark);mesh.name='Угловой шкаф · горизонтальная панель';mesh.position.y=LEVEL+height;mesh.castShadow=true;g.add(mesh);
 }
 for(const [a,b]of [[0,1],[1,2],[2,3],[4,0]]){
  const [ax,az]=points[a],[bx,bz]=points[b],length=Math.hypot(bx-ax,bz-az);
  add('Угловой шкаф · боковина',(ax+bx)/2,1.14,(az+bz)/2,length,2.2,.026,dark).rotation.y=-Math.atan2(bz-az,bx-ax);
 }
 add('Полки углового шкафа',6.78,1.12,z0+.35,.9,.026,.5,dark);
 const [ax,az]=points[4],[bx,bz]=points[3],angle=-Math.atan2(bz-az,bx-ax),length=Math.hypot(bx-ax,bz-az);
 const face=add('Угловой шкаф · зеркальная дверь',(ax+bx)/2,1.14,(az+bz)/2,length-.02,2.15,.035,dark);face.rotation.y=angle;
 const mirror=add('Зеркало спальни',(ax+bx)/2+Math.sin(angle)*.023,1.18,(az+bz)/2+Math.cos(angle)*.023,length-.11,1.90,.009,m('#bac1ba',{metalness:.88,roughness:.13}));mirror.rotation.y=angle;
 furnitureSystem.register(g,{id:'bedroom-wardrobe',label:'Угловой шкаф · зеркальная дверь',roomId:'room-7',parts:[face,mirror],pivot:[ax,LEVEL,az],angle:-Math.PI/2});
 solid(6.77,z0+.45,1.18,.88,2.25);
 // Wooden chair beside the wardrobe.
 const chairX=5.82,chairZ=z0+.53;
 add('Стул спальни · сиденье',chairX,.46,chairZ,.40,.055,.40,dark,true);
 for(const x of [chairX-.16,chairX+.16])for(const z of [chairZ-.16,chairZ+.16])add('Ножка стула',x,.24,z,.028,.45,.028,dark);
 for(const x of [chairX-.17,chairX+.17])add('Спинка стула · стойка',x,.74,chairZ-.17,.032,.58,.032,dark);
 add('Спинка стула · верх',chairX,1.015,chairZ-.17,.38,.045,.035,dark);
 for(let i=-1;i<=1;i++)add('Спинка стула · рейка',chairX+i*.09,.80,chairZ-.17,.018,.37,.022,dark);
 // The two photographed rugs, without temporary bags or clothes on the floor.
 const carpet=canvas(768,512,(ctx,w,h)=>{
  ctx.fillStyle='#b7a995';ctx.fillRect(0,0,w,h);
  for(let i=0;i<6;i++){
   ctx.fillStyle=i%2?'#ddd2bd':'#aa9580';ctx.beginPath();ctx.moveTo(i*150-70,0);ctx.bezierCurveTo(i*80+20,120,i*190-30,360,i*140+120,h);ctx.lineTo(i*140+210,h);ctx.bezierCurveTo(i*190+35,370,i*90+100,90,i*150+40,0);ctx.fill();
  }
  ctx.strokeStyle='#644638';ctx.lineWidth=24;
  for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(-60,i*190+55);ctx.bezierCurveTo(240,i*100+200,430,i*140-80,830,i*210+100);ctx.stroke();}
 });
 panel('Большой ковёр спальни',3.2,2.45,carpet,[3.65,.009,10.13],[-Math.PI/2,0,0]);
 const bedsideRug=canvas(320,512,(ctx,w,h)=>{
  ctx.fillStyle='#743827';ctx.fillRect(0,0,w,h);
  for(let k=0;k<4;k++){ctx.strokeStyle=k%2?'#d2aa69':'#3f2822';ctx.lineWidth=7;ctx.strokeRect(12+k*14,12+k*14,w-24-k*28,h-24-k*28);}
  for(let y=90;y<440;y+=58)for(let x=75;x<270;x+=55){ctx.strokeStyle='#cda76e';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,y-22);ctx.lineTo(x+18,y);ctx.lineTo(x,y+22);ctx.lineTo(x-18,y);ctx.closePath();ctx.stroke();}
 });
 panel('Прикроватный бордовый коврик',1.28,.68,bedsideRug,[1.14,.010,z0+.43],[-Math.PI/2,0,0]);
 // Floor-length patterned drapes frame a white sheer curtain and balcony door.
 const curtainTexture=canvas(256,512,(ctx,w,h)=>{
  ctx.fillStyle='#8e8376';ctx.fillRect(0,0,w,h);
  for(let i=0;i<110;i++){const x=(i*83)%w,y=(i*61)%h;ctx.strokeStyle=i%2?'#b9afa0':'#665c52';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y);ctx.bezierCurveTo(x-35,y+20,x+32,y+45,x-8,y+65);ctx.stroke();}
 });
 const curtainMat=patterned(curtainTexture),sheer=m('#f6f3e9',{transparent:true,opacity:.26,depthWrite:false,side:T.DoubleSide});
 function curtain(name,a,b,z,material,waves){
  const geo=new T.PlaneGeometry(b-a,2.59,80,8),p=geo.attributes.position;
  for(let i=0;i<p.count;i++)p.setZ(i,.045*Math.sin((p.getX(i)/(b-a)+.5)*waves*Math.PI*2));
  geo.computeVertexNormals();const mesh=new T.Mesh(geo,material);material.side=T.DoubleSide;mesh.name=name;mesh.position.set((a+b)/2,LEVEL+1.33,z);mesh.receiveShadow=true;mesh.castShadow=material===curtainMat;g.add(mesh);
 }
 curtain('Портьера спальни · левая',2.12,2.95,z1-.12,curtainMat,9);
 curtain('Портьера спальни · правая',5.40,5.77,z1-.12,curtainMat,5);
 curtain('Тюль спальни',2.92,4.59,z1-.09,sheer,16);
 add('Потолочный карниз спальни',3.95,2.65,z1-.14,3.78,.045,.07,ivory);
 for(let i=0;i<9;i++)add('Радиатор спальни · секция',3.08+i*.09,.43,z1-.13,.08,.48,.13,ivory);
 add('Выключатель спальни',opening.at-.14,.97,z0+.036,.08,.08,.022,ivory);
 // Plain finished ceiling requested by the owner; simple existing lamp positions.
 for(const x of [2.1,5.35]){
  cylinder(ceilings,x,LEVEL+2.66,10.18,.10,.10,.055,ivory);
  sphere(ceilings,x,LEVEL+2.60,10.18,.055,.09,.055,m('#fff5db',{emissive:'#fff0ce',emissiveIntensity:.25}));
 }
 return()=>{textures.forEach(t=>t.dispose());materials.forEach(material=>material.dispose());};
}
