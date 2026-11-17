import test from 'node:test';
import assert from 'node:assert/strict';
import {measurementRequests} from '../src/model/measurementRequests.js';
import {requestEndpoints} from '../src/scene/measurementRequestMarkers.js';
import {HALL,STAIR,LEVEL,mirrorX,UPPER_HALL_PLAN,LIVING,CHILD} from '../src/model/layout.js';

test('each requested measurement has finite model endpoints and a stable unique ID',()=>{
 assert.equal(new Set(measurementRequests.map(t=>t.id)).size,measurementRequests.length);
 for(const task of measurementRequests){const points=requestEndpoints(task.id);assert.equal(points.length,2);assert.ok(points.flat().every(Number.isFinite));}
});

test('room depth requests span interior window and corridor wall faces on the correct floor',()=>{
 for(const [id,roomId,floor,z0,z1] of [
  ['living-window-to-hall','room-5',1,LIVING.z0,LIVING.z1],
  ['child-window-to-hall','room-10',2,CHILD.bounds[1],CHILD.bounds[3]]
 ]){
  const task=measurementRequests.find(t=>t.id===id);assert.equal(task.roomId,roomId);assert.equal(task.floor,floor);
  const [a,b]=requestEndpoints(id);assert.equal(a[0],b[0]);assert.equal(a[1],b[1]);
  assert.equal(a[1],(floor===2?LEVEL:0)+.65);assert.equal(a[2],z0);assert.equal(b[2],z1);
 }
});
test('request pointers distinguish wall offset from opening gap and span actual model boundaries',()=>{
 const offset=requestEndpoints('stair-wall-offset'),gap=requestEndpoints('stair-opening-gap');
 assert.equal(offset[0][2],HALL.bounds[1]);assert.equal(offset[1][2],UPPER_HALL_PLAN.bounds[1]);
 assert.equal(gap[0][2],UPPER_HALL_PLAN.bounds[1]);assert.equal(gap[1][2],STAIR.holeZ0);
 for(const id of ['hall-width-entrance','hall-width-bathroom']){const [a,b]=requestEndpoints(id);assert.equal(a[2],HALL.bounds[1]);assert.equal(b[2],HALL.bounds[3]);assert.equal(a[0],b[0]);}
 const [a,b]=requestEndpoints('bathroom-door-opening');assert.equal(a[0],mirrorX(HALL.bounds[0]));assert.ok(Math.abs(b[2]-a[2]-HALL.bathroom.width)<1e-8);
 const height=requestEndpoints('storey-floor-height');assert.equal(height[0][1],0);assert.equal(height[1][1],LEVEL);
});
