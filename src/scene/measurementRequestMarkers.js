import * as T from 'three';
import {HALL,STAIR,UPPER_HALL_PLAN,LEVEL,mirrorX,LIVING,CHILD} from '../model/layout.js';

export function requestEndpoints(id){
 const [rear,left,front,right]=HALL.bounds,upperLeft=UPPER_HALL_PLAN.bounds[1];
 const x=(STAIR.holeX0+STAIR.x1)/2;
 const points={
  'stair-wall-offset':[[x,LEVEL+.12,left],[x,LEVEL+.12,upperLeft]],
  'stair-opening-gap':[[x,LEVEL+.03,upperLeft],[x,LEVEL+.03,STAIR.holeZ0]],
  'hall-width-entrance':[[front-.35,.35,left],[front-.35,.35,right]],
  'hall-width-bathroom':[[rear+.35,.35,left],[rear+.35,.35,right]],
  'bathroom-door-opening':[[rear,1,HALL.bathroom.at],[rear,1,HALL.bathroom.at+HALL.bathroom.width]],
  'storey-floor-height':[[STAIR.holeX0,0,STAIR.holeZ0],[STAIR.holeX0,LEVEL,STAIR.holeZ0]],
  // Inside wall faces below the windows; these are not glass/reveal depths.
  'living-window-to-hall':[[rear+.25,.65,LIVING.z0],[rear+.25,.65,LIVING.z1]],
  'child-window-to-hall':[[UPPER_HALL_PLAN.bounds[0]+.25,LEVEL+.65,CHILD.bounds[1]],[UPPER_HALL_PLAN.bounds[0]+.25,LEVEL+.65,CHILD.bounds[3]]]
 }[id];
 return points?.map(([px,y,z])=>[mirrorX(px),y,z]);
}

export function createRequestMarkers(scene){
 const group=new T.Group();scene.add(group);
 function clear(){group.traverse(object=>{object.geometry?.dispose();if(object.material){object.material.map?.dispose();object.material.dispose();}});group.clear();}
 function show(id){
  clear();const points=requestEndpoints(id);if(!points)return;
  const [a,b]=points.map(p=>new T.Vector3(...p));
  const material=new T.LineBasicMaterial({color:'#1764c0',depthTest:false,depthWrite:false});
  const line=new T.Line(new T.BufferGeometry().setFromPoints([a,b]),material);line.renderOrder=1000;group.add(line);
  for(const [index,point] of [a,b].entries()){
   const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;
   const ctx=canvas.getContext('2d');ctx.fillStyle='#1764c0';ctx.beginPath();ctx.arc(64,64,51,0,Math.PI*2);ctx.fill();ctx.strokeStyle='white';ctx.lineWidth=6;ctx.stroke();ctx.fillStyle='white';ctx.font='bold 64px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(index?'Б':'А',64,66);
   const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
   const marker=new T.Sprite(new T.SpriteMaterial({map:texture,depthTest:false,depthWrite:false}));
   marker.position.copy(point);marker.scale.set(.24,.24,1);marker.renderOrder=1001;group.add(marker);
   // Separate labels for very short gaps while preserving exact endpoint dots.
   if(a.distanceTo(b)<.35)marker.position.y+=index?.22:.5;
   const dot=new T.Mesh(new T.SphereGeometry(.025,8,6),new T.MeshBasicMaterial({color:'#1764c0',depthTest:false,depthWrite:false}));dot.position.copy(point);dot.renderOrder=1001;group.add(dot);
   const leader=new T.Line(new T.BufferGeometry().setFromPoints([point,marker.position]),new T.LineBasicMaterial({color:'#1764c0',depthTest:false,depthWrite:false}));leader.renderOrder=1000;group.add(leader);
  }
  return {target:a.clone().add(b).multiplyScalar(.5),span:a.distanceTo(b)};
 }
 return {show,clear,dispose(){clear();scene.remove(group);}};
}
