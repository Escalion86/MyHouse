import {buildSite} from './buildSite.js';
import * as T from 'three';
import {buildOffice} from './buildOffice.js';
import {createDoors} from './doors.js';
import {buildHall} from './buildHall.js';
import {buildLiving} from './buildLiving.js';
import {buildBedroom} from './buildBedroom.js';
import {buildBathroom} from './buildBathroom.js';
import {buildShowerRoom} from './buildShowerRoom.js';
import {buildChildRoom} from './buildChildRoom.js';
import {buildBoilerRoom} from './buildBoilerRoom.js';
import {buildInterstoreySlab,subtract} from './buildInterstoreySlab.js';
import {buildExteriorDetails} from './buildExteriorDetails.js';
import {projectFacadeUV} from './facadeUV.js';
import {buildRobotVacuum} from './buildRobotVacuum.js';
import {buildSwitches} from './buildSwitches.js';
import {buildHallLights} from './buildHallLights.js';
import {buildStairSupports} from './buildStairSupports.js';
import {buildUpperHall,upperHallMaterials,UPPER_HALL} from './buildUpperHall.js';
import {createFurniture} from './furniture.js';
import { W,D,LEVEL,GAP,planRooms as rooms,mirrorX,STAIR,HALL,LIVING,BATHROOM,SHOWER,CHILD,CLOSET,UPPER_HALL_PLAN,UPPER_Z_SHIFT,EXTERIOR_THICKNESS as EXT } from './layout.js';

function texture(kind) {
 const c=document.createElement('canvas');c.width=c.height=512;const g=c.getContext('2d');
 let seed=27;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 if(kind==='floor') {
  g.fillStyle='#ddd7c9';g.fillRect(0,0,512,512);
  for(let row=0;row<8;row++)for(let col=-1;col<3;col++) {
   const x=col*256+(row%3)*83,y=row*64,n=Math.floor(rand()*12);
   g.fillStyle=`rgb(${223+n},${217+n},${204+n})`;g.fillRect(x+1,y+1,254,62);
   for(let i=0;i<25;i++){g.strokeStyle=`rgba(92,75,53,${rand()*.06})`;g.beginPath();const yy=y+rand()*64;g.moveTo(x,yy);g.bezierCurveTo(x+70,yy+4,x+120,yy-4,x+256,yy);g.stroke();}
  }
 } else if(kind==='wood') {
  g.fillStyle='#ad8050';g.fillRect(0,0,512,512);
  for(let row=0;row<4;row++){
   const y=row*128;
   g.fillStyle='rgba(61,35,17,.28)';g.fillRect(0,y,512,3);
   for(let i=0;i<65;i++){
    const yy=y+4+rand()*120;
    g.strokeStyle=`rgba(75,44,22,${.04+rand()*.12})`;g.lineWidth=.5+rand();
    g.beginPath();g.moveTo(0,yy);g.bezierCurveTo(150,yy-6,330,yy+6,512,yy);g.stroke();
   }
  }
 } else if(kind==='brick') {
  g.fillStyle='#434b4e';g.fillRect(0,0,512,512);
  for(let row=0;row<12;row++)for(let col=-1;col<5;col++){const n=Math.floor(rand()*35);g.fillStyle=`rgb(${118+n},${126+n},${130+n})`;g.fillRect(col*128+(row%2)*64+2,row*512/12+2,124,512/12-4);}
 } else if(kind==='osb') {
  g.fillStyle='#bba17b';g.fillRect(0,0,512,512);
  for(let i=0;i<4200;i++){g.save();g.translate(rand()*512,rand()*512);g.rotate(rand()*Math.PI);g.fillStyle=rand()>.5?'rgba(102,67,32,.13)':'rgba(236,212,164,.28)';g.fillRect(0,0,2+rand()*5,8+rand()*40);g.restore();}
 } else if(kind==='roof') {
  g.fillStyle='#3e424a';g.fillRect(0,0,512,512);
  for(let x=0;x<512;x+=32){g.fillStyle='#4c5058';g.fillRect(x,0,12,512);g.fillStyle='#30343c';g.fillRect(x+25,0,4,512);}
  for(let y=0;y<512;y+=80){g.fillStyle='rgba(0,0,0,.25)';g.fillRect(0,y,512,4);}
 }
 const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;return t;
}

export function buildHouse(scene,onSelect) {
 const root=new T.Group();root.name='Дом';scene.add(root);
 const floorGroups=[new T.Group(),new T.Group()];floorGroups.forEach((g,i)=>{g.name=`Этаж ${i+1}`;g.userData.floor=i+1;root.add(g);});
 const site=new T.Group();site.name='Участок';root.add(site);
 const roofGroup=new T.Group();roofGroup.name='Крыша';root.add(roofGroup);
 const ceilings=new T.Group();ceilings.name='Потолки';root.add(ceilings);
 const stairsGroup=new T.Group();stairsGroup.name='Лестница';root.add(stairsGroup);
 const colliders=[],wallMeshes=[],pickables=[],deviceMeshes={},labels=[];
 // Wall finishes can live inside room groups: find the owning floor through ancestors.
 function registerWall(mesh,base){
  if(base===undefined){base=0;for(let p=mesh.parent;p;p=p.parent)if(p===floorGroups[1]){base=LEVEL;break;}}
  mesh.geometry.computeBoundingBox();
  const bounds=mesh.geometry.boundingBox,bottom=mesh.position.y+bounds.min.y,top=mesh.position.y+bounds.max.y;
  const uv=mesh.geometry.attributes.uv;
  wallMeshes.push({mesh,bottom,top,base,height:top-bottom,uv:(mesh.geometry.type==='PlaneGeometry'||mesh.userData.facadeTileHeight)&&uv?uv.array.slice():null});
 }
 const mat=(color,extras={})=>new T.MeshStandardMaterial({color,roughness:.78,...extras});
 const floorTex=texture('floor');floorTex.repeat.set(2.2,3.7);
 const brickTex=texture('brick');
 const osbTex=texture('osb');
 const roofTex=texture('roof');roofTex.repeat.set(4,5);
 const terraceWoodTex=texture('wood');terraceWoodTex.repeat.set(4,1);
 const mats={wall:mat('#e7e5df'),wood:mat('#c5aa83'),floor:mat('#ffffff',{map:floorTex}),tile:mat('#cbd0cd'),dark:mat('#272d2e'),white:mat('#f2f1e9'),metal:mat('#646c6d',{metalness:.65,roughness:.35}),glass:mat('#b6cad0',{transparent:true,opacity:.23,roughness:.2,depthWrite:false}),brick:mat('#ffffff',{map:brickTex}),osb:mat('#ffffff',{map:osbTex}),roof:mat('#ffffff',{map:roofTex}),grass:mat('#a4ad8e'),ground:mat('#eeeeeb'),asphalt:mat('#838984')};
 function box(parent,name,x,y,z,w,h,d,material,collision=false,wall=false) {
  if(w<=0||h<=0||d<=0)return;
  const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);mesh.name=name;mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);
  const finishes=Array.isArray(material)?material:[material];
  if(finishes.includes(mats.brick)||(mats.siteBrick&&finishes.includes(mats.siteBrick)))projectFacadeUV(mesh,1.2,.96);
  else if(finishes.includes(mats.osb))projectFacadeUV(mesh,1,1);
  if(collision) colliders.push({minX:x-w/2,maxX:x+w/2,minY:y-h/2,maxY:y+h/2,minZ:z-d/2,maxZ:z+d/2});
  if(wall)registerWall(mesh);
  return mesh;
 }
 function cylinder(parent,x,y,z,rt,rb,h,m,n=24){const mesh=new T.Mesh(new T.CylinderGeometry(rt,rb,h,n),m);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
 function sphere(parent,x,y,z,sx,sy,sz,m){const o=new T.Mesh(new T.SphereGeometry(1,24,16),m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
 const doorSystem=createDoors({box,mats,pickables});
 const furnitureSystem=createFurniture({box,mats,pickables});
 mats.entryBrown=mat('#2c1912',{roughness:.54});
 mats.terraceWood=mat('#ffffff',{map:terraceWoodTex,roughness:.88});
 // Wall runs along x or z. Openings are distances along run, with lower and upper heights.
 function wall(parent,axis,a,b,fixed,base,height,thickness,openings=[],material=mats.wall) {
  const faceMaterials=Array.isArray(material)?material:Array(6).fill(material);
  if(material===mats.brick||material===mats.osb){faceMaterials[2]=mats.wall;faceMaterials[axis==='x'?(fixed<D/2?4:5):(fixed<W/2?0:1)]=mats.wall;}
  const make=(lo,hi,y0,y1)=>box(parent,'Стена',axis==='x'?(lo+hi)/2:fixed,base+(y0+y1)/2,axis==='x'?fixed:(lo+hi)/2,axis==='x'?hi-lo:thickness,y1-y0,axis==='x'?thickness:hi-lo,faceMaterials,true,true);
  let p=a;
  for(const o of [...openings].sort((u,v)=>u.at-v.at)) {
   make(p,o.at,0,height);if(o.bottom>0)make(o.at,o.at+o.width,0,o.bottom);make(o.at,o.at+o.width,o.top,height);
   const along=o.at+o.width/2;
   if(o.bottom>0&&o.sections){
    // These measurements include profiles, unlike the older clear-glass sashWidths.
    const name=o.name,cy=base+(o.bottom+o.top)/2,h=o.top-o.bottom;
    const piece=(suffix,x,y,w,hh,d,m,z=fixed,solid=false)=>box(parent,name+' · '+suffix,x,y,z,w,hh,d,m,solid,true);
    let cursor=o.at;
    piece('левая рама',cursor+.02,cy,.04,h,.09,mats.white);
    o.sections.forEach((span,i)=>{
     const lo=cursor+(i===0?.04:.02),hi=cursor+span-(i===o.sections.length-1?.04:.02),sw=hi-lo,cx=(lo+hi)/2;
     if(o.operable[i]){
      const parts=[];
      for(const x of [lo+.016,hi-.016])parts.push(piece('профиль створки '+(i+1),x,cy,.032,h-.07,.055,mats.white));
      for(const y of [base+o.bottom+.051,base+o.top-.051])parts.push(piece('профиль створки '+(i+1),cx,y,sw,.032,.055,mats.white));
      parts.push(piece('стекло '+(i+1),cx,cy,sw-.064,h-.134,.016,mats.glass));
      const handleX=i===0?hi-.055:lo+.055;
      parts.push(piece('ручка створки '+(i+1),handleX,cy,.016,.13,.025,mats.white,fixed+.055));
      const item=furnitureSystem.register(parent,{id:'child-window-'+(i+1),label:i===0?'Левая створка окна детской':'Правая створка окна детской',roomId:'room-10',parts,pivot:[i===0?lo:hi,0,fixed],angle:i===0?-Math.PI*.43:Math.PI*.43});
      item.group.userData.sectionWidth=span;
     }else piece('глухое стекло '+(i+1),cx,cy,sw,h-.08,.02,mats.glass,fixed,true);
     cursor+=span;
     piece(i===o.sections.length-1?'правая рама':'импост',cursor-(i===o.sections.length-1?.02:0),cy,.04,h,.09,mats.white);
    });
    for(const yy of [o.bottom+.02,o.top-.02])piece('горизонтальная рама',along,base+yy,o.width,.04,.09,mats.white);
    for(const x of [o.at+.009,o.at+o.width-.009])piece('боковой откос',x,cy,.018,h,thickness,mats.white);
    piece('верхний откос',along,base+o.top-.008,o.width,.016,thickness,mats.white);
   } else if(o.bottom>0&&o.sashWidths){
    const name=o.name||'Окно',openingBox=(suffix,pos,y,span,h,depth,m,solid=false)=>box(parent,name+' · '+suffix,axis==='x'?pos:fixed,y,axis==='x'?fixed:pos,axis==='x'?span:depth,h,axis==='x'?depth:span,m,solid,true);
    const profile=(o.width-o.sashWidths.reduce((sum,w)=>sum+w,0))/(o.sashWidths.length+1);
    let cursor=o.at;
    for(let i=0;i<=o.sashWidths.length;i++){
     const center=cursor+profile/2;
     openingBox('вертикальный профиль',center,base+(o.bottom+o.top)/2,profile,o.top-o.bottom,.08,mats.white);
     cursor+=profile;
     if(i<o.sashWidths.length){const sw=o.sashWidths[i];openingBox('стекло '+(i+1),cursor+sw/2,base+(o.bottom+o.top)/2,sw,o.top-o.bottom-.05,.02,mats.glass,true);cursor+=sw;}
    }
    for(const yy of [o.bottom,o.top])openingBox('горизонтальный профиль',along,base+yy,o.width,.05,.10,mats.white);
    openingBox('подоконник',along,base+o.bottom-.025,o.width+.08,.045,thickness+.10,mats.white);
    for(const pos of [o.at+.009,o.at+o.width-.009])openingBox('боковой откос',pos,base+(o.bottom+o.top)/2,.018,o.top-o.bottom,thickness,mats.white);
    openingBox('верхний откос',along,base+o.top-.008,o.width,.016,thickness,mats.white);
   } else if(o.bottom>0){
    const xx=axis==='x'?along:fixed,zz=axis==='x'?fixed:along;
    box(parent,'Оконное стекло',xx,base+(o.bottom+o.top)/2,zz,axis==='x'?o.width:.04,o.top-o.bottom,axis==='x'?.04:o.width,mats.glass,true,true);
    for(const offset of [-o.width/2,0,o.width/2])box(parent,'Оконная рама',axis==='x'?along+offset:fixed,base+(o.bottom+o.top)/2,axis==='x'?fixed:along+offset,axis==='x'?.055:.08,o.top-o.bottom,axis==='x'?.08:.055,mats.white,false,true);
    for(const yy of [o.bottom,o.top])box(parent,'Оконная рама',xx,base+yy,zz,axis==='x'?o.width:.1,.06,axis==='x'?.1:o.width,mats.white,false,true);
   } else {
    const trim=o.leaf?.material||mats.white;
    for(const offset of [-o.width/2,o.width/2])box(parent,'Дверной наличник',axis==='x'?along+offset:fixed,base+o.top/2,axis==='x'?fixed:along+offset,axis==='x'?.05:thickness+.04,o.top,axis==='x'?thickness+.04:.05,trim,false,true);
    if(o.leaf?.style?.startsWith('wood'))box(parent,'Деревянный верхний наличник',axis==='x'?along:fixed,base+o.top,axis==='x'?fixed:along,axis==='x'?o.width+.05:thickness+.04,.045,axis==='x'?thickness+.04:o.width+.05,trim,false,true);
    if(o.leaf?.id==='entrance')box(parent,'Входная дверь · верхний наличник и откос',fixed,base+o.top,along,thickness+.04,.055,o.width+.05,trim,false,true);
    if(o.leaf)doorSystem.add(parent,{...o.leaf,axis,at:o.at,width:o.width,fixed,base,height:o.top,floor:o.leaf.floor??(base>0?2:1)});
   }
   p=o.at+o.width;
  }make(p,b,0,height);
 }
 const door=(at,width=.9,leaf=null,top=2.1)=>({at,width,bottom:0,top,leaf});
 const win=(at,width=1.35)=>({at,width,bottom:.9,top:2.4});
 rooms.forEach(r=>{
  const [x0,z0,x1,z1]=r.bounds,g=floorGroups[r.floor-1];
  if(r.id==='room-8') {
   box(g,'Пол коридора', (x0+STAIR.holeX0)/2,r.y-.1,(z0+z1)/2,STAIR.holeX0-x0,.2,z1-z0,mats.floor);
   box(g,'Пол у лестницы',(STAIR.holeX0+x1)/2,r.y-.1,(STAIR.z1+z1)/2,x1-STAIR.holeX0,.2,z1-STAIR.z1,mats.floor);
   box(g,'Верхняя площадка',(STAIR.x1+x1)/2,r.y-.1,(z0+STAIR.z1)/2,x1-STAIR.x1,.2,STAIR.z1-z0,mats.floor);
   box(g,'Пол у стены детской',(STAIR.holeX0+STAIR.x1)/2,r.y-.1,(z0+STAIR.holeZ0)/2,STAIR.x1-STAIR.holeX0,.2,STAIR.holeZ0-z0,mats.floor);
  } else {
   const fl=box(g,r.name,(x0+x1)/2,r.y-.1,(z0+z1)/2,x1-x0,.2,z1-z0,['room-4','room-9'].includes(r.id)?mats.tile:mats.floor);fl.userData.roomId=r.id;pickables.push(fl);
  }
  const label={id:r.id,position:new T.Vector3((x0+x1)/2,r.y+.05,(z0+z1)/2)};labels.push(label);
  if(r.floor===1) {
   // Cut the actual opening from every intersecting ceiling, including the
   // living-room edge after aligning the two storeys to exterior measurements.
   for(const [a,b,c,d] of subtract(r.bounds,[STAIR.holeX0,STAIR.holeZ0,STAIR.x1,STAIR.z1]))
    box(ceilings,r.id==='room-3'?'Потолок вокруг лестничного проёма':'Потолок '+r.name,(a+c)/2,3.025,(b+d)/2,c-a,.05,d-b,mats.white);
  } else if(r.id!=='room-6')box(ceilings,'Потолок '+r.name,(x0+x1)/2,r.y+(r.floor===1?3:2.7)+.025,(z0+z1)/2,x1-x0,.05,z1-z0,mats.white);
 });
 const footprint=mesh=>{
  mesh.geometry.computeBoundingBox();const b=mesh.geometry.boundingBox,p=mesh.position;
  return [p.x+b.min.x,p.z+b.min.z,p.x+b.max.x,p.z+b.max.z];
 };
 const upperFloorFootprints=floorGroups[1].children.filter(o=>o.isMesh).map(footprint);
 const g=floorGroups[0];
 const measuredWindow=(at,name)=>({...win(at,LIVING.windowWidth),bottom:LIVING.windowBottom,sashWidths:LIVING.sashWidths,name});
 wall(g,'x',LIVING.x0-EXT,W+EXT,LIVING.z0-EXT/2,0,3,EXT,LIVING.leftWindows.map((at,i)=>measuredWindow(at,'Окно гостиной · левая стена '+(i+1))),mats.brick);
 wall(g,'x',LIVING.x0-EXT,W+EXT,D+EXT/2,0,3,EXT,[{...win(.725,.6),sashWidths:[.52],name:'Окно котельной'},door(1.525,.85,{id:'boiler-yard',label:'Котельная — двор',swing:-1,dark:true,material:mats.entryBrown})],mats.brick);
 wall(g,'z',LIVING.z0,D,LIVING.x0-EXT/2,0,3,EXT,[{...BATHROOM.window,sashWidths:[BATHROOM.window.width-.08],name:'Окно ванной'}],mats.brick);
 wall(g,'z',LIVING.z0,D,W+EXT/2,0,3,EXT,[measuredWindow(LIVING.frontWindow,'Окно гостиной · фронтальная стена'),door(HALL.entrance.at,HALL.entrance.width,{id:'entrance',label:'Входная дверь',hingeSide:'end',swing:-1,dark:true,material:mats.entryBrown},HALL.entrance.height),measuredWindow(9.2,'Окно кабинета')],mats.brick);
 wall(g,'x',LIVING.x0,W,HALL.bounds[1]-.075,0,3,.15,[door(HALL.livingOpening.at,HALL.livingOpening.width,null,HALL.livingOpening.height)]);
 wall(g,'x',LIVING.x0,W,HALL.bounds[3]+.075,0,3,.15,[door(HALL.officeOpening.at,HALL.officeOpening.width,null,HALL.officeOpening.height)]);
 wall(g,'z',HALL.bounds[1],HALL.bounds[3],HALL.bounds[0]-.05,0,3,.1,[door(HALL.bathroom.at,HALL.bathroom.width,{id:'bathroom',label:'Техническая ванная',swing:1})]);
 wall(g,'z',7.99,D,2.56,0,3,.1,[door(8.15,.8,{id:'office-boiler',label:'Кабинет — котельная',swing:1})]);
 // Thresholds ensure connected floor surfaces.
 box(g,'Перекрытие',(LIVING.x0+W)/2,-.16,(LIVING.z0+D)/2,W-LIVING.x0+EXT*2,.12,D-LIVING.z0+EXT*2,mats.wall);
 box(g,'Цоколь дома',(LIVING.x0+W)/2,-.295,(LIVING.z0+D)/2,W-LIVING.x0+EXT*2,.15,D-LIVING.z0+EXT*2,mats.wall);
 const u=floorGroups[1], y=LEVEL;
 const terrace=rooms.find(r=>r.id==='room-6').bounds,terraceStart=terrace[1],parapetZ=terrace[3]+.1;
 const up=UPPER_HALL_PLAN,[rear,childSide,hallFront,bedroomSide]=up.bounds;
 const upperFinishes=upperHallMaterials(mat);
 const upperFace=index=>Array.from({length:6},(_,i)=>i===index?upperFinishes.wall:mats.wall);
 const [childX0,childZ0,childX1,childZ1]=CHILD.bounds;
 wall(u,'x',childX0-.3,CLOSET.bounds[2]+.3,childZ0-.15,y,2.7,.3,[{...CHILD.window,name:'Окно детской'}],mats.osb);
 wall(u,'z',childZ0,childSide,childX0-.15,y,2.7,.3,[],mats.wall);
 wall(u,'z',childSide,bedroomSide,SHOWER.bounds[0]-.15,y,2.7,.3,[{...SHOWER.window,sashWidths:[.545,.545],name:'Окно душевой'}],mats.wall);
 wall(u,'z',bedroomSide,terraceStart,-.33,y,2.7,.3,[],mats.wall);
 wall(u,'z',childZ0,childSide,hallFront+.15,y,2.7,.3,[],mats.wall);
 wall(u,'z',childSide,bedroomSide,hallFront+.15,y,2.7,.3,[{...UPPER_HALL.window,sashWidths:Array(2).fill((UPPER_HALL.window.width-.09)/2),name:'Окно коридора второго этажа'}],upperFace(1));
 wall(u,'z',bedroomSide,terraceStart,hallFront+.15,y,2.7,.3,[],mats.wall);
 wall(u,'x',childX0,rear-.075,childSide-.075,y,2.7,.15,[]);
 wall(u,'x',rear-.075,hallFront,childSide-.075,y,2.7,.15,[door(up.child.at,up.child.width,{id:'child',label:'Детская',swing:1,material:upperFinishes.wood,style:'wood-glazed'})],upperFace(4));
 wall(u,'x',-.18,rear-.075,bedroomSide+.075,y,2.7,.15,[]);
 wall(u,'x',rear-.075,hallFront,bedroomSide+.075,y,2.7,.15,[door(up.bedroom.at,up.bedroom.width,{id:'bedroom',label:'Спальня',swing:-1,material:upperFinishes.wood,style:'wood-plain'})],upperFace(5));
 wall(u,'z',childZ0,childZ1,CHILD.closetPartition.center,y,2.7,CHILD.closetPartition.thickness,[door(CHILD.closetOpening.at,CHILD.closetOpening.width)]);
 wall(u,'z',childSide,bedroomSide,rear-.075,y,2.7,.15,[door(up.bathroom.at,up.bathroom.width,{id:'shower',label:'Душевая',swing:1,material:upperFinishes.darkWood,style:'wood-plain'})],upperFace(0));
 const disposeUpperHall=buildUpperHall(u,{box,cylinder,mats,finishes:upperFinishes});
 const disposeShower=buildShowerRoom(u,ceilings,{box,cylinder,sphere,mat,mats,colliders,pickables,furnitureSystem});
 const disposeChild=buildChildRoom(u,ceilings,{box,cylinder,sphere,mat,mats,colliders});
 wall(u,'x',-.18,7.35,terraceStart-.075,y,2.7,.15,[{...win(2.8,1.8),bottom:.7,top:2.25,sashWidths:[.855,.855],name:'Окно спальни'},door(4.6,.85,{id:'balcony',label:'Спальня — балкон',swing:1,style:'pvc-glazed'},2.25)],mats.osb);
 const disposeBedroom=buildBedroom(u,ceilings,{box,cylinder,sphere,mat,mats,colliders,furnitureSystem,registerWall});
 wall(u,'x',-.33,7.5,parapetZ,y,1.1,.2,[],mats.terraceWood);
 box(u,'Деревянный поручень террасы',3.585,y+1.1,parapetZ,7.89,.065,.25,mats.terraceWood);
 wall(u,'z',terraceStart,parapetZ,-.28,y,2.7,.2,[],mats.osb);
 wall(u,'z',terraceStart,parapetZ,7.45,y,2.7,.2,[],mats.osb);
 for(const x of [1.65,3.5,5.35])box(u,'Стойка мансарды',x,y+1.35,parapetZ,.09,2.7,.1,mats.wood,true);
 box(ceilings,'Потолок мансарды',3.58,y+2.73,12.8+UPPER_Z_SHIFT,7.73,.06,1.5,mats.osb);
 buildInterstoreySlab(u,{
  footprints:[[LIVING.x0-EXT,LIVING.z0-EXT,W+EXT,D+EXT],...upperFloorFootprints,
   ...wallMeshes.filter(o=>o.base===LEVEL&&o.mesh.name==='Стена').map(o=>footprint(o.mesh))],
  floors:upperFloorFootprints,opening:[STAIR.holeX0,STAIR.holeZ0,STAIR.x1,STAIR.z1],
  bottom:3,top:LEVEL,material:mats.wall
 });
 // 15 wooden treads; the sixteenth rise lands on the upper floor itself.
 const s=STAIR,h=LEVEL/s.rises,run=(s.x1-s.width-s.x0)/s.lowerSteps;
 for(let i=0;i<s.lowerSteps;i++){
  box(stairsGroup,'Ступень '+(i+1),s.x0+run*(i+.5),h*(i+1)-.03,s.z0+.45,run+.02,.06,.9,mats.wood);
  box(stairsGroup,'Подступенок '+(i+1),s.x0+run*i+.008,h*(i+.5),s.z0+.45,.018,h,.9,mats.wood);
 }
 const cx=s.x1-s.width,cz=s.z0+s.width;
 for(let i=0;i<s.winderSteps;i++){
  const start=-Math.PI/2+i*Math.PI/(2*s.winderSteps),end=start+Math.PI/(2*s.winderSteps);
  const shape=new T.Shape();shape.moveTo(cx,cz);for(let k=0;k<=8;k++){const a=start+(end-start)*k/8;const dx=Math.cos(a),dz=Math.sin(a),r=.9/Math.max(Math.abs(dx),Math.abs(dz));shape.lineTo(cx+dx*r,cz+dz*r);}shape.closePath();
  const geo=new T.ExtrudeGeometry(shape,{depth:.08,bevelEnabled:false});geo.rotateX(Math.PI/2);const m=new T.Mesh(geo,mats.wood);m.position.y=h*(s.lowerSteps+1+i);m.name='Забежная ступень';m.castShadow=true;stairsGroup.add(m);
  // Close each radial gap from the preceding tread to this winder, just
  // like the straight flights. Local +Z points towards the higher step.
  const dx=Math.cos(start),dz=Math.sin(start),length=s.width/Math.max(Math.abs(dx),Math.abs(dz));
  const riser=box(stairsGroup,'Подступенок '+(s.lowerSteps+1+i),cx+dx*length/2-dz*.008,h*(s.lowerSteps+.5+i),cz+dz*length/2+dx*.008,length,h,.018,mats.wood);
  riser.rotation.y=-start;
 }
 const stepZ=(s.z1-cz)/s.upperSteps,firstUpper=s.lowerSteps+s.winderSteps+1;
 for(let i=0;i<s.upperSteps;i++){
  box(stairsGroup,'Ступень '+(firstUpper+i),s.x1-.45,h*(firstUpper+i)-.03,cz+stepZ*(i+.5),.9,.06,stepZ+.02,mats.wood);
  box(stairsGroup,'Подступенок '+(firstUpper+i),s.x1-.45,h*(firstUpper-.5+i),cz+stepZ*i+.008,.9,h,.018,mats.wood);
 }
 const disposeStairSupports=buildStairSupports(stairsGroup,{box,mat});
 const {ledMaterial,ledLight,disposeArtwork}=buildOffice(g,{box,cylinder,sphere,mat,mats,colliders,pickables,deviceMeshes,furnitureSystem});
 const disposeHall=buildHall(g,{box,cylinder,mats,mat,furnitureSystem});
 const disposeRobot=buildRobotVacuum(g,{box,cylinder,mat,pickables,deviceMeshes});
 const disposeLiving=buildLiving(g,ceilings,{box,cylinder,mat,mats,colliders,pickables,deviceMeshes});
 const disposeBathroom=buildBathroom(g,ceilings,{box,cylinder,sphere,mat,colliders,pickables});
 const disposeBoilerRoom=buildBoilerRoom(g,ceilings,{box,cylinder,sphere,mat,mats,colliders,pickables});
 const switchVisuals=buildSwitches(g,{mats,pickables,deviceMeshes});
 buildHallLights(ceilings,{box,cylinder,mat,mats,pickables});
 // Roof four sloping surfaces and two gables.
 const exterior=buildExteriorDetails(roofGroup,site,{box,mat,mats});
 const roofProfile=[[exterior.metalX0,3.23],[-.50,6.02],[3.58,7.12],[7.67,6.02],[exterior.metalX1,3.23]],back=exterior.metalBack+.03,front=exterior.metalFront-.03;
 function roofQuad(points,material,name='Скат крыши'){
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(points.flat(),3));geo.setAttribute('uv',new T.Float32BufferAttribute([0,0,1,0,1,1,0,1],2));geo.setIndex([0,2,1,0,3,2]);geo.computeVertexNormals();
  const mesh=new T.Mesh(geo,material);if(material===mats.osb)projectFacadeUV(mesh,1,1);material.side=T.DoubleSide;mesh.name=name;mesh.castShadow=mesh.receiveShadow=true;roofGroup.add(mesh);
 }
 for(let i=0;i<4;i++){
  const [xa,ya]=roofProfile[i],[xb,yb]=roofProfile[i+1];
  if(i===0){
   // Open the lower roof slope outside the measured shower window too.
   const w=SHOWER.window,lo=LEVEL+w.bottom-.04,hi=LEVEL+w.top+.04,z0=w.at-.04,z1=w.at+w.width+.04;
   const atY=y=>xa+(xb-xa)*(y-ya)/(yb-ya),xl=atY(lo),xh=atY(hi),face=SHOWER.bounds[0]-.3;
   roofQuad([[xa,ya,front],[xb,yb,front],[xb,yb,z0],[xa,ya,z0]],mats.roof);
   roofQuad([[xa,ya,z1],[xb,yb,z1],[xb,yb,back],[xa,ya,back]],mats.roof);
   roofQuad([[xa,ya,z0],[xl,lo,z0],[xl,lo,z1],[xa,ya,z1]],mats.roof);
   roofQuad([[xh,hi,z0],[xb,yb,z0],[xb,yb,z1],[xh,hi,z1]],mats.roof);
   for(const z of [z0,z1])roofQuad([[face,lo,z],[xl,lo,z],[xh,hi,z],[face,hi,z]],mats.white,'Откос душевой в скате');
   continue;
  }
  if(i!==3){roofQuad([[xa,ya,front],[xb,yb,front],[xb,yb,back],[xa,ya,back]],mats.roof);continue;}
  // Recessed upper-hall window: leave a real opening in the outer slope.
  const w=UPPER_HALL.window,lo=LEVEL+w.bottom-.04,hi=LEVEL+w.top+.04,z0=w.at-.04,z1=w.at+w.width+.04;
  const atY=y=>xa+(xb-xa)*(y-ya)/(yb-ya),xl=atY(lo),xh=atY(hi);
  roofQuad([[xa,ya,front],[xb,yb,front],[xb,yb,z0],[xa,ya,z0]],mats.roof);
  roofQuad([[xa,ya,z1],[xb,yb,z1],[xb,yb,back],[xa,ya,back]],mats.roof);
  roofQuad([[xa,ya,z0],[xh,hi,z0],[xh,hi,z1],[xa,ya,z1]],mats.roof);
  roofQuad([[xl,lo,z0],[xb,yb,z0],[xb,yb,z1],[xl,lo,z1]],mats.roof);
  for(const z of [z0,z1])roofQuad([[7.65,lo,z],[xl,lo,z],[xh,hi,z],[7.65,hi,z]],mats.white,'Откос окна в скате');
  roofQuad([[7.65,lo,z0],[xl,lo,z0],[xl,lo,z1],[7.65,lo,z1]],mats.white,'Нижний откос окна в скате');
 }
 for(const z of [childZ0-.3,parapetZ]){
  const shape=new T.Shape();shape.moveTo(-.50,5.92);shape.lineTo(-.50,6.02);shape.lineTo(3.58,7.12);shape.lineTo(7.67,6.02);shape.lineTo(7.67,5.92);shape.closePath();
  const mesh=new T.Mesh(new T.ShapeGeometry(shape),mats.osb);mesh.position.z=z;projectFacadeUV(mesh,1,1);mesh.material.side=T.DoubleSide;mesh.name='Фронтон';roofGroup.add(mesh);
 }
 // Close the narrow wedges between the steep roof and the vertical gable wall.
 // These are facade cheeks at the wall plane, not a screen across the overhang.
 for(const [low,knee,face] of [[roofProfile[0],roofProfile[1],childX0-.3],[roofProfile[4],roofProfile[3],CLOSET.bounds[2]+.3]]){
  roofQuad([[low[0],low[1],childZ0-.301],[knee[0],knee[1],childZ0-.301],[face,knee[1],childZ0-.301],[face,LEVEL,childZ0-.301]],mats.osb,'Торцевая обшивка между скатом и стеной');
 }
 // Solid cheeks frame the recessed balcony all the way to the roof slopes.
 // Their inner edges meet the side walls; the central balcony stays open.
 for(const [low,knee,face] of [[roofProfile[0],roofProfile[1],-.18],[roofProfile[4],roofProfile[3],7.35]]){
  roofQuad([[low[0],low[1],parapetZ],[knee[0],knee[1],parapetZ],[face,knee[1],parapetZ],[face,LEVEL,parapetZ]],mats.osb,'Боковая обшивка балкона до ската');
 }
 // Exposed timber battens span from the facade to the verge beneath the sheet.
 // Their tops follow each roof pitch; the 3 cm sheet lip remains visible.
 for(const [wallZ,tipZ] of [[childZ0-.3,front+.06],[parapetZ,back-.06]]){
  const depth=Math.abs(wallZ-tipZ),centerZ=(wallZ+tipZ)/2;
  for(let i=0;i<4;i++){
   const [xa,ya]=roofProfile[i],[xb,yb]=roofProfile[i+1],dx=xb-xa,dy=yb-ya,length=Math.hypot(dx,dy),angle=Math.atan2(dy,dx);
   const verge=box(roofGroup,'Деревянная ветровая доска',(xa+xb)/2+Math.sin(angle)*.06,(ya+yb)/2-Math.cos(angle)*.06,tipZ,length,.11,.06,mats.fascia);verge.rotation.z=angle;
   const count=Math.ceil(length/.34);
   for(let j=1;j<count;j++){
    const t=j/count;
    const timber=box(roofGroup,'Деревянная балка под свесом крыши',xa+dx*t+Math.sin(angle)*.045,ya+dy*t-Math.cos(angle)*.045,centerZ,.09,.075,depth+.06,mats.fascia);timber.rotation.z=angle;
   }
  }
 }
 // Clear gap is measured from the new outer face of the 67 cm front wall.
 const annexX=W+EXT+GAP, annexWidth=4.1;
 const disposeSite=buildSite(site,{box,cylinder,sphere,wall,win,door,mat,mats,annexX,annexWidth,houseEdge:W+EXT});
 // Common infinite presentation ground is separate from site visibility.
 const ground=box(scene,'Основание сцены',4,-.42,6,200,.1,200,mats.ground);ground.castShadow=false;
 const ceilingLayers=ceilings.children.map(mesh=>({mesh,belowUpper:new T.Box3().setFromObject(mesh).max.y<=LEVEL}));
 function applyView(floor,mode) {
  const walk=mode==='walk';
  // Like a dollhouse: keep all lower storeys intact under the selected storey.
  floorGroups.forEach((f,i)=>f.visible=walk||floor===0||i+1<=floor);
  site.visible=walk||floor===0;roofGroup.visible=walk||floor===0;
  ceilings.visible=walk||floor===2;
  ceilingLayers.forEach(({mesh,belowUpper})=>{mesh.visible=walk||(floor===2&&belowUpper);});
  wallMeshes.forEach(o=>{
   const selectedFloor=o.base===LEVEL?2:1;
   const cap=!walk&&floor===selectedFloor?o.base+1.45:Infinity;
   const top=Math.min(o.top,cap);o.mesh.visible=top>o.bottom;
   if(o.mesh.visible){
    const ratio=(top-o.bottom)/o.height;
    o.mesh.scale.y=ratio;o.mesh.position.y=(top+o.bottom)/2;
    // Crop the mural's UVs along with the plane instead of squeezing the whole image.
      if(o.uv){
       const {uv,position,normal}=o.mesh.geometry.attributes,tileHeight=o.mesh.userData.facadeTileHeight;
       for(let i=0;i<uv.count;i++){
        const crop=tileHeight?(Math.abs(normal.getY(i))<.5?(1-ratio)*(position.getY(i)-o.mesh.geometry.boundingBox.min.y)/tileHeight:0):o.uv[i*2+1]*(1-ratio);
        uv.setY(i,o.uv[i*2+1]-crop);
       }
       uv.needsUpdate=true;
      }
   }
  });
  // Fixtures and tall furniture remain full height; structure is deliberately cut away.
 }
 function setDeskLight(on,color='#eec68b',brightness=1) {ledMaterial.emissive.set(color);ledMaterial.emissiveIntensity=on?brightness*3:0;ledLight.color.set(color);ledLight.intensity=on?brightness*8:0;}
 function dispose(){disposeSite();disposeChild();disposeShower();disposeBoilerRoom();disposeHall();disposeRobot();disposeBathroom();disposeBedroom();disposeUpperHall();upperFinishes.dispose();disposeStairSupports();doorSystem.dispose();switchVisuals.dispose();disposeArtwork();disposeLiving();root.traverse(o=>{o.geometry?.dispose();});Object.values(mats).forEach(m=>m.dispose());[floorTex,brickTex,osbTex,roofTex,terraceWoodTex].forEach(t=>t.dispose());root.removeFromParent();ground.geometry.dispose();ground.removeFromParent();}
 root.scale.x=-1;root.position.x=W;
 for(const b of colliders){const min=b.minX;b.minX=mirrorX(b.maxX);b.maxX=mirrorX(min);}
 for(const label of labels)label.position.x=mirrorX(label.position.x);
 root.updateMatrixWorld(true);
 return {root,colliders,pickables,deviceMeshes,labels,doorSystem,furnitureSystem,applyView,setDeskLight,setSwitchStates:switchVisuals.setStates,dispose,annexX:mirrorX(annexX+annexWidth),annexWidth};
}

