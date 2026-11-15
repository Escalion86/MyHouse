import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {wallSurface,measurePlanes} from '../src/scene/wallMeasurement.js';

test('Расстояние между плоскостями не зависит от высоты и места клика',()=>{
 const a={normal:new T.Vector3(1,0,0),point:new T.Vector3(2,1,9)};
 const b={normal:new T.Vector3(-1,0,0),point:new T.Vector3(5,4,-3)};
 assert.equal(measurePlanes(a,b).distance,3);
 assert.deepEqual(measurePlanes(a,b).end.toArray(),[5,1,9]);
 assert.equal(measurePlanes(a,{...b,normal:new T.Vector3(0,0,1)}),null);
});
test('Отражение и поворот стены сохраняют мировую нормаль; горизонтальные грани исключены',()=>{
 const object=new T.Mesh(new T.BoxGeometry(1,2,3));object.userData.measureWall=true;
 object.scale.set(-1,1,1);object.rotation.y=Math.PI/2;object.updateMatrixWorld();
 const surface=wallSurface({object,point:new T.Vector3(),face:{normal:new T.Vector3(1,0,0)}});
 assert.ok(Math.abs(surface.normal.z-1)<1e-9);
 assert.equal(wallSurface({object,point:new T.Vector3(),face:{normal:new T.Vector3(0,1,0)}}),null);
 object.userData.measureWall=false;assert.equal(wallSurface({object,face:{}}),null);
});

test('Высота измеряется от верхней грани пола до нижней грани потолка',()=>{
 const surface=(kind,y,normalY)=>{
  const object=new T.Mesh(new T.BoxGeometry(4,.2,4));object.userData.measureSurface=kind;object.updateMatrixWorld();
  return wallSurface({object,point:new T.Vector3(1,y,2),face:{normal:new T.Vector3(0,normalY,0)}});
 };
 const floor=surface('floor',3.23,1),ceiling=surface('ceiling',5.93,-1);
 assert.ok(Math.abs(measurePlanes(floor,ceiling).distance-2.7)<1e-9);
 assert.equal(surface('floor',3.03,-1),null);
 assert.equal(surface('ceiling',6.13,1),null);
});
