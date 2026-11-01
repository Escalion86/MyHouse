import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

export function buildOfficeChair(parent,{mats,mat}) {
 const chair=new T.Group();chair.name='Офисное кресло';
 chair.position.set(3.73,0,11.20);chair.rotation.y=Math.PI*3/4;parent.add(chair);
 const upholstery=mat('#333638',{roughness:.88});
 function mesh(name,geometry,material,x,y,z){const part=new T.Mesh(geometry,material);part.name=name;part.position.set(x,y,z);part.castShadow=part.receiveShadow=true;chair.add(part);return part;}
 const cushion=(name,x,y,z,w,h,d,r,material=upholstery)=>mesh(name,new RoundedBoxGeometry(w,h,d,4,r),material,x,y,z);
 function rod(name,a,b,r,material=mats.metal){const start=new T.Vector3(...a),end=new T.Vector3(...b),delta=end.clone().sub(start);
  const part=mesh(name,new T.CylinderGeometry(r,r,delta.length(),16),material,...start.clone().add(end).multiplyScalar(.5).toArray());
  part.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());return part;
 }
 // Seat, back and armrests share one local frame; the seat faces the desk cut-out.
 cushion('Сиденье кресла',0,.54,0,.55,.115,.54,.045);
 cushion('Основание сиденья',0,.465,.025,.40,.035,.38,.012,mats.dark);
 rod('Газлифт кресла',[0,.12,0],[0,.455,0],.027);
 rod('Кожух газлифта',[0,.12,0],[0,.30,0],.039,mats.dark);
 rod('Кронштейн спинки',[0,.46,.14],[0,.80,.265],.025,mats.dark);
 const back=cushion('Спинка кресла',0,.99,.25,.53,.78,.115,.052);back.rotation.x=-.10;
 const head=cushion('Подголовник кресла',0,1.30,.235,.45,.19,.12,.055);head.rotation.x=-.10;
 for(const side of [-1,1]){
  const x=side*.325;
  cushion('Подлокотник кресла',x,.745,-.015,.082,.055,.39,.025,mats.dark);
  for(const z of [-.13,.13])rod('Стойка подлокотника',[side*.24,.475,z],[x,.72,z],.015,mats.dark);
 }
 for(let i=0;i<5;i++){
  const a=i*Math.PI*2/5,s=Math.sin(a),c=Math.cos(a);
  rod('Луч крестовины кресла',[s*.035,.13,c*.035],[s*.305,.09,c*.305],.019);
  rod('Шток колеса',[s*.305,.06,c*.305],[s*.305,.10,c*.305],.011,mats.dark);
  for(const side of [-1,1]){
   const wheel=mesh('Колесо кресла',new T.CylinderGeometry(.038,.038,.024,20),mats.dark,s*.305+c*side*.021,.041,c*.305-s*side*.021);
   wheel.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),new T.Vector3(c,0,-s));
  }
 }
 return chair;
}
