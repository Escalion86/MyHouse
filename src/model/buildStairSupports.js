import * as T from 'three';
import {STAIR,LEVEL} from './layout.js';

// Visual reconstruction from the underside photos. Profile sizes and bolt
// spacing are approximate; stair position and walking surfaces stay unchanged.
export function buildStairSupports(parent,{box,mat}){
 const s=STAIR,h=LEVEL/s.rises,cx=s.x1-s.width,cz=s.z0+s.width;
 const steel=mat('#493024',{metalness:.55,roughness:.48});
 const bolt=mat('#786251',{metalness:.8,roughness:.38});
 const frame=new T.Group();frame.name='Металлический каркас лестницы';parent.add(frame);
 const profile=.045,inset=.10;
 function beam(name,a,b,width=profile){
  const start=new T.Vector3(...a),end=new T.Vector3(...b),delta=end.clone().sub(start);
  const mesh=box(frame,name,...start.clone().add(end).multiplyScalar(.5).toArray(),width,delta.length()+width,width,steel);
  mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());return mesh;
 }
 function fastener(x,y,z){
  const screw=new T.Mesh(new T.CylinderGeometry(.006,.006,.004,6),bolt);
  screw.name='Болт крепления косоура';screw.position.set(x,y-profile/2-.002,z);frame.add(screw);
 }
 function flight(name,count,firstStep,start,run,alongX){
  const p=(t,y,side)=>alongX?[start[0]+t,y,start[1]+side]:[start[0]+side,y,start[1]+t];
  // The wood riser occupies -1..17 mm from the step boundary. Keep the
  // entire steel profile behind its back face, with a 2 mm clearance.
  const behindRiser=.017+profile/2+.002;
  for(let i=0;i<count;i++){
   const y=(firstStep+i)*h-.06-profile/2;
   for(const side of [inset,s.width-inset]){
    beam(name+' · горизонталь',p(i*run+behindRiser,y,side),p((i+1)*run+behindRiser,y,side));
    const bottom=i===0?(firstStep===1?profile/2:y-h):y-h;
    beam(name+' · вертикаль',p(i*run+behindRiser,bottom,side),p(i*run+behindRiser,y,side));
    for(const t of [.22,.78])fastener(...p((i+t)*run,y,side));
   }
   if(i%3===0||i===count-1)beam(name+' · поперечина',p((i+.55)*run,y,inset),p((i+.55)*run,y,s.width-inset),.03);
  }
 }
 flight('Нижний стальной косоур',s.lowerSteps,1,[s.x0,s.z0],(cx-s.x0)/s.lowerSteps,true);
 flight('Верхний стальной косоур',s.upperSteps,s.lowerSteps+s.winderSteps+1,[cx,cz],(s.z1-cz)/s.upperSteps,false);
 // The outer rail follows the two walls around the winders. The inner rail
 // turns tightly around the open corner, with crossmembers under the wood.
 const inner=a=>[cx+inset*Math.cos(a),cz+inset*Math.sin(a)];
 const outer=a=>{const r=(s.width-inset)/Math.max(Math.abs(Math.cos(a)),Math.abs(Math.sin(a)));return[cx+r*Math.cos(a),cz+r*Math.sin(a)];};
 for(let i=0;i<s.winderSteps;i++){
  const a=-Math.PI/2+i*Math.PI/(2*s.winderSteps),b=a+Math.PI/(2*s.winderSteps),y=(s.lowerSteps+1+i)*h-.08-profile/2;
  // Diagonal risers need clearance for the square profile's projected
  // half-width as well. Recess the whole section behind the wooden face.
  const setback=.017+profile*Math.SQRT2/2+.002;
  const behind=point=>[point[0]-Math.sin(a)*setback,point[1]+Math.cos(a)*setback];
  for(const [label,path] of [['пристенный',outer],['внутренний',inner]]){
   const angles=[a,...(a<-Math.PI/4&&b>-Math.PI/4?[-Math.PI/4]:[]),b];
   for(let j=1;j<angles.length;j++){
    const from=behind(path(angles[j-1])),to=behind(path(angles[j]));beam('Поворот · '+label,[from[0],y,from[1]],[to[0],y,to[1]]);
   }
   const from=behind(path(a));beam('Поворот · вертикаль',[from[0],y-h,from[1]],[from[0],y,from[1]]);
  }
  const aMid=(a+b)/2,from=behind(inner(aMid)),to=behind(outer(aMid));
  beam('Поворот · поперечина',[from[0],y,from[1]],[to[0],y,to[1]],.035);
 }
 const postHeight=(s.lowerSteps+s.winderSteps)*h-.08;
 box(frame,'Стальная стойка у поворота',cx+inset,postHeight/2,cz+.03,.06,postHeight,.06,steel,true);
 box(frame,'Опорная пластина стойки',cx+inset,.006,cz+.03,.10,.012,.10,steel);
 beam('Обвязка стойки',[cx+inset,postHeight-profile/2,cz],[cx+s.width-inset,postHeight-profile/2,cz],.06);
 return ()=>{steel.dispose();bolt.dispose();};
}
