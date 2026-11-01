import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {buildHouse} from '../src/model/buildHouse.js';
import {moveWalker,walkBlocked,routeToFloor,followStairRoute} from '../src/scene/walkNavigation.js';
import {pickSurface,roomForSurface} from '../src/scene/picking.js';
import {OFFICE,mirrorX,STAIR,stairHeight,entrance,HALL,officeDoor,LIVING,BATHROOM,W,EXTERIOR_THICKNESS,GAP,devices,LEVEL,UPPER_HALL_PLAN,SHOWER,CHILD,CLOSET,planRooms} from '../src/model/layout.js';

// Geometry-only canvas stub: drawing is visually checked in the browser separately.
const ctx=new Proxy({}, {get:(o,k)=>o[k]??(()=>{})});
globalThis.document={createElement:()=>({width:512,height:512,getContext:()=>ctx})};
const model=buildHouse(new T.Scene());model.applyView(0,'walk');model.root.updateMatrixWorld(true);
const named=name=>model.root.getObjectByName(name);

test('Кабина: две перпендикулярные створки раздвигаются от угла независимо, вместе с ручками',()=>{
 const front=named('Стеклянная передняя дверь кабины'),side=named('Стеклянная правая дверь кабины');
 const fh=named('Ручка передней двери кабины'),sh=named('Ручка правой двери кабины');
 const position=o=>o.getWorldPosition(new T.Vector3());
 const f0=position(front),s0=position(side),fh0=position(fh),sh0=position(sh);
 const fs=new T.Box3().setFromObject(front).getSize(new T.Vector3()),ss=new T.Box3().setFromObject(side).getSize(new T.Vector3());
 assert.ok(fs.z>.5&&fs.x<.02);assert.ok(ss.x>.35&&ss.z<.02,'Правая дверь на боковой грани');
 const checkJoint=()=>{
  const a=new T.Box3().setFromObject(named('Стыковой профиль передней двери'));
  const b=new T.Box3().setFromObject(named('Стыковой профиль правой двери'));
  assert.ok(Math.abs(a.max.x-b.min.x)<1e-7,'Закрытые створки сходятся стык в стык без зазора и пересечения');
  for(const axis of ['y','z']){
   assert.ok(Math.abs(a.min[axis]-b.min[axis])<1e-7);
   assert.ok(Math.abs(a.max[axis]-b.max[axis])<1e-7);
  }
 };
 checkJoint();
 try{
  assert.equal(model.furnitureSystem.toggle('shower-front-door'),true);model.furnitureSystem.update(1);
  const delta=position(front).sub(f0);
  assert.ok(delta.z<-.5&&Math.abs(delta.x)<1e-8,'Передняя дверь скользит влево');
  assert.ok(position(fh).sub(fh0).distanceTo(delta)<1e-8);
  assert.ok(position(side).distanceTo(s0)<1e-8,'Боковая дверь остаётся закрыта');
  assert.equal(model.furnitureSystem.toggle('shower-right-door'),true);model.furnitureSystem.update(1);
  const sideDelta=position(side).sub(s0);
  assert.ok(sideDelta.x>.35&&Math.abs(sideDelta.z)<1e-8,'Правая дверь скользит к задней стенке');
  assert.ok(position(sh).sub(sh0).distanceTo(sideDelta)<1e-8);
 }finally{
  for(const id of ['shower-front-door','shower-right-door'])if(model.furnitureSystem.items.find(i=>i.id===id).open)model.furnitureSystem.toggle(id);
  model.furnitureSystem.update(1);
 }
 assert.ok(position(front).distanceTo(f0)<1e-8);assert.ok(position(side).distanceTo(s0)<1e-8);
 checkJoint();
});

test('Выбор комнаты в обзоре работает поверх ковров, мебели и составного пола коридора',()=>{
 try{
  model.applyView(2,'overview');model.root.updateMatrixWorld(true);
  for(const [name,id] of [['Большой ковёр спальни','room-7'],['Матрас детской','room-10'],['Полка гардеробной','room-11'],['Пол коридора','room-8']]){
   const point=named(name).getWorldPosition(new T.Vector3());
   const ray=new T.Raycaster(new T.Vector3(point.x,LEVEL+2.6,point.z),new T.Vector3(0,-1,0));
   const hit=pickSurface(ray,model.root);
   assert.equal(roomForSurface(hit,2)?.id,id,name);
   assert.equal(roomForSurface(hit,1),null,'Нельзя выбрать другой этаж');
  }
  assert.equal(roomForSurface(null,2),null);
  const outside=new T.Raycaster(new T.Vector3(-10,10,-10),new T.Vector3(0,-1,0));
  assert.equal(roomForSurface(pickSurface(outside,model.root),2),null,'Участок не выбирает комнату');
  model.applyView(1,'overview');model.root.updateMatrixWorld(true);
  const floor=named('Кабинет'),point=floor.getWorldPosition(new T.Vector3());
  const ray=new T.Raycaster(new T.Vector3(point.x,8,point.z),new T.Vector3(0,-1,0));
  assert.equal(roomForSurface(pickSurface(ray,model.root),1)?.id,'room-2','Скрытый второй этаж не перехватывает клик');
 }finally{model.applyView(0,'walk');model.root.updateMatrixWorld(true);}
});

test('Обзор этажей: нижний этаж целый, выбранный срезан вместе с отделкой, прогулка восстанавливает стены',()=>{
 const lower=named('Этаж 1'),upper=named('Этаж 2'),wall=lower.children.find(o=>o.name==='Стена');
 const finish=named('Обои спальни · торец кровати'),mural=named('Фотообои · золотые листья');
 const highFinish=named('Обои над входом в спальню');
 const boilerFinish=named('Зелёная стена с трубами'),boilerHeader=named('Над входом из кабинета');
 const bounds=o=>{model.root.updateMatrixWorld(true);return new T.Box3().setFromObject(o);};
 const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
 const originalMuralUv=mural.geometry.attributes.uv.array.slice();
 try{
  for(let cycle=0;cycle<2;cycle++){
   model.applyView(2,'overview');
   assert.equal(lower.visible,true);assert.equal(upper.visible,true);
   near(bounds(wall).max.y,3);
   near(bounds(boilerFinish).max.y,3);assert.equal(boilerHeader.visible,true);
   near(bounds(finish).max.y,LEVEL+1.45);near(bounds(finish).min.y,LEVEL);
   near(bounds(mural).max.y,LEVEL+1.45);
   assert.equal(highFinish.visible,false);
   assert.ok(Math.max(...mural.geometry.attributes.uv.array.filter((_,i)=>i%2))<.6,'Фотообои обрезаны без сжатия рисунка');
   assert.equal(named('Крыша').visible,false);
   assert.equal(named('Потолки').visible,true);
   assert.equal(named('Потолок вокруг лестничного проёма').visible,true);
   assert.equal(named('Потолок Спальня').visible,false);
   model.applyView(1,'overview');
   assert.equal(lower.visible,true);assert.equal(upper.visible,false);
   near(bounds(wall).max.y,1.45);assert.equal(named('Потолки').visible,false);
   near(bounds(boilerFinish).max.y,1.45);assert.equal(boilerHeader.visible,false);
   for(const part of named('Котельная по фотографиям').children.filter(o=>['Стена вешалки и щитков','Стена со стремянкой','Шов обшивки','Горизонтальный шов обшивки'].includes(o.name))){
    if(part.visible)assert.ok(bounds(part).max.y<=1.450001,'Обшивка и швы котельной не выступают над срезом');
   }
   model.applyView(0,'overview');
   assert.equal(lower.visible,true);assert.equal(upper.visible,true);assert.equal(named('Крыша').visible,true);
   near(bounds(finish).max.y,LEVEL+2.7);
   model.applyView(2,'walk');
   assert.equal(highFinish.visible,true);assert.equal(named('Потолок Спальня').visible,true);
   near(bounds(boilerFinish).max.y,3);assert.equal(boilerHeader.visible,true);
   near(bounds(finish).max.y,LEVEL+2.7);near(bounds(mural).max.y,LEVEL+2.68);
   assert.deepEqual(mural.geometry.attributes.uv.array,originalMuralUv);
  }
 }finally{model.applyView(0,'walk');model.root.updateMatrixWorld(true);}
});

test('Межэтажное перекрытие закрывает стык фасада, сохраняет лестничный проём и отделку пола',()=>{
 const slab=named('Межэтажное перекрытие');
 try{
  model.applyView(0,'overview');model.root.updateMatrixWorld(true);
  const b=new T.Box3().setFromObject(slab);
  close(b.min.y,3);close(b.max.y,LEVEL);
  for(const y of [3.015,3.12,3.22]){
   const ray=new T.Raycaster(new T.Vector3(mirrorX(4),y,LIVING.z0-EXTERIOR_THICKNESS-1),new T.Vector3(0,0,1));
   assert.ok(ray.intersectObject(slab).length>0,'Щель под фасадом детской закрыта на всей высоте');
  }
  const hole=new T.Raycaster(new T.Vector3(mirrorX((STAIR.holeX0+STAIR.x1)/2),LEVEL+1,(STAIR.holeZ0+STAIR.z1)/2),new T.Vector3(0,-1,0));
  assert.equal(hole.intersectObject(slab).length,0,'Перекрытие не заделывает лестницу');
  const child=named('Детская'),p=child.getWorldPosition(new T.Vector3());
  const floorRay=new T.Raycaster(new T.Vector3(p.x,LEVEL+.1,p.z),new T.Vector3(0,-1,0));
  assert.equal(floorRay.intersectObjects([child,slab])[0].object,child,'Текстурированный пол остаётся выше перекрытия');
  model.applyView(1,'overview');assert.equal(slab.parent.visible,false);
  model.applyView(2,'overview');assert.equal(slab.parent.visible,true);
 }finally{model.applyView(0,'walk');model.root.updateMatrixWorld(true);}
});

test('Наружные обмеры: уступ 43 см, металл 66 см с выпуском 4 см и утопленный фасад 19 см',()=>{
 const box=name=>new T.Box3().setFromObject(named(name));
 const lowerZ=LIVING.z0-EXTERIOR_THICKNESS,upperZ=CHILD.bounds[1]-.30;
 const soffit=box('Нижняя обшивка карниза · гостиная'),metal=box('Рифлёный карниз детской');
 close(upperZ-lowerZ,.19);close(lowerZ-soffit.min.z,.43);
 close(upperZ-metal.min.z,.66);close(soffit.min.z-metal.min.z,.04);
 const positions=named('Рифлёный карниз детской').geometry.attributes.position;
 assert.ok(positions.getY(0)>positions.getY(1),'Лист имеет уклон от стены');
 assert.ok(Math.abs(positions.getY(0)-positions.getY(2))>.001,'Край имеет объёмную волну');
 const sideRear=box('Нижняя обшивка карниза · задняя сторона'),sideFront=box('Нижняя обшивка карниза · входная сторона');
 close(sideRear.max.x-mirrorX(LIVING.x0-EXTERIOR_THICKNESS),.39);
 close(mirrorX(W+EXTERIOR_THICKNESS)-sideFront.min.x,.38);
 const shed=box('Правая часть фасада сарая');
 close(shed.min.x,mirrorX(LIVING.x0-EXTERIOR_THICKNESS));
});

test('Торец крыши закрыт, свес накрывает карниз, сарай заканчивается перед окном ванной',()=>{
 const cheeks=[];model.root.traverse(o=>{if(o.name==='Торцевая обшивка между скатом и стеной')cheeks.push(o);});
 for(const x of [-.52,7.8]){
  const ray=new T.Raycaster(new T.Vector3(mirrorX(x),4.3,CHILD.bounds[1]-1),new T.Vector3(0,0,1));
  assert.ok(ray.intersectObjects(cheeks).length,'Нет просвета между скатом и фасадом');
 }
 const apron=new T.Box3().setFromObject(named('Рифлёный карниз детской'));
 const slopes=[];model.root.traverse(o=>{if(o.name==='Скат крыши')slopes.push(o);});
 for(const x of [-.58,1,5.8,7.9]){
  const ray=new T.Raycaster(new T.Vector3(mirrorX(x),8,apron.min.z-.01),new T.Vector3(0,-1,0));
  assert.ok(ray.intersectObjects(slopes).length,'Все четыре ската накрывают край карниза');
 }
 assert.ok(named('Деревянная балка под свесом крыши'));
 assert.equal(named('Наружная лестница у гостиной'),undefined);
 const shedEnd=new T.Box3().setFromObject(named('Обшивка рядом с дворовой дверью')).max.z;
 close(BATHROOM.window.at-shedEnd,.60);
 assert.ok(named('Дверь сарая со двора'));
 assert.ok(named('Чёрная ручка дворовой двери'));
});

test('Кирпичная кладка сохраняет размер и ряды на всех фрагментах фасада и при срезе стен',()=>{
 const walls=[];
 model.root.traverse(o=>{if(o.name==='Стена'&&o.userData.facadeTileHeight===.96)walls.push(o);});
 assert.ok(walls.length>12,'Проверяются простенки, участки над и под окнами');
 try{
  for(const [floor,mode] of [[0,'overview'],[1,'overview'],[0,'walk']]){
   model.applyView(floor,mode);
   for(const wall of walls){
    if(!wall.visible)continue;
    const {position,normal,uv}=wall.geometry.attributes;
    for(let i=0;i<position.count;i++){
     if(Math.abs(normal.getY(i))>.5)continue;
     const along=Math.abs(normal.getX(i))>.5?position.getZ(i)+wall.position.z:position.getX(i)+wall.position.x;
     const height=position.getY(i)*wall.scale.y+wall.position.y;
     assert.ok(Math.abs(uv.getX(i)-along/1.2)<1e-5,'Единый горизонтальный масштаб и начало узора');
     assert.ok(Math.abs(uv.getY(i)-height/.96)<1e-5,'Ряды совпадают по высоте, в том числе над окнами');
    }
   }
  }
 }finally{model.applyView(0,'walk');model.root.updateMatrixWorld(true);}
});

test('После привязки этажей потолки нижних комнат не перекрывают лестничный проём',()=>{
 const ceilings=named('Потолки').children.filter(o=>o.name.startsWith('Потолок '));
 for(let z=STAIR.holeZ0+.03;z<STAIR.z1;z+=.09){
  const ray=new T.Raycaster(new T.Vector3(mirrorX((STAIR.holeX0+STAIR.x1)/2),3.1,z),new T.Vector3(0,-1,0),0,.2);
  assert.equal(ray.intersectObjects(ceilings).length,0,`Проём свободен на Z=${z}`);
 }
});

test('Детская: обмеренные стены, проход и трёхсекционное окно с двумя подвижными створками',()=>{
 const [x0,z0,x1,z1]=CHILD.bounds,w=CHILD.window,p=CHILD.closetOpening;
 const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
 near(x1-x0,5.31);near(z1-z0,3.51);near(CLOSET.bounds[2]-CLOSET.bounds[0],2.03);near(CLOSET.bounds[3]-CLOSET.bounds[1],3.51);
 near(x1-w.at-w.width,.39);near(w.width,2.45);near(w.at-x0,2.47);
 near(z1-p.at-p.width,.42);near(p.width,.70);near(p.at-z0,2.39);
 near(x1-CHILD.door.at-CHILD.door.width,1.08);near(CHILD.door.width,.80);near(CHILD.door.at-x0,3.43);
 near(CHILD.closetPartition.center-CHILD.closetPartition.thickness/2,x1);
 near(CHILD.closetPartition.center+CHILD.closetPartition.thickness/2,CLOSET.bounds[0]);
 const floorBox=new T.Box3().setFromObject(named('Детская'));
 near(floorBox.max.x-floorBox.min.x,5.31);near(floorBox.max.z-floorBox.min.z,3.51);
 const left=named('Окно детской · стекло 1'),middle=named('Окно детской · глухое стекло 2'),right=named('Окно детской · стекло 3');
 const position=o=>o.getWorldPosition(new T.Vector3()),before=[left,middle,right].map(position);
 assert.equal(middle.userData.furnitureId,undefined);
 const sashes=model.furnitureSystem.items.filter(i=>i.id.startsWith('child-window-'));
 assert.equal(sashes.length,2);assert.deepEqual(w.sections,[.63,1.19,.63]);
 for(const glass of [left,middle,right]){
  const p=position(glass),ray=new T.Raycaster(new T.Vector3(p.x,LEVEL+2.05,z0+.60),new T.Vector3(0,0,-1));
  assert.equal(pickSurface(ray,model.root)?.object.name,glass.name,'Из комнаты видно стекло, проём не перекрыт стеной или обоями');
 }
 try{
  for(const item of sashes)model.furnitureSystem.toggle(item.id);
  model.furnitureSystem.update(1);
  assert.ok(position(left).distanceTo(before[0])>.2);assert.ok(position(right).distanceTo(before[2])>.2);
  near(position(middle).distanceTo(before[1]),0);
  model.applyView(2,'overview');model.applyView(2,'walk');
  near(position(left).y,before[0].y);near(position(right).y,before[2].y);
 }finally{for(const item of sashes)if(item.open)model.furnitureSystem.toggle(item.id);model.furnitureSystem.update(1);model.applyView(0,'walk');}
 for(let i=0;i<3;i++)near(position([left,middle,right][i]).distanceTo(before[i]),0);
});

test('Детская: вход, путь к окну и гардеробной свободны, мебель учитывается при прогулке',()=>{
 const d=UPPER_HALL_PLAN.child,x=d.at+d.width/2;
 model.doorSystem.toggle('child');model.doorSystem.update(1);
 try{
 const passageZ=CHILD.closetOpening.at+CHILD.closetOpening.width/2,aisleX=(CLOSET.bounds[0]+CLOSET.bounds[2])/2;
 for(let z=4.7;z>CHILD.bounds[1]+.55;z-=.04)assert.equal(walkBlocked(model,mirrorX(x),z,LEVEL),false,`Вход и путь к окну: ${z}`);
 for(let xx=x;xx<aisleX;xx+=.04)assert.equal(walkBlocked(model,mirrorX(xx),passageZ,LEVEL),false,`Проход в гардеробную: ${xx}`);
 for(let z=passageZ;z>CLOSET.bounds[1]+.85;z-=.04)assert.equal(walkBlocked(model,mirrorX(aisleX),z,LEVEL),false,`Проход гардеробной: ${z}`);
 for(const [xx,z]of [[.94,1.92],[1.95,3.72],[4.70,1.25]])assert.equal(walkBlocked(model,mirrorX(xx),z,LEVEL),true,'Мебель останавливает движение');
 const lamp=named('Лампа детской · воздушный шар');assert.ok(lamp);assert.equal(lamp.children.filter(o=>o.name==='Ажурное ребро воздушного шара').length,36);
 assert.ok(named('Золотистая корзинка воздушного шара'));assert.ok(named('Синтезатор детской'));
 }finally{model.doorSystem.toggle('child');model.doorSystem.update(1);}
});

test('Гардеробная: при взгляде от входа шкафы слева, доска и сушилка справа',()=>{
 const aisleX=mirrorX(6.35);
 for(const name of ['Полка гардеробной','Комод гардеробной','Штанга одежды гардеробной']){
  assert.ok(named(name).getWorldPosition(new T.Vector3()).x<aisleX,`${name} слева`);
 }
 for(const name of ['Гладильная доска','Рама сушилки']){
  assert.ok(named(name).getWorldPosition(new T.Vector3()).x>aisleX,`${name} справа`);
 }
 for(const name of ['Полка гардеробной','Комод гардеробной','Гладильная доска','Рама сушилки']){
  const p=named(name).getWorldPosition(new T.Vector3());
  assert.equal(walkBlocked(model,p.x,p.z,LEVEL),true,'Переставленная мебель учитывается при прогулке');
 }
 assert.equal(named('Гладильная доска').parent.name,'Гардеробная при детской');
});

test('Душевая: обмеры, настоящее окно и свободный путь от двери к сантехнике',()=>{
 const [x0,z0,x1,z1]=SHOWER.bounds,w=SHOWER.window;
 const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
 close(x1-x0,2.38);close(z1-z0,3.93);close(w.at-z0,1.83);close(w.width,1.18);close(z1-w.at-w.width,.92);
 close(SHOWER.door.at-z0,1.61);close(z1-SHOWER.door.at-SHOWER.door.width,1.62);
 const ray=new T.Raycaster(new T.Vector3(mirrorX(x0+.4),LEVEL+1.12,w.at+.25),new T.Vector3(1,0,0));
 const hit=pickSurface(ray,model.root);
 assert.equal(hit?.object.name,'Окно душевой · стекло 1','Окно не перекрыто облицовкой или скатом крыши');
 assert.ok(named('Поддон душевой кабины'));assert.ok(named('Раковина душевой'));assert.ok(named('Бачок унитаза душевой'));
 const doorZ=SHOWER.door.at+SHOWER.door.width/2;
 assert.equal(walkBlocked(model,mirrorX(x1+.075),doorZ,LEVEL),true,'Закрытая дверь');
 model.doorSystem.toggle('shower');model.doorSystem.update(1);
 for(let x=x1+.4;x>x0+.6;x-=.025)assert.equal(walkBlocked(model,mirrorX(x),doorZ,LEVEL),false,`Вход и проход до окна: ${x}`);
 for(let z=z0+.75;z<z1-.95;z+=.04)assert.equal(walkBlocked(model,mirrorX(x1-.9),z,LEVEL),false,`Проход между кабиной и сантехникой: ${z}`);
 assert.equal(walkBlocked(model,mirrorX(x0+.46),z0+.64,LEVEL),true,'Кабина учитывается при прогулке');
 model.doorSystem.toggle('shower');model.doorSystem.update(1);
});

test('Клик из котельной выбирает дверь, а не декоративные линии соседнего кабинета',()=>{
 const from=new T.Vector3(mirrorX(1.70),1.62,9.3),target=new T.Vector3(mirrorX(1.95),1.2,12.445);
 const ray=new T.Raycaster(from,target.sub(from).normalize());
 const hit=pickSurface(ray,model.root);
 assert.equal(hit?.object.userData.doorId,'boiler-yard');
 const x=mirrorX(1.95),z=12.445;
 assert.equal(walkBlocked(model,x,z,0),true);
 assert.equal(model.doorSystem.toggle(hit.object.userData.doorId,[from.x,from.z,0]),true);
 model.doorSystem.update(1);
 for(let zz=11.9;zz<12.9;zz+=.025)assert.equal(walkBlocked(model,x,zz,0),false,'Открытая дверь выпускает во двор');
 model.doorSystem.toggle('boiler-yard');model.doorSystem.update(1);
 assert.equal(walkBlocked(model,x,z,0),true);
 assert.equal(pickSurface(ray,model.root)?.object.userData.doorId,'boiler-yard');
});

test('Котельная: окно слева от наружной двери, проход между оборудованием свободен',()=>{
 const door=model.doorSystem.doors.find(d=>d.id==='boiler-yard');
 const pane=named('Окно котельной · стекло 1'),windowBounds=new T.Box3().setFromObject(pane);
 assert.ok(windowBounds.min.x>mirrorX(door.hinge.position.x),'Слева при взгляде изнутри на наружную стену');
 const ray=new T.Raycaster(new T.Vector3(mirrorX(1.025),2.15,11.95),new T.Vector3(0,0,1));
 assert.equal(ray.intersectObject(model.root,true)[0].object,pane,'Проём окна не перекрыт стеной или оборудованием');
 for(let z=8.6;z<12.05;z+=.05)assert.equal(walkBlocked(model,mirrorX(1.70),z,0),false,`Проход котельной на ${z}`);
 assert.equal(walkBlocked(model,mirrorX(.92),11.24,0),true,'Котёл учитывается при прогулке');
 assert.equal(walkBlocked(model,mirrorX(2.29),9.62,0),true,'Стремянка учитывается при прогулке');
});

test('Xiaomi S20+ находится под нижним маршем и выбирается как устройство коридора',()=>{
 const id='hall-robot-vacuum',device=devices.find(d=>d.id===id),group=model.deviceMeshes[id];
 assert.equal(device.roomId,'room-3');assert.equal(device.kind,'robot-vacuum');
 const body=named('Белый круглый корпус Xiaomi S20+'),bounds=new T.Box3().setFromObject(group),center=new T.Box3().setFromObject(body).getCenter(new T.Vector3());
 assert.ok(model.pickables.includes(body));assert.equal(body.userData.deviceId,id);
 assert.ok(bounds.min.x>mirrorX(STAIR.x1)&&bounds.max.x<mirrorX(STAIR.x0));
 assert.ok(bounds.min.z>STAIR.z0&&bounds.max.z<STAIR.z0+STAIR.width);
 assert.ok(bounds.max.y<stairHeight(center.x,center.z)-.1,'Корпус и лидар ниже ступеней');
});

test('Прогулка поднимается из прихожей по всем ступеням и возвращается без телепортации',()=>{
 let state={x:.65,z:entrance.position[2],feet:0};
 const heights=new Set([0]),obstacle=(x,z,y)=>walkBlocked(model,x,z,y);
 for(const floor of [2,1]){
  const route=routeToFloor(state,floor);
  for(let frame=0;route.length&&frame<2400;frame++){
   const before=state,result=followStairRoute(state,route,1.1/60,obstacle);state=result.state;
   assert.equal(result.blocked,false,`Маршрут ${floor}, ${JSON.stringify(state)}`);
   assert.ok(Math.hypot(state.x-before.x,state.z-before.z)<=1.1/60+.001);
   assert.ok(Math.abs(state.feet-before.feet)<=LEVEL/16+.001);
   heights.add(Math.round(state.feet*1e6)/1e6);
  }
  assert.equal(route.length,0);assert.equal(state.feet,floor===2?LEVEL:0);
 }
 assert.equal(heights.size,17,'Полы двух этажей и все 15 деревянных ступеней');
});

test('Ручная прогулка не проходит по воздуху через проём и не проваливается на нижний марш',()=>{
 const obstacle=(x,z,y)=>walkBlocked(model,x,z,y);
 const beside={x:mirrorX(STAIR.holeX0)+.2,z:6,feet:LEVEL};
 const edge=moveWalker(beside,-.5,0,obstacle);
 assert.ok(edge.x>=mirrorX(STAIR.holeX0));assert.equal(edge.feet,LEVEL);
 const aboveLower={x:mirrorX(STAIR.holeX0)+.3,z:STAIR.z0+.45,feet:LEVEL};
 const moved=moveWalker(aboveLower,.12,0,obstacle);
 assert.ok(moved.x>aboveLower.x+.1);assert.equal(moved.feet,LEVEL);
 const under={x:.65,z:entrance.position[2],feet:0};
 assert.equal(moveWalker(under,.3,0,obstacle).feet,0);
});

test('После остановки посреди лестницы можно продолжить в любую сторону',()=>{
 const obstacle=(x,z,y)=>walkBlocked(model,x,z,y);
 for(const z of [STAIR.z0+.6,STAIR.z1-.6]){
  const x=mirrorX(STAIR.x1-.45),start={x,z,feet:stairHeight(x,z)};
  for(const floor of [1,2]){
   let state=start;const route=routeToFloor(state,floor);
   for(let n=0;route.length&&n<2000;n++){
    const result=followStairRoute(state,route,.025,obstacle);assert.equal(result.blocked,false);state=result.state;
   }
   assert.equal(route.length,0);assert.equal(state.feet,floor===1?0:LEVEL);
  }
 }
});
test('Первая клавиша слева при взгляде на каждый двойной выключатель после отражения дома',()=>{
 for(const d of devices.filter(d=>d.channels?.length===2)){
  const group=named(d.name),keys=d.channels.map(c=>group.children.find(o=>o.userData.channelId===c.id&&o.userData.channelLabel));
  const outward=new T.Vector3(0,0,1).transformDirection(group.matrixWorld);
  const right=new T.Vector3(0,1,0).cross(outward);
  const delta=keys[0].getWorldPosition(new T.Vector3()).sub(keys[1].getWorldPosition(new T.Vector3()));
  assert.ok(delta.dot(right)<0,d.id);
 }
});
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-5,`${a} != ${b}`);
const blocked=(x,z)=>model.furnitureSystem.blocked(x,z,0)||model.colliders.some(b=>x>b.minX-.16&&x<b.maxX+.16&&z>b.minZ-.16&&z<b.maxZ+.16&&1.3>b.minY&&.1<b.maxY);

test('Стойка металлического каркаса достигает пола и учитывается при прогулке',()=>{
 const post=named('Стальная стойка у поворота'),bounds=new T.Box3().setFromObject(post),center=bounds.getCenter(new T.Vector3());
 close(bounds.min.y,0);close(bounds.max.x-bounds.min.x,.06);
 assert.equal(blocked(center.x,center.z),true);
 assert.equal(named('Нижний косоур'),undefined);assert.equal(named('Верхний косоур'),undefined);
 assert.equal(post.material.color.getHexString(),'493024');
 const s=STAIR,cx=s.x1-s.width,cz=s.z0+s.width;
 // Sample the middle of each tread, including the turn, against all static
 // collision volumes: the new post must not obstruct the route upstairs.
 const path=[];
 for(let i=0;i<s.lowerSteps;i++)path.push([s.x0+(cx-s.x0)*(i+.5)/s.lowerSteps,s.z0+s.width/2]);
 for(let i=0;i<3;i++){const a=-Math.PI/2+(i+.5)*Math.PI/6;path.push([cx+.45*Math.cos(a),cz+.45*Math.sin(a)]);}
 for(let i=0;i<s.upperSteps;i++)path.push([s.x1-s.width/2,cz+(s.z1-cz)*(i+.5)/s.upperSteps]);
 for(const [sourceX,z] of path){const x=mirrorX(sourceX),y=stairHeight(x,z);assert.equal(model.colliders.some(b=>x>b.minX-.16&&x<b.maxX+.16&&z>b.minZ-.16&&z<b.maxZ+.16&&y+1.3>b.minY&&y+.1<b.maxY),false,'Свободный подъём');}
});

test('Деревянные подступенки скрывают металл спереди, каркас остаётся виден снизу',()=>{
 const frame=named('Металлический каркас лестницы');
 const wood=[];model.root.traverse(o=>{if(/^Ступень \d+$|^Подступенок \d+$/.test(o.name))wood.push(o);});
 const ray=new T.Raycaster();
 const s=STAIR,cx=s.x1-s.width,cz=s.z0+s.width;
 for(const flight of [
  {count:s.lowerSteps,first:1,start:[s.x0,s.z0],run:(cx-s.x0)/s.lowerSteps,alongX:true},
  {count:s.upperSteps,first:s.lowerSteps+s.winderSteps+1,start:[cx,cz],run:(s.z1-cz)/s.upperSteps,alongX:false},
 ]){
  const p=(t,y,side)=>new T.Vector3(mirrorX(flight.start[0]+(flight.alongX?t:side)),y,flight.start[1]+(flight.alongX?side:t));
  for(let i=0;i<flight.count;i++)for(const side of [.1,s.width-.1]){
   const step=flight.first+i,top=new T.Box3().setFromObject(named('Ступень '+step)).max.y;
   ray.set(p(i*flight.run-.08,top-.11,side),new T.Vector3(flight.alongX?-1:0,0,flight.alongX?0:1));
   const front=ray.intersectObjects([...wood,frame],true)[0];
   assert.equal(front?.object.name,'Подступенок '+step,'Металл не выступает перед ступенью '+step);
   ray.set(p((i+.5)*flight.run,top-.14,side),new T.Vector3(0,1,0));
   const underside=ray.intersectObjects([...wood,frame],true)[0];
   assert.ok(underside?.object.name.endsWith('· горизонталь'),'Косоур виден под ступенью '+step);
  }
 }
});

test('Забежные ступени закрыты деревом по всей ширине и высоте просвета',()=>{
 const s=STAIR,cx=s.x1-s.width,cz=s.z0+s.width;
 const h=new T.Box3().setFromObject(named('Ступень 1')).max.y;
 const objects=[];named('Лестница').traverse(o=>{if(o.isMesh)objects.push(o);});
 const ray=new T.Raycaster();
 for(let i=0;i<3;i++){
  const a=-Math.PI/2+i*Math.PI/6,dx=Math.cos(a),dz=Math.sin(a),length=s.width/Math.max(Math.abs(dx),Math.abs(dz));
  const direction=new T.Vector3(dz,0,dx);
  for(const fraction of [.05,.1,.3,.5,.8,.95])for(const height of [.01,.04,.08]){
   const target=new T.Vector3(mirrorX(cx+dx*length*fraction),(s.lowerSteps+i)*h+height,cz+dz*length*fraction);
   ray.set(target.clone().addScaledVector(direction,-.07),direction);
   const hit=ray.intersectObjects(objects,false)[0];
   assert.equal(hit?.object.name,'Подступенок '+(s.lowerSteps+1+i),'Дерево закрывает просвет и каркас');
  }
  const panel=named('Подступенок '+(s.lowerSteps+1+i)),bounds=new T.Box3().setFromObject(panel);
  close(bounds.min.y,(s.lowerSteps+i)*h);close(bounds.max.y,(s.lowerSteps+1+i)*h);
 }
});

test('В гардеробную открыт проход из детской; ковёр и радиатор не перекрывают лестничный проём',()=>{
 assert.equal(model.doorSystem.doors.some(d=>d.id==='dressing'),false);
 assert.equal(walkBlocked(model,mirrorX(CHILD.closetPartition.center),CHILD.closetOpening.at+CHILD.closetOpening.width/2,LEVEL),false,'В гардеробную можно пройти без открытия двери');
 const hallDoorIds=model.doorSystem.doors.filter(d=>d.floor===2&&d.hinge.position.z>=UPPER_HALL_PLAN.bounds[1]-.075&&d.hinge.position.z<=UPPER_HALL_PLAN.bounds[3]+.075).map(d=>d.id);
 assert.deepEqual(hallDoorIds.sort(),['bedroom','child','shower']);
 const rug=new T.Box3().setFromObject(named('Серо-бежевый ковёр второго этажа'));
 assert.ok(rug.min.x>mirrorX(STAIR.holeX0));
 const radiator=new T.Box3().setFromObject(named('Радиатор второго этажа · секция'));
 assert.ok(radiator.max.x<mirrorX(STAIR.x1));
 const panes=[];model.root.traverse(o=>{if(o.name.startsWith('Окно коридора второго этажа · стекло'))panes.push(o);});assert.equal(panes.length,2);
});

test('Обеденная группа развёрнута к окну; все пять стульев внутри комнаты',()=>{
 const table=new T.Box3().setFromObject(named('Обеденный стол'));
 close(table.max.x-table.min.x,.82);close(table.max.z-table.min.z,1.30);close(table.min.z-LIVING.z0,.07);
 const chairs=[];named('Обеденная группа у окна').traverse(o=>{if(o.name==='Обеденный стул')chairs.push(o);});
 assert.equal(chairs.length,5);
 for(const chair of chairs){const b=new T.Box3().setFromObject(chair);assert.ok(b.min.z>LIVING.z0);assert.ok(b.max.z<2.15);assert.ok(b.min.x>mirrorX(LIVING.x1)&&b.max.x<mirrorX(LIVING.x0));}
 const center=table.getCenter(new T.Vector3());assert.equal(blocked(center.x,center.z),true,'Стол учитывается при прогулке после поворота');
});

test('Три умных устройства гостиной зарегистрированы и доступны для выбора',()=>{
 const living=devices.filter(d=>d.roomId==='room-5'&&d.kind!=='smart-switch');assert.equal(living.length,3);
 for(const d of living){const group=model.deviceMeshes[d.id];assert.ok(group,d.id);assert.ok(model.pickables.some(o=>o.userData.deviceId===d.id));assert.equal(d.integrationStatus,'unverified');}
 assert.ok(devices.filter(d=>d.roomId==='room-2').length>0,'Устройства кабинета сохранены');
});

test('Пять выключателей: восемь независимых клавиш и соседний одиночный слева',()=>{
 const switches=devices.filter(d=>d.kind==='smart-switch');assert.equal(switches.length,5);
 assert.equal(switches.reduce((n,d)=>n+d.channels.length,0),8);
 for(const d of switches){
  const group=model.deviceMeshes[d.id];assert.ok(group,d.id);
  for(const c of d.channels){const key=group.children.find(o=>o.userData.channelId===c.id);assert.ok(key,c.label);assert.ok(model.pickables.includes(key));}
 }
 const doubleBox=new T.Box3().setFromObject(model.deviceMeshes['living-lights']);
 const singleBox=new T.Box3().setFromObject(model.deviceMeshes['upstairs-hall-light']);
 close(singleBox.max.x,doubleBox.min.x);close(singleBox.min.y,doubleBox.min.y);close(singleBox.min.z,doubleBox.min.z);
 const controller=new T.Box3().setFromObject(model.deviceMeshes['office-desk-wled']);
 const printer=new T.Box3().setFromObject(model.deviceMeshes['office-paper-printer']);
 assert.ok(controller.max.y<.82);assert.ok(controller.min.z>printer.min.z&&controller.max.z<printer.max.z);
});

test('Наклон и подсветка клавиш независимы, потеря HA сбрасывает прежнюю индикацию',()=>{
 const keys=model.deviceMeshes['office-lights'].children.filter(o=>o.userData.channelLabel);
 const neutral=model.deviceMeshes['bathroom-light'].children.find(o=>o.userData.channelLabel);
 model.setSwitchStates({'office-lights:chandeliers':'on','office-lights:spots':'off'});
 assert.equal(keys[0].userData.powerState,'on');assert.equal(keys[1].userData.powerState,'off');
 assert.ok(keys[0].rotation.x<0);assert.ok(keys[1].rotation.x>0);
 assert.ok(keys[0].children[0].material.emissiveIntensity>0);assert.equal(keys[1].children[0].material.emissiveIntensity,0);
 assert.notEqual(keys[0].material,keys[1].material);assert.equal(neutral.material.emissiveIntensity,0);
 model.setSwitchStates({});
 for(const key of keys){assert.equal(key.rotation.x,0);assert.equal(key.userData.powerState,'disconnected');assert.equal(key.children[0].material.emissiveIntensity,0);}
});

test('Гостиная: обмеры внутренних углов и цепочки проёмов, окна на высоте 60 см',()=>{
 close(LIVING.x1-LIVING.x0,6.72);close(LIVING.z1-LIVING.z0,3.76);
 close(W-(LIVING.leftWindows[0]+1.8),.86);
 close(LIVING.leftWindows[0]-(LIVING.leftWindows[1]+1.8),1.33);
 close(LIVING.leftWindows[1]-LIVING.x0,.93);
 close(LIVING.frontWindow-LIVING.z0,.81);close(LIVING.z1-LIVING.frontWindow-1.8,1.15);
 for(const name of ['Окно кабинета','Окно гостиной · фронтальная стена','Окно гостиной · левая стена 1','Окно гостиной · левая стена 2']){
  const sill=new T.Box3().setFromObject(named(name+' · подоконник'));
  close(sill.max.y,.5975);
  for(let n=1;n<=3;n++)assert.ok(named(name+' · стекло '+n));
  const reveal=new T.Box3().setFromObject(named(name+' · боковой откос'));
  close(Math.max(reveal.max.x-reveal.min.x,reveal.max.z-reveal.min.z),.67);
 }
});

test('Гостиная: свободный вход и маршруты к дивану и кухне; наружный зазор сохранён',()=>{
 const x=HALL.livingOpening.at+HALL.livingOpening.width/2;
 for(let z=HALL.bounds[1]+.3;z>2.15;z-=.05)assert.equal(blocked(mirrorX(x),z),false,'Проход из коридора');
 for(let xx=1.65;xx<6.45;xx+=.05)assert.equal(blocked(mirrorX(xx),2.55),false,'Проход вдоль комнаты');
 close((mirrorX(W+EXTERIOR_THICKNESS))-(model.annexX+model.annexWidth),GAP);
});

test('Двери закрывают проход, плавно открываются и освобождают его на обоих этажах',()=>{
 const system=model.doorSystem;assert.equal(system.doors.length,10);
 for(const d of system.doors){
  const p=d.hinge.localToWorld(new T.Vector3(d.width/2,0,0));
  assert.equal(system.blocked(p.x,p.z,d.base),true,d.label+' закрыта');
  assert.equal(system.toggle(d.id),true);system.update(.1);
  assert.ok(Math.abs(d.angle)>0&&Math.abs(d.angle)<Math.PI/2);
  system.update(1);
  assert.equal(system.blocked(p.x,p.z,d.base),false,d.label+' открыта');
  system.toggle(d.id);system.update(1);
 }
 const sourceOpenings=[[HALL.livingOpening.at+HALL.livingOpening.width/2,HALL.bounds[1]-.075],[HALL.officeOpening.at+HALL.officeOpening.width/2,HALL.bounds[3]+.075]];
 for(const [x,z] of sourceOpenings)assert.equal(system.blocked(mirrorX(x),z,0),false,'Свободный проём без двери');
});
test('Дверь не закрывается сквозь стоящего в проёме человека',()=>{
 const system=model.doorSystem,d=system.doors.find(d=>d.id==='office-boiler');
 const p=d.hinge.localToWorld(new T.Vector3(d.width/2,0,0));
 system.toggle(d.id);system.update(1);
 assert.equal(system.toggle(d.id,[p.x,p.z,d.base]),false);
 assert.equal(d.open,true);
 assert.equal(system.toggle(d.id,[mirrorX(4.2),8.32,0]),true);system.update(1);
});
test('Обстановка коридора оставляет проход от входа к кабинету',()=>{
 for(let x=.65;x<=officeDoor.position[0];x+=.02)assert.equal(blocked(x,entrance.position[2]),false);
 for(let z=entrance.position[2];z<8.33;z+=.02)assert.equal(blocked(officeDoor.position[0],z),false);
 // Continue toward the living-room opening; the wardrobe must not pinch this route.
 for(let z=entrance.position[2];z>3.7;z-=.02)assert.equal(blocked(mirrorX(4),z),false);
 const bathZ=HALL.bathroom.at+HALL.bathroom.width/2;
 for(let x=mirrorX(4);x<mirrorX(1.8);x+=.02)assert.equal(blocked(x,bathZ),false);
});
test('Шкаф напротив входа, ванная слева, лавочка и вешалка на боковой стене',()=>{
 const wardrobe=new T.Box3().setFromObject(named('Шкаф-купе коридора'));
 assert.ok(entrance.position[2]>wardrobe.min.z&&entrance.position[2]<wardrobe.max.z);
 close(wardrobe.max.x,mirrorX(HALL.bounds[0]));
 close(wardrobe.max.z,HALL.bounds[3]);
 close(wardrobe.max.z-wardrobe.min.z,2.08);
 const front=new T.Box3().setFromObject(named('Направляющая шкафа-купе'));
 close(wardrobe.max.x-front.min.x,.60);
 assert.ok(HALL.bathroom.at+HALL.bathroom.width<wardrobe.min.z);
 const bench=new T.Box3().setFromObject(named('Скамья обувницы'));
 const rack=new T.Box3().setFromObject(named('Панель вешалки с зеркалом'));
 assert.ok(bench.min.z>entrance.position[2]+HALL.entrance.width/2);
 close(bench.max.z,7.81);close(rack.max.z,7.8075);
 close(bench.getCenter(new T.Vector3()).x,rack.getCenter(new T.Vector3()).x);
 const entry=model.doorSystem.doors.find(d=>d.id==='entrance');
 const center=entry.hinge.localToWorld(new T.Vector3(entry.width/2,0,0));
 close(center.z,entrance.position[2]);
});
test('Шкаф не перекрывает маршрут от входа кабинета в котельную',()=>{
 for(let x=2.96;x<=5.1;x+=.02)assert.equal(blocked(x,8.55),false,`Проход закрыт на X=${x}`);
 const cabinet=new T.Box3().setFromObject(named('Шкаф 80 × 48 × 202 см'));
 const size=cabinet.getSize(new T.Vector3());close(size.x,.48);close(size.y,2.02);close(size.z,.80);
 close(mirrorX(OFFICE.wallX)-cabinet.max.x,.03);
 close(cabinet.max.z,OFFICE.printerShelf.z0);
});
test('Обмеры коридора: цепочки стен, высоты проёмов и 44 см до лестницы',()=>{
 const [rear,left,front,right]=HALL.bounds;
 close(front-rear,4.62);close(right-left,3.70);
 const entry=model.doorSystem.doors.find(d=>d.id==='entrance');
 const entryCenter=entry.hinge.localToWorld(new T.Vector3(entry.width/2,0,0));
 close(entryCenter.z-entry.width/2-left,2.05);close(entry.width,.98);close(entry.height,2);
 close(right-entryCenter.z-entry.width/2,.67);
 close(front-HALL.officeOpening.at-HALL.officeOpening.width,2.67);
 close(HALL.officeOpening.at-rear,.72);
 close(HALL.livingOpening.at-rear,.73);
 close(STAIR.x0-HALL.livingOpening.at-HALL.livingOpening.width,.44);
 const wardrobe=new T.Box3().setFromObject(named('Шкаф-купе коридора'));
 const bath=model.doorSystem.doors.find(d=>d.id==='bathroom');
 close(bath.width,.70);close(wardrobe.min.z-bath.hinge.position.z-bath.width,.25);
 close(bath.hinge.position.z-left,.67); // Reported 64 cm + unresolved 3 cm closure.
 for(const [opening,z] of [[HALL.officeOpening,right+.075],[HALL.livingOpening,left-.075]]){
  close(opening.width,1.23);
  const x=mirrorX(opening.at+opening.width/2);
  const intersectsAt=y=>model.colliders.some(b=>x>b.minX&&x<b.maxX&&z>b.minZ&&z<b.maxZ&&y>b.minY&&y<b.maxY);
  assert.equal(intersectsAt(2.31),false,'До 232 см проём свободен');
  assert.equal(intersectsAt(2.33),true,'Над 232 см начинается перемычка');
 }
});
test('Стол по чертежу: 152 × 134, высота 85, толщина 3 см и две круглые ножки',()=>{
 const table=new T.Box3().setFromObject(named('Столешница по CDR · 152 × 134 × 3 см'));
 const size=table.getSize(new T.Vector3());close(size.x,1.34);close(size.z,1.52);close(size.y,.03);close(table.max.y,.85);
 const legs=[];model.root.traverse(o=>{if(o.name==='Круглая ножка стола Ø 5 см')legs.push(o);});assert.equal(legs.length,2);
 for(const leg of legs)close(leg.geometry.parameters.radiusTop,.025);
 assert.equal(blocked(mirrorX(3.55),11.1),false,'Вырез стола доступен для кресла');
});
test('Стеллажи: 5 × 5, четыре дверцы и четыре ящичка; узкий 1 × 4',()=>{
 const count=prefix=>{let n=0;model.root.traverse(o=>{if(o.name.startsWith(prefix))n++;});return n;};
 assert.equal(count('Стеллаж 5 × 5 · вертикаль'),6);assert.equal(count('Стеллаж 5 × 5 · горизонталь'),6);
 assert.equal(count('Стеллаж 5 × 5 · серая дверца'),4);assert.equal(count('Стеллаж 5 × 5 · двойной ящик'),4);
 assert.equal(count('Стеллаж 1 × 4 · вертикаль'),2);assert.equal(count('Стеллаж 1 × 4 · горизонталь'),5);
 assert.equal(count('Стеллаж 1 × 4 · серая дверца'),2);assert.equal(count('Стеллаж 1 × 4 · двойной ящик'),2);
 assert.ok(named('Кролик'));assert.ok(named('Сушилка филамента Creality'));
});
test('Начало лестницы у гостиной, 15 ступеней ниже пола и выход на верхнюю площадку',()=>{
 const low=new T.Box3().setFromObject(named('Ступень 1')).getCenter(new T.Vector3());
 const high=new T.Box3().setFromObject(named('Ступень 15')).getCenter(new T.Vector3());
 assert.ok(low.z<4.6);assert.ok(high.z>STAIR.z0+STAIR.width);
 close(low.z-STAIR.width/2,HALL.bounds[1]);
 close(high.x-STAIR.width/2,mirrorX(STAIR.x1));
 const treads=[];named('Лестница').traverse(o=>{if(/^Ступень \d+$|^Забежная ступень$/.test(o.name))treads.push(o);});
 assert.equal(treads.length,15);assert.equal(named('Ступень 16'),undefined);
 close(new T.Box3().setFromObject(named('Ступень 15')).max.y,LEVEL-LEVEL/16);
 for(const tread of treads){
  const b=new T.Box3().setFromObject(tread);assert.ok(b.max.y<LEVEL);
  if(tread.name!=='Забежная ступень'){const c=b.getCenter(new T.Vector3());close(stairHeight(c.x,c.z),b.max.y);}
 }
 close(stairHeight(mirrorX(STAIR.x1-.45),STAIR.z1),LEVEL);
 for(let z=STAIR.z0+STAIR.width+.01;z<STAIR.z1;z+=.03){const x=mirrorX(STAIR.x1-.45),y=stairHeight(x,z);
  assert.equal(model.colliders.some(b=>x>b.minX-.16&&x<b.maxX+.16&&z>b.minZ-.16&&z<b.maxZ+.16&&y+1.3>b.minY&&y+.1<b.maxY),false,'Верхний марш не должен пересекать стены');
 }
});

test('Коридор второго этажа: четыре размерные цепочки и отверстие 150 × 263 с отступами',()=>{
 const p=UPPER_HALL_PLAN,[rear,child,front,bedroom]=p.bounds;
 close(front-rear,4.88);close(bedroom-child,3.93);
 close(bedroom-p.window.at-p.window.width,.97);close(p.window.width,1.17);close(p.window.at-child,1.79);
 close(front-p.child.at-p.child.width,3.28);close(p.child.width,.8);close(p.child.at-rear,.8);
 close(p.bathroom.at-child,1.61);close(p.bathroom.width,.7);close(bedroom-p.bathroom.at-p.bathroom.width,1.62);
 close(p.bedroom.at-rear,2.27);close(p.bedroom.width,.8);close(front-p.bedroom.at-p.bedroom.width,1.81);
 for(const [id,d,axis,fixed] of [['child',p.child,'x',child-.075],['bedroom',p.bedroom,'x',bedroom+.075],['shower',p.bathroom,'z',rear-.075]]){
  const door=model.doorSystem.doors.find(d=>d.id===id);close(door.width,d.width);
  const point=door.hinge.localToWorld(new T.Vector3(door.width/2,0,0));
  close(point.x,mirrorX(axis==='x'?d.at+d.width/2:fixed));close(point.z,axis==='z'?d.at+d.width/2:fixed);
 }
 close(STAIR.x1-STAIR.holeX0,1.5);close(STAIR.z1-STAIR.holeZ0,2.63);
 close(front-STAIR.x1,.32);close(STAIR.holeZ0-child,.06);
 const floor=named('Этаж 2').children.filter(o=>['Пол коридора','Пол у лестницы','Верхняя площадка','Пол у стены детской'].includes(o.name));
 const ray=new T.Raycaster();
 const hitFloor=(x,z)=>{ray.set(new T.Vector3(mirrorX(x),LEVEL+.3,z),new T.Vector3(0,-1,0));return ray.intersectObjects(floor,false)[0];};
 for(let x=STAIR.holeX0+.05;x<STAIR.x1;x+=.2)for(let z=STAIR.holeZ0+.05;z<STAIR.z1;z+=.2)assert.equal(hitFloor(x,z),undefined,'Проём свободен от перекрытия');
 for(const [x,z] of [[STAIR.x1+.16,6],[6,child+.03],[STAIR.holeX0-.1,6],[STAIR.x1-.45,STAIR.z1+.02]])close(hitFloor(x,z).point.y,LEVEL);
});

test('Ванная и котельная открываются к посетителю, входная имеет правые петли снаружи',()=>{
 const system=model.doorSystem;
 for(const id of ['bathroom','office-boiler','entrance']){
  const door=system.doors.find(d=>d.id===id),pivot=door.hinge.getWorldPosition(new T.Vector3());
  system.toggle(id);system.update(1);
  const end=door.hinge.localToWorld(new T.Vector3(door.width,0,0));
  assert.ok(end.x<pivot.x-.5,id+' открывается в нужную сторону');
  system.toggle(id);system.update(1);
 }
 const entry=system.doors.find(d=>d.id==='entrance');
 close(entry.hinge.position.z,HALL.entrance.at+HALL.entrance.width);
 assert.equal(entry.leaf.material.color.getHexString(),'2c1912');
});

test('Окно кабинета: три стекла 50–70–50 см, общий проём 180 см',()=>{
 const glasses=[1,2,3].map(n=>new T.Box3().setFromObject(named('Окно кабинета · стекло '+n)));
 for(let i=0;i<3;i++)close(glasses[i].max.z-glasses[i].min.z,[.5,.7,.5][i]);
 const profiles=[];model.root.traverse(o=>{if(o.name==='Окно кабинета · вертикальный профиль')profiles.push(new T.Box3().setFromObject(o));});
 assert.equal(profiles.length,4);close(Math.max(...profiles.map(b=>b.max.z))-Math.min(...profiles.map(b=>b.min.z)),1.8);
});

test('Ящики выдвигаются, створки купе скользят в плоскости фасада, состояния возвращаются',()=>{
 const system=model.furnitureSystem;
 assert.equal(system.items.filter(i=>i.roomId!=='room-7').length,26);
 assert.equal(system.items.filter(i=>i.roomId==='room-7').length,5);
 for(const item of system.items){
  const initial=new T.Box3().setFromObject(item.group).getCenter(new T.Vector3());
  assert.equal(system.toggle(item.id),true);system.update(.1);assert.ok(item.progress>0&&item.progress<1);
  system.update(1);const opened=new T.Box3().setFromObject(item.group).getCenter(new T.Vector3());
  assert.ok(initial.distanceTo(opened)>.1,item.label);
  if(item.id.startsWith('hall-slider')){close(initial.x,opened.x);close(item.group.rotation.y,0);}
  system.toggle(item.id);system.update(1);
  close(initial.distanceTo(new T.Box3().setFromObject(item.group).getCenter(new T.Vector3())),0);
 }
 const drawer=system.items.find(i=>i.id==='office-drawer-0');
 system.toggle(drawer.id);system.update(1);
 const p=new T.Box3().setFromObject(drawer.group).getCenter(new T.Vector3());
 assert.equal(system.blocked(p.x,p.z,0),true);
 assert.equal(system.toggle(drawer.id,[p.x,p.z,0]),false,'Закрытие не проходит сквозь человека');
 system.toggle(drawer.id);system.update(1);
});

test('Спальня: проход от входа к балкону свободен, кровати блокируют движение',()=>{
 const obstacle=(sourceX,z)=>walkBlocked(model,mirrorX(sourceX),z,LEVEL);
 const bedroom=planRooms.find(r=>r.id==='room-7').bounds,back=bedroom[3];
 for(let z=UPPER_HALL_PLAN.bounds[3]+.4;z<back-.11;z+=.08)assert.equal(obstacle(5.12,z),false,`Проход к балкону на ${z}`);
 for(let x=2.4;x<5.1;x+=.08)assert.equal(obstacle(x,back-1.81),false,'Центр спальни свободен');
 assert.equal(obstacle(1,(bedroom[1]+back)/2),true);assert.equal(obstacle(6.36,back-1.11),true);
 assert.ok(named('Фотообои · золотые листья'));assert.ok(named('Зеркало спальни'));
 const balcony=model.doorSystem.doors.find(d=>d.id==='balcony');
 assert.ok(named('Стекло балконной двери'));assert.equal(balcony.floor,2);
 model.doorSystem.toggle('balcony');model.doorSystem.update(1);
 assert.equal(model.doorSystem.blocked(mirrorX(5.12),back+.075,LEVEL),false,'Открытая дверь пропускает на балкон');
 model.doorSystem.toggle('balcony');model.doorSystem.update(1);
});

test('Ванная: дверь и центральный проход свободны, ванна и машины блокируют прогулку',()=>{
 const obstacle=(x,z)=>walkBlocked(model,mirrorX(x),z,0);
 const door=model.doorSystem.doors.find(d=>d.id==='bathroom');
 const wasOpen=door.open;
 if(!wasOpen){model.doorSystem.toggle('bathroom');model.doorSystem.update(1);}
 for(let x=1.49;x<2.9;x+=.04)assert.equal(obstacle(x,5.18),false,`Вход на ${x}`);
 for(let z=4.90;z<7.25;z+=.04)assert.equal(obstacle(1.49,z),false,`Проход на ${z}`);
 assert.equal(obstacle(.83,5.06),true,'Ванна');
 assert.equal(obstacle(2.12,6.2),true,'Стиральная машина');
 assert.equal(obstacle(.67,5.98),true,'Стеллаж');
 if(!wasOpen){model.doorSystem.toggle('bathroom');model.doorSystem.update(1);}
});

test('Окно ванной имеет настоящий проём в наружной стене и цепочку 212–83–50 см',()=>{
 const profiles=[];model.root.traverse(o=>{if(o.name==='Окно ванной · вертикальный профиль')profiles.push(new T.Box3().setFromObject(o));});
 const start=Math.min(...profiles.map(b=>b.min.z)),end=Math.max(...profiles.map(b=>b.max.z));
 close(start-HALL.bounds[1],2.12);close(end-start,.83);
 const endWall=new T.Box3().setFromObject(named('Стена за встроенной инсталляцией'));
 close(endWall.min.z-end,.50);
 const ray=new T.Raycaster(new T.Vector3(mirrorX(LIVING.x0+.25),1.6,(start+end)/2),new T.Vector3(1,0,0));
 const hit=ray.intersectObject(model.root,true)[0];
 assert.equal(hit.object.name,'Окно ванной · стекло 1','Зелёная облицовка и кирпичная стена не перекрывают окно');
});
