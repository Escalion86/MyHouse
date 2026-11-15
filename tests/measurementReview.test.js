import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createWallMeasurement,createSurfaceRegistry,visibleReviews,wallSurface} from '../src/scene/wallMeasurement.js';
import {measurementStatus} from '../src/model/measurementComparison.js';
import {measurementRecord} from '../server/measurements.js';
import {sampleMeasurement} from './fixtures/measurement.js';
import {measureSurfaceExtent} from '../src/model/measurementExtent.js';

test('review snapshots round-trip through JSON, preserving measured and actual distances',()=>{
 const scene=new T.Scene();let draft;
 const controller=createWallMeasurement(scene,()=>{},value=>{draft=value;});
 const objects=[0,3].map(x=>{const mesh=new T.Mesh(new T.BoxGeometry(.2,2,4));mesh.userData.measureWall=true;mesh.position.x=x;scene.add(mesh);mesh.updateMatrixWorld();return mesh;});
 objects.forEach(object=>controller.select({object,point:new T.Vector3(object.position.x+.1,1,0),face:{normal:new T.Vector3(1,0,0)}}));
 const record={...sampleMeasurement(),...draft},saved=measurementRecord(JSON.parse(JSON.stringify(record)),record.id);
 assert.equal(saved.distance,3);assert.equal(saved.actualDistance,3.51);
 assert.equal(saved.surfaces.length,2);assert.equal(saved.surfaces[1].vertices.length,18);assert.ok(saved.updatedAt);
 for(const patch of [{actualDistance:-1},{floor:5},{start:[NaN,0,0]},{end:[10,1,0]},{distance:99},{surfaces:[]}])assert.equal(measurementRecord({...record,...patch},record.id),null);
 assert.ok(measurementRecord({...record,status:'correct',actualDistance:3},record.id));
 assert.equal('status' in measurementRecord({...record,status:'correct'},record.id),false);
 controller.dispose();objects.forEach(o=>{o.geometry.dispose();o.material.dispose();});
});
test('review visibility requires ruler, filters floor and hides correct records by default',()=>{
 const a=sampleMeasurement(),b={...a,id:'correct',status:'correct',actualDistance:3},c={...a,id:'upper',floor:2};
 assert.deepEqual(visibleReviews([a,b,c],{active:false,showCorrect:true,floor:0}),[]);
 assert.deepEqual(visibleReviews([a,b,c],{active:true,showCorrect:false,floor:1}),[a]);
 assert.deepEqual(visibleReviews([a,b,c],{active:true,showCorrect:true,floor:1}),[a,b]);
 assert.deepEqual(visibleReviews([a,b,c],{active:true,showCorrect:false,floor:0}),[a,c]);
});
test('stored overlays use status colors and are removed without changing house geometry',()=>{
 const scene=new T.Scene(),house=new T.Mesh(new T.BoxGeometry(1,2,3));scene.add(house);
 const before=house.geometry.attributes.position.array.slice(),controller=createWallMeasurement(scene,()=>{}),record=sampleMeasurement();
 controller.setReviews([record],{active:true,showCorrect:false,floor:1});
 const group=scene.children.find(o=>o.isGroup&&o.children.length);
 assert.equal(group.children.length,3);assert.equal(group.children[0].material.color.getHexString(),'df3030');
 controller.setReviews([{...record,actualDistance:record.distance}],{active:true,showCorrect:true,floor:1});
 assert.equal(group.children[0].material.color.getHexString(),'159447');
 const heightRecord={...record,surfaces:[record.surfaces[0],{...record.surfaces[1],kind:'ceiling'}]};
 controller.setReviews([heightRecord],{active:true,showCorrect:false,floor:1,mode:'overview',cap:1.45});
 assert.equal(group.children.length,2);assert.equal(group.children[0].material.clippingPlanes[0].constant,1.45);
 controller.setReviews([record],{active:false,showCorrect:true,floor:1});assert.equal(group.children.length,0);
 assert.deepEqual(house.geometry.attributes.position.array,before);
 controller.dispose();assert.deepEqual(scene.children,[house]);house.geometry.dispose();house.material.dispose();
});

test('comparison ignores legacy status and compares exactly the displayed millimetre values',()=>{
 assert.equal(measurementStatus({distance:4.12,actualDistance:4.12,status:'incorrect'}),'correct');
 assert.equal(measurementStatus({distance:4.12,actualDistance:4.2,status:'correct'}),'incorrect');
 assert.equal(measurementStatus({distance:4.12004,actualDistance:4.12}),'correct');
 assert.equal(measurementStatus({distance:4.1206,actualDistance:4.12}),'incorrect');
});

test('single wall face measures width and full height under reflection, rotation and overview cuts',()=>{
 const scene=new T.Scene(),root=new T.Group();root.scale.x=-1;root.rotation.y=.6;scene.add(root);
 const wall=new T.Mesh(new T.BoxGeometry(4,3,.2));wall.name='Участок';wall.position.set(2,1.5,0);wall.userData={measureWall:true,measureId:'wall:extent'};root.add(wall);
 let draft;const controller=createWallMeasurement(scene,()=>{},v=>draft=v,root);
 // Simulate the overview after full geometry was indexed.
 wall.scale.y=.4;wall.position.y=.6;root.updateMatrixWorld(true);
 const hit={object:wall,point:wall.localToWorld(new T.Vector3(0,0,.1)),face:{normal:new T.Vector3(0,0,1)}};
 controller.setType('width');controller.select(hit);
 assert.equal(draft.type,'width');assert.equal(draft.surfaces.length,1);assert.ok(Math.abs(draft.distance-4)<1e-6);
 const width=measurementRecord({...sampleMeasurement(),...draft,actualDistance:4.5},sampleMeasurement().id);assert.ok(width);assert.equal(width.type,'width');
 controller.setType('height');controller.select(hit);assert.ok(Math.abs(draft.distance-3)<1e-6);
 const height=measurementRecord({...sampleMeasurement(),...draft,actualDistance:3.5},sampleMeasurement().id);assert.ok(height);
 assert.equal(measureSurfaceExtent({...draft.surfaces[0],kind:'floor'},'height'),null);
 assert.equal(measurementRecord({...height,type:'width'},height.id),null);
 assert.equal(measurementRecord({...height,surfaces:[...height.surfaces,...height.surfaces]},height.id),null);
 assert.equal(measurementRecord({...height,type:'area'},height.id),null);
 controller.dispose();
 // Rebuild the same semantic section with corrected dimensions.
 wall.geometry.dispose();wall.geometry=new T.BoxGeometry(4.5,3.5,.2);wall.scale.y=1;wall.position.y=1.75;
 const registry=createSurfaceRegistry(root);
 for(const record of [width,height]){
  const updated=registry.resolveRecords([JSON.parse(JSON.stringify(record))])[0];
  assert.equal(measurementStatus(updated),'correct');assert.ok(!updated.unresolved);
 }
 wall.geometry.dispose();wall.material.dispose();
});

test('surface anchors remeasure changed geometry after reload, independently of overview cutaways',()=>{
 const house=distance=>{
  const root=new T.Group();root.scale.x=-1;root.position.x=8;
  const walls=[0,distance].map((x,i)=>{const o=new T.Mesh(new T.BoxGeometry(.2,3,4));o.name='Стена';o.position.set(x,1.5,0);o.userData={measureWall:true,measureId:'wall:test:'+i};root.add(o);return o;});
  return {root,walls,registry:createSurfaceRegistry(root)};
 };
 const old=house(3),surfaces=old.walls.map(object=>old.registry.capture(wallSurface({object,point:object.localToWorld(new T.Vector3(.1,0,0)),face:{normal:new T.Vector3(1,0,0)}})));
 const record={...sampleMeasurement(),surfaces,status:'incorrect'};
 const before=old.registry.resolveRecords([record])[0];assert.equal(measurementStatus(before),'incorrect');
 const saved=measurementRecord(before,record.id);assert.ok(saved.surfaces[0].anchor);assert.ok(!('status' in saved));
 const updated=house(3.51);
 // The registry holds full-height geometry, even if the view subsequently cuts it.
 updated.walls.forEach(o=>{o.scale.y=.4;o.position.y=.6;});updated.root.updateMatrixWorld(true);
 const after=updated.registry.resolveRecords([JSON.parse(JSON.stringify(saved))])[0];
 assert.ok(Math.abs(after.distance-3.51)<1e-9);assert.equal(after.actualDistance,3.51);assert.equal(measurementStatus(after),'correct');
 assert.notDeepEqual(after.surfaces[1].vertices,saved.surfaces[1].vertices);
 assert.deepEqual(visibleReviews([after],{active:true,showCorrect:false,floor:1}),[]);
 const missing={...saved,surfaces:[{...saved.surfaces[0],anchor:{...saved.surfaces[0].anchor,id:'wall:removed'}},saved.surfaces[1]]};
 assert.equal(measurementStatus(updated.registry.resolveRecords([missing])[0]),'unresolved');
 const legacy={...saved,surfaces:saved.surfaces.map(({anchor,...s})=>s)};
 assert.ok(old.registry.resolveRecords([legacy])[0].surfaces.every(s=>s.anchor));
 assert.equal(updated.registry.resolveRecords([legacy])[0].unresolved,true);
 for(const model of [old,updated])model.walls.forEach(o=>{o.geometry.dispose();o.material.dispose();});
});
