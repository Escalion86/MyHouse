import * as T from 'three';

// Door-local X follows the leaf, Y is up. Collision follows the animated hinge.
export function createDoors({box,mats,pickables}) {
 const doors=[];
 const brass=new T.MeshStandardMaterial({color:'#b99a53',metalness:.8,roughness:.3});
 const frosted=new T.MeshStandardMaterial({color:'#bfcccd',metalness:.1,roughness:.55});
 function add(parent,{id,label,axis,at,width,fixed,base=0,height=2.1,swing=1,dark=false,floor=1,hingeSide='start',material,style}) {
  const pivot=at+(hingeSide==='end'?width:0);
  const hinge=new T.Group();hinge.name=label;hinge.position.set(axis==='x'?pivot:fixed,base,axis==='x'?fixed:pivot);parent.add(hinge);
  const closed=(axis==='x'?0:-Math.PI/2)+(hingeSide==='end'?Math.PI:0);hinge.rotation.y=closed;
  const w=width-.04,h=height-.035;
  const leaf=box(hinge,label+' · полотно',width/2,h/2+.01,0,w,h,.045,material||(dark?mats.dark:mats.white));
  if(style==='pvc-glazed'){
   const shape=new T.Shape();shape.moveTo(-w/2,-h/2);shape.lineTo(w/2,-h/2);shape.lineTo(w/2,h/2);shape.lineTo(-w/2,h/2);shape.closePath();
   const hole=new T.Path();hole.moveTo(-w/2+.07,-h/2+.10);hole.lineTo(-w/2+.07,h/2-.07);hole.lineTo(w/2-.07,h/2-.07);hole.lineTo(w/2-.07,-h/2+.10);hole.closePath();shape.holes.push(hole);
   leaf.geometry.dispose();leaf.geometry=new T.ExtrudeGeometry(shape,{depth:.045,bevelEnabled:false});leaf.geometry.translate(0,0,-.0225);
   box(hinge,'Стекло балконной двери',width/2,h/2+.025,0,w-.14,h-.17,.016,mats.glass);
  }
  if(style==='wood-glazed'){
   const shape=new T.Shape();shape.moveTo(-w/2,-h/2);shape.lineTo(w/2,-h/2);shape.lineTo(w/2,h/2);shape.lineTo(-w/2,h/2);shape.closePath();
   for(const [center,tall] of [[.43,.10],[.84,.10],[1.25,.10],[1.72,.56]]){
    const cy=center-(h/2+.01),left=-w/2+.12,right=w/2-.12,low=cy-tall/2,high=cy+tall/2;
    const hole=new T.Path();hole.moveTo(left,low);hole.lineTo(left,high);hole.lineTo(right,high);hole.lineTo(right,low);hole.closePath();shape.holes.push(hole);
    box(hinge,'Матовое стекло двери детской',width/2,center,0,w-.24,tall,.025,frosted);
   }
   leaf.geometry.dispose();leaf.geometry=new T.ExtrudeGeometry(shape,{depth:.045,bevelEnabled:false});leaf.geometry.translate(0,0,-.0225);
  }
  for(const side of [-1,1]){
   if(style==='pvc-glazed'){
    box(hinge,'Белая ручка балконной двери',width-.09,1.03,side*.06,.024,.13,.025,mats.white);
    continue;
   }
   if(style?.startsWith('wood')){
    const knobMaterial=id==='bedroom'?mats.metal:brass;
    box(hinge,'Розетка круглой ручки',width-.12,1.02,side*.035,.055,.055,.02,knobMaterial);
    const knob=new T.Mesh(new T.SphereGeometry(.029,16,12),knobMaterial);knob.name='Круглая ручка двери';knob.position.set(width-.12,1.02,side*.072);hinge.add(knob);
    continue;
   }
   for(const yy of [.32,1.03,1.75])box(hinge,'Филёнка двери',width/2,yy,side*.025,w-.15,.012,.006,material||(dark?mats.metal:mats.wall));
   box(hinge,'Розетка ручки',width-.13,1.02,side*.039,.04,.08,.025,mats.dark);
   box(hinge,'Ручка двери',width-.18,1.04,side*.060,.13,.018,.02,mats.dark);
  }
  const door={id,label,hinge,leaf,width,height,base,floor,closed,swing,open:false,angle:0};doors.push(door);
  hinge.traverse(o=>{if(o.isMesh){o.userData.doorId=id;pickables.push(o);}});
  return door;
 }
 const v=new T.Vector3();
 function intersects(d,x,z,y,r=.16){
  if(y+1.62<d.base||y+.1>d.base+d.height)return false;
  d.hinge.updateWorldMatrix(true,false);v.set(x,y+.8,z);d.hinge.worldToLocal(v);
  const cx=Math.max(.02,Math.min(d.width-.02,v.x)),cz=Math.max(-.023,Math.min(.023,v.z));
  return (v.x-cx)**2+(v.z-cz)**2<r*r;
 }
 function toggle(id,player){
  const d=doors.find(d=>d.id===id);if(!d)return false;
  const target=d.open?0:d.swing*Math.PI/2;
  if(player){
   const old=d.hinge.rotation.y;
   for(let n=1;n<=24;n++){
    d.hinge.rotation.y=d.closed+d.angle+(target-d.angle)*n/24;
    if(intersects(d,...player)){d.hinge.rotation.y=old;d.hinge.updateWorldMatrix(true,false);return false;}
   }
   d.hinge.rotation.y=old;d.hinge.updateWorldMatrix(true,false);
  }
  d.open=!d.open;return true;
 }
 function update(dt){for(const d of doors){const target=d.open?d.swing*Math.PI/2:0;d.angle+=Math.sign(target-d.angle)*Math.min(Math.abs(target-d.angle),dt*2.5);d.hinge.rotation.y=d.closed+d.angle;}}
 const snapshot=()=>doors.map(({id,label,floor,open})=>({id,label,floor,open}));
 return {add,doors,toggle,update,snapshot,blocked:(x,z,y)=>doors.some(d=>intersects(d,x,z,y)),dispose:()=>{brass.dispose();frosted.dispose();}};
}
