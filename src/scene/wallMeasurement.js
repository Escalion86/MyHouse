import * as T from 'three';
import {measurementStatus} from '../model/measurementComparison.js';
import {measureSurfaceExtent} from '../model/measurementExtent.js';

export function wallSurface(hit){
 if(!hit?.face)return null;
 const kind=hit.object.userData.measureSurface||(hit.object.userData.measureWall?'wall':null);
 if(!kind)return null;
 const normal=hit.face.normal.clone().applyNormalMatrix(new T.Matrix3().getNormalMatrix(hit.object.matrixWorld));
 if(kind==='wall'&&Math.abs(normal.y)>.001)return null;
 if(kind==='floor'&&normal.y<.999)return null;
 if(kind==='ceiling'&&normal.y>-.999)return null;
 return {object:hit.object,localNormal:hit.face.normal.clone(),normal,point:hit.point.clone()};
}

export function measurePlanes(a,b){
 if(Math.abs(a.normal.dot(b.normal))<1-1e-6)return null;
 const signed=b.point.clone().sub(a.point).dot(a.normal);
 return {distance:Math.abs(signed),start:a.point.clone(),end:a.point.clone().addScaledVector(a.normal,signed)};
}

function surfaceVertices(surface,matrix=surface.object.matrixWorld){
 const source=surface.object.geometry,index=source.index,p=source.attributes.position,vertices=[];
 const a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3(),normal=new T.Vector3();
 for(let i=0;i<(index?.count??p.count);i+=3){
  const ids=[0,1,2].map(j=>index?index.getX(i+j):i+j);
  a.fromBufferAttribute(p,ids[0]);b.fromBufferAttribute(p,ids[1]);c.fromBufferAttribute(p,ids[2]);
  normal.subVectors(b,a).cross(c.clone().sub(a)).normalize();
  if(normal.dot(surface.localNormal)<.99999)continue;
  for(const v of [a,b,c])vertices.push(...v.toArray());
 }
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geometry.applyMatrix4(matrix);
 const result=Array.from(geometry.attributes.position.array);geometry.dispose();return result;
}

function highlight(vertices,color){
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));
 return new T.Mesh(geometry,new T.MeshBasicMaterial({color,transparent:true,opacity:.35,side:T.DoubleSide,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4}));
}
function dimension(start,end,color){
 const line=new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(...start),new T.Vector3(...end)]),new T.LineBasicMaterial({color,depthTest:false}));line.renderOrder=10;return line;
}
function clear(group){for(const o of [...group.children]){group.remove(o);o.geometry.dispose();o.material.dispose();}}
export function createSurfaceRegistry(root){
 root.updateMatrixWorld(true);const entries=new Map();
 root.traverse(object=>{
  if(!object.userData.measureId)return;
  object.geometry.computeBoundingBox();
  entries.set(object.userData.measureId,{object,matrix:object.matrixWorld.clone(),bounds:object.geometry.boundingBox.clone()});
 });
 const anchorFor=(entry,point,localNormal,matrix)=>{
  const local=point.clone().applyMatrix4(matrix.clone().invert()),size=entry.bounds.getSize(new T.Vector3());
  return {id:entry.object.userData.measureId,normal:localNormal.toArray(),position:local.sub(entry.bounds.min).divide(size).toArray().map(n=>T.MathUtils.clamp(n,0,1))};
 };
 const resolve=anchor=>{
  const entry=entries.get(anchor?.id);if(!entry)return null;
  const {object,matrix,bounds}=entry,localNormal=new T.Vector3(...anchor.normal);
  const point=new T.Vector3(...anchor.position).multiply(bounds.getSize(new T.Vector3())).add(bounds.min).applyMatrix4(matrix);
  const normal=localNormal.clone().applyNormalMatrix(new T.Matrix3().getNormalMatrix(matrix));
  return {name:object.name||'Поверхность',kind:object.userData.measureSurface||'wall',anchor,point:point.toArray(),normal:normal.toArray(),vertices:surfaceVertices({object,localNormal},matrix)};
 };
 const legacyAnchor=s=>{
  const matches=[];
  for(const entry of entries.values()){
   if((entry.object.name||'Поверхность')!==s.name||(entry.object.userData.measureSurface||'wall')!==s.kind)continue;
   const local=new T.Vector3(...s.point).applyMatrix4(entry.matrix.clone().invert());
   if(!entry.bounds.clone().expandByScalar(.001).containsPoint(local))continue;
   for(const axis of ['x','y','z'])for(const sign of [-1,1]){
    const normal=new T.Vector3();normal[axis]=sign;
    const worldNormal=normal.clone().applyNormalMatrix(new T.Matrix3().getNormalMatrix(entry.matrix));
    if(worldNormal.dot(new T.Vector3(...s.normal))<.999999||Math.abs(local[axis]-entry.bounds[sign>0?'max':'min'][axis])>.001)continue;
    matches.push(anchorFor(entry,new T.Vector3(...s.point),normal,entry.matrix));
   }
  }
  return matches.length===1?matches[0]:null;
 };
 return {
  capture(surface){
   const entry=entries.get(surface.object.userData.measureId);
   if(entry)return resolve(anchorFor(entry,surface.point,surface.localNormal,surface.object.matrixWorld));
   return {name:surface.object.name||'Поверхность',kind:surface.object.userData.measureSurface||'wall',point:surface.point.toArray(),normal:surface.normal.toArray(),vertices:surfaceVertices(surface)};
  },
  resolveRecords(records){return records.map(record=>{
   const surfaces=record.surfaces.map(s=>resolve(s.anchor||legacyAnchor(s)));
   if(surfaces.some(s=>!s))return {...record,unresolved:true};
   if(record.type==='width'||record.type==='height'){
    const result=surfaces.length===1&&measureSurfaceExtent(surfaces[0],record.type);
    return result?{...record,...result,surfaces,unresolved:false}:{...record,unresolved:true};
   }
   const result=measurePlanes(...surfaces.map(s=>({point:new T.Vector3(...s.point),normal:new T.Vector3(...s.normal)})));
   if(!result||result.distance<.0001)return {...record,unresolved:true};
   return {...record,unresolved:false,surfaces,distance:result.distance,start:result.start.toArray(),end:result.end.toArray()};
  })}
 };
}
export function visibleReviews(records,{active,showCorrect,floor}){
 return active?records.filter(r=>(floor===0||r.floor===floor)&&(measurementStatus(r)!=='correct'||showCorrect)):[];
}
export function createWallMeasurement(scene,onChange,onDraft=()=>{},root=scene){
 const registry=createSurfaceRegistry(root);
 const overlay=new T.Group(),reviewed=new T.Group();scene.add(overlay,reviewed);let selected=[],type='distance';
 const reset=()=>{selected=[];clear(overlay);onDraft(null);onChange(type==='distance'?'Выберите первую поверхность: стену, пол или потолок.':'Нажмите на участок стены, чтобы измерить его '+(type==='width'?'ширину.':'высоту.'));};
 return {reset,setType(value){type=value;reset();},resolveRecords:registry.resolveRecords,setReviews(records,options){
  clear(reviewed);
  for(const record of visibleReviews(records,options)){
   if(measurementStatus(record)==='unresolved')continue;
   const color=measurementStatus(record)==='correct'?'#159447':'#df3030';
   const add=object=>{if(Number.isFinite(options.cap))object.material.clippingPlanes=[new T.Plane(new T.Vector3(0,-1,0),options.cap)];reviewed.add(object);};
   for(const surface of record.surfaces){
    if(options.mode==='overview'&&surface.kind==='ceiling')continue;
    add(highlight(surface.vertices,color));
   }
   add(dimension(record.start,record.end,color));
  }
 },select(hit){
  const surface=wallSurface(hit);
  if(!surface){onChange('Выберите поверхность стены, пола или потолка.');return;}
  if(type!=='distance'){
   const snapshot=registry.capture(surface),result=measureSurfaceExtent(snapshot,type);
   if(!result){onChange('Выберите вертикальную поверхность участка стены.');return;}
   reset();overlay.add(highlight(surfaceVertices(surface),'#1588e8'));
   overlay.add(dimension(result.start,result.end,'#d36b00'));
   onDraft({...result,type,surfaces:[snapshot]});
   onChange(type==='width'?'Ширина выбранного участка стены.':'Полная высота выбранного участка стены.');return;
  }
  if(selected.length===2)reset();
  if(selected.length===0){selected.push(surface);overlay.add(highlight(surfaceVertices(surface),'#1588e8'));onChange('Первая поверхность выделена синим. Выберите параллельную ей поверхность.');return;}
  const result=measurePlanes(selected[0],surface);
  if(!result){onChange('Поверхности не параллельны. Выберите другую вторую поверхность.');return;}
  if(result.distance<.0001){onChange('Это та же плоскость. Выберите другую параллельную поверхность.');return;}
  selected.push(surface);overlay.add(highlight(surfaceVertices(surface),'#e78412'));
  overlay.add(dimension(result.start.toArray(),result.end.toArray(),'#d36b00'));
  const surfaces=selected.map(registry.capture),current=measurePlanes(...surfaces.map(s=>({point:new T.Vector3(...s.point),normal:new T.Vector3(...s.normal)})));
  onDraft({type:'distance',distance:current.distance,start:current.start.toArray(),end:current.end.toArray(),surfaces});
  onChange(`Расстояние в модели: ${(result.distance*100).toLocaleString('ru-RU',{maximumFractionDigits:1})} см. По перпендикуляру между плоскостями. Следующий клик начнёт новый замер.`);
 },dispose(){clear(overlay);clear(reviewed);scene.remove(overlay,reviewed);}};
}
