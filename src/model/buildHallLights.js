import * as T from 'three';
import {LEVEL,HALL,STAIR} from './layout.js';

// Rail length and aiming angles are estimated from the owner's photographs.
// Upstairs positions follow the window and shower corners in the Sept 30 photos.
export function buildHallLights(ceilings,{box,cylinder,mat,mats,pickables}){
 mats.trackBlack=mat('#151718',{roughness:.64});
 mats.trackLens=mat('#deded4',{roughness:.25,emissive:'#e5e3d7',emissiveIntensity:.12});
 const fixtures=[
  // Keep the rail on the solid ceiling beside the measured stair opening.
  // The roughly 55 cm centre offset is estimated from the underside photo.
  {name:'У входа',floor:1,x:STAIR.holeX0-.55,z:HALL.entrance.at+HALL.entrance.width/2,angle:Math.PI/2},
  {name:'У ванной',floor:1,x:HALL.bounds[0]+.76,z:HALL.bathroom.at+.40,angle:Math.PI/2},
  {name:'Коридор 2 этажа · у душевой',floor:2,x:3.05,z:6.90,angle:Math.PI/2},
  {name:'Коридор 2 этажа · у окна',floor:2,x:6.73,z:5.10,angle:Math.PI/2}
 ];
 for(const f of fixtures){
  const rail=new T.Group();rail.name='Трековый светильник · '+f.name;
  rail.position.set(f.x,f.floor===1?3:LEVEL+2.70,f.z);rail.rotation.y=f.angle;
  rail.userData={floor:f.floor,placementAccuracy:'photo-estimate'};ceilings.add(rail);
  box(rail,'Чёрная шина · 3 спота',0,-.014,0,1.12,.028,.034,mats.trackBlack);
  box(rail,'Паз шины',0,-.029,0,1.07,.005,.010,mats.dark);
  for(const x of [-.545,.545])box(rail,'Торцевая заглушка шины',x,-.014,0,.025,.030,.037,mats.trackBlack);
  for(const [i,x] of [-.36,0,.36].entries()){
   box(rail,'Адаптер спота',x,-.037,0,.074,.025,.046,mats.trackBlack);
   cylinder(rail,x,-.064,0,.010,.010,.030,mats.trackBlack);
   const pivot=cylinder(rail,x,-.077,0,.015,.015,.044,mats.trackBlack);pivot.rotation.x=Math.PI/2;
   const head=new T.Group();head.name='Поворотный цилиндрический спот';head.position.set(x,-.077,0);
   head.rotation.z=[-.22,.02,.18][i];head.rotation.x=f.floor===1?.13:-.10;rail.add(head);
   const shell=new T.Mesh(new T.CylinderGeometry(.029,.029,.143,32,1,true),mats.trackBlack);
   shell.name='Чёрный корпус спота';shell.position.y=-.0715;shell.castShadow=shell.receiveShadow=true;head.add(shell);
   cylinder(head,0,-.002,0,.028,.028,.005,mats.trackBlack,32).name='Задняя крышка спота';
   cylinder(head,0,-.125,0,.022,.022,.005,mats.trackLens,32).name='Утопленная линза спота';
   const rim=new T.Mesh(new T.TorusGeometry(.026,.003,8,32),mats.trackBlack);rim.name='Ободок спота';rim.rotation.x=Math.PI/2;rim.position.y=-.142;head.add(rim);
  }
  // These luminaires share the existing hall circuit; do not invent extra devices.
  rail.traverse(o=>{if(o.isMesh){o.userData.deviceId=f.floor===1?'hall-entry-lights':'upstairs-hall-light';o.userData.channelId=f.floor===1?'hall':'hall-upstairs';pickables.push(o);}});
 }
}
