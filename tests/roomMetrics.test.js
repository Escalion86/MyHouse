import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateRoomMetrics} from '../src/model/roomMetrics.js';
import {planRooms,finishedCeilingHeight} from '../src/model/layout.js';
import {roomFloorPieces,rectangleArea,intersection} from '../src/model/roomGeometry.js';

const close=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-5,`${actual} != ${expected}`);
test('schedule uses finished interior dimensions and each room ceiling, not old document areas',()=>{
 const report=calculateRoomMetrics();
 for(const room of planRooms.filter(r=>r.id!=='room-6'&&r.id!=='room-8'&&r.id!=='room-3')){
  const value=report.rooms.find(r=>r.id===room.id),area=rectangleArea(room.bounds);
  close(value.areaM2,area);close(value.volumeM3,area*finishedCeilingHeight(room.id));
 }
 const byId=Object.fromEntries(report.rooms.map(r=>[r.id,r]));
 close(byId['room-10'].areaM2,5.31*4.20);
 close(byId['room-11'].areaM2,2.03*4.20);
 assert.equal(byId['room-1'].ceilingHeightM,2.60);
 assert.equal(byId['room-4'].ceilingHeightM,3.00);
 assert.equal(byId['room-2'].ceilingHeightM,2.88);
});

test('stair air is counted exactly once across floors; missing floor is excluded from area',()=>{
 const rooms=[{id:'room-3',name:'Hall',floor:1,bounds:[0,0,4,5]},{id:'room-8',name:'Upper hall',floor:2,bounds:[0,0,4,5]}];
 const report=calculateRoomMetrics({rooms,opening:[1,1,3,4],level:3.23,ceilingHeight:id=>id==='room-3'?2.88:2.7});
 assert.equal(report.rooms[0].areaM2,20);assert.equal(report.rooms[1].areaM2,14);
 assert.equal(report.rooms[1].stairOpeningAreaM2,6);
 close(report.rooms[0].stairwellExtraVolumeM3,6*.35);
 close(report.totals.enclosedVolumeM3,(20-6)*(2.88+2.7)+6*(3.23+2.7));
 close(report.totals.enclosedAreaM2,34);
});

test('upper floor pieces match clipped openings and do not overlap',()=>{
 const room={id:'room-8',name:'Hall',bounds:[0,0,4,5]};
 for(const opening of [[1,1,3,4],[-1,-1,2,3],[3,4,6,7],[8,8,9,9],[-1,-1,9,9]]){
  const pieces=roomFloorPieces(room,opening);
  close(pieces.reduce((sum,p)=>sum+rectangleArea(p.bounds),0),20-rectangleArea(intersection(room.bounds,opening)));
  for(let i=0;i<pieces.length;i++)for(let j=i+1;j<pieces.length;j++)close(rectangleArea(intersection(pieces[i].bounds,pieces[j].bounds)),0);
 }
});

test('model changes recalculate metrics and open balcony is excluded from enclosed totals',()=>{
 const rooms=structuredClone(planRooms),before=calculateRoomMetrics({rooms});
 const room=rooms.find(r=>r.id==='room-10');room.bounds[2]+=.5;
 const after=calculateRoomMetrics({rooms});
 close(after.totals.enclosedAreaM2-before.totals.enclosedAreaM2,.5*4.2);
 close(after.totals.enclosedVolumeM3-before.totals.enclosedVolumeM3,.5*4.2*2.7);
 const balcony=before.rooms.find(r=>r.id==='room-6');
 assert.equal(balcony.enclosed,false);assert.equal(balcony.volumeM3,null);assert.equal(balcony.ceilingHeightM,null);
 close(before.totals.outdoorAreaM2,balcony.areaM2);
 close(before.totals.enclosedAreaM2,before.rooms.filter(r=>r.enclosed).reduce((sum,r)=>sum+r.areaM2,0));
 for(const key of ['enclosedAreaM2','enclosedVolumeM3','outdoorAreaM2'])close(before.totals[key],before.floors.reduce((sum,f)=>sum+f[key],0));
});
