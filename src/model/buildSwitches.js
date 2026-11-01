import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {devices,HALL} from './layout.js';

// Approximate height/offsets from the photos. Each local +Z face points into
// the room from which the switch is operated. Wiring assignments are user data.
export const switchLocations={
 'office-lights':{position:[HALL.officeOpening.at+HALL.officeOpening.width+.17,1.0,7.99],angle:0},
 'hall-entry-lights':{position:[HALL.bounds[2],1.0,HALL.entrance.at-.20],angle:-Math.PI/2},
 'bathroom-light':{position:[HALL.bounds[0],1.0,HALL.bathroom.at+HALL.bathroom.width+.125],angle:Math.PI/2},
 'living-lights':{position:[HALL.livingOpening.at+HALL.livingOpening.width+.18,1.0,HALL.bounds[1]],angle:0},
 // The root reflects X: +X is to the viewer's left on this corridor wall.
 'upstairs-hall-light':{position:[HALL.livingOpening.at+HALL.livingOpening.width+.264,1.0,HALL.bounds[1]],angle:0}
};

export function buildSwitches(parent,{mats,pickables,deviceMeshes}){
 const rockers=new Map(),materials=[];
 for(const [id,location] of Object.entries(switchLocations)){
  const d=devices.find(d=>d.id===id),group=new T.Group();
  group.name=d.name;group.position.set(...location.position);group.rotation.y=location.angle;
  group.userData.deviceId=id;parent.add(group);deviceMeshes[id]=group;
  const mesh=(name,x,z,w,h,depth,material,channelId)=>{
   const o=new T.Mesh(new RoundedBoxGeometry(w,h,depth,2,.002),material);
   o.name=name;o.position.set(x,0,z);o.castShadow=o.receiveShadow=true;
   o.userData={deviceId:id,...(channelId?{channelId}:{})};group.add(o);pickables.push(o);return o;
  };
  mesh(d.name+' · рамка',0,.006,.084,.084,.012,mats.white);
  mesh(d.name+' · основание клавиш',0,.013,.069,.069,.004,mats.metal);
  const n=d.channels.length,width=.066/n;
  d.channels.forEach((channel,i)=>{
   // The house root mirrors X: invert the local order so key 1 is left
   // when facing the mounted switch, including switches on rotated walls.
   const x=((n-1)/2-i)*width;
   const keyMaterial=mats.white.clone(),markMaterial=mats.metal.clone();materials.push(keyMaterial,markMaterial);
   const key=mesh(channel.label,x,.019,width-.002,.066,.009,keyMaterial,channel.id);
   key.userData.channelLabel=channel.label;
   const mark=mesh(channel.label+' · метка',0,.0055,.014,.004,.001,markMaterial,channel.id);mark.position.y=-.020;key.add(mark);
   rockers.set(`${id}:${channel.id}`,{key,mark});
  });
 }
 function setStates(states={}){
  for(const [id,{key,mark}] of rockers){
   const state=states[id]||'disconnected',on=state==='on',off=state==='off';
   key.userData.powerState=state;mark.userData.powerState=state;
   key.rotation.x=on?-.12:off?.12:0;
   key.material.color.set(on?'#dbeedf':'#f2f1e9');
   key.material.emissive.set(on?'#246545':'#000000');key.material.emissiveIntensity=on?.18:0;
   mark.material.color.set(on?'#46e18f':off?'#424c49':state==='unavailable'?'#bd9450':'#929796');
   mark.material.emissive.set(on?'#37e583':'#000000');mark.material.emissiveIntensity=on?2.2:0;
   mark.material.metalness=0;mark.material.roughness=.5;
  }
 }
 setStates();
 return {setStates,dispose:()=>materials.forEach(m=>m.dispose())};
}
