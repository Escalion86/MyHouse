import test from 'node:test';
import assert from 'node:assert/strict';
import {walkSurface} from '../src/scene/walkNavigation.js';
import {rooms,roomById,centerOf,entrance,officeDoor,boilerDoor,STAIR,stairHeight,walkStairHeight,mirrorX,LEVEL,roomAt,W,GAP,EXTERIOR_THICKNESS} from '../src/model/layout.js';

const rightOffset=(position,origin,forward)=>-(position[0]-origin[0])*forward[2]+(position[2]-origin[2])*forward[0];
test('При входе в дом кабинет справа; при входе в кабинет котельная слева',()=>{
 assert.ok(rightOffset(officeDoor.position,entrance.position,entrance.forward)>0);
 assert.ok(rightOffset(boilerDoor,officeDoor.position,officeDoor.forward)<0);
 assert.ok(Math.abs(boilerDoor[2]-officeDoor.position[2])<.8,'Дверь котельной рядом со входом в кабинет');
});
test('Все 11 комнат доступны по мировым координатам и сохраняют исходные площади',()=>{
 assert.equal(rooms.length,11);
 for(const r of rooms){const [x,y,z]=centerOf(r);assert.equal(roomAt(x,z,y)?.id,r.id);assert.ok(r.bounds[2]>r.bounds[0]);}
 assert.equal(roomById['room-2'].planAreaM2,18.3);
 assert.equal(roomById['room-7'].planAreaM2,28.9);
});
test('Маршрут по лестнице после отражения поднимается с нуля до второго этажа',()=>{
 const s=STAIR,path=[];
 const cx=s.x1-s.width,cz=s.z0+s.width;
 for(let x=s.x0;x<=cx;x+=.025)path.push([x,s.z0+.45]);
 for(let t=0;t<=Math.PI/2;t+=.025)path.push([cx+.45*Math.sin(t),cz-.45*Math.cos(t)]);
 for(let z=cz;z<=s.z1;z+=.025)path.push([s.x1-.45,z]);
 path.push([s.x1-.45,s.z1]);let prev=0;
 for(const [x,z] of path){const h=stairHeight(mirrorX(x),z);assert.notEqual(h,null);assert.ok(h>=prev-.001);assert.ok(h-prev<.3,'Шаг доступен для прогулки');prev=h;}
 assert.ok(Math.abs(prev-LEVEL)<1e-9);
 assert.equal(stairHeight(...[mirrorX(0),0]),null);
});
test('Отражение сохраняет зазор между домом и гаражом 4,55 м',()=>{
 const houseFace=mirrorX(W+EXTERIOR_THICKNESS),garageFace=mirrorX(W+EXTERIOR_THICKNESS+GAP);
 assert.ok(Math.abs(houseFace-garageFace-4.55)<1e-9);
});
test('От входной двери можно пройти под верхним маршем без переноса наверх',()=>{
 for(let x=mirrorX(STAIR.x1)+.01;x<mirrorX(STAIR.x1-STAIR.width)-.01;x+=.025){
  assert.equal(walkSurface(x,entrance.position[2],0),0);
  const upperFlightZ=STAIR.z1-.15,upstairs=stairHeight(x,upperFlightZ);
  assert.ok(upstairs>1.85);
  assert.equal(walkStairHeight(x,upperFlightZ,0),0);
  assert.equal(walkStairHeight(x,upperFlightZ,upstairs),upstairs);
 }
});
