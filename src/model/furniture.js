import * as T from 'three';

// Articulated furniture stays under the same reflected root as the building.
export function createFurniture({box,mats,pickables}) {
 const items=[],bounds=new T.Box3();
 function register(parent,{id,label,roomId,parts,offset=[0,0,0],pivot=null,angle=0}){
  const group=new T.Group();group.name=label;parent.add(group);
  if(pivot)group.position.fromArray(pivot);
  for(const part of parts){group.add(part);if(pivot)part.position.sub(group.position);}
  const item={id,label,roomId,group,origin:group.position.clone(),offset:new T.Vector3(...offset),angle,progress:0,open:false};
  group.traverse(o=>{if(o.isMesh){o.userData.furnitureId=id;pickables.push(o);}});items.push(item);return item;
 }
 function drawer(parent,{id,label,roomId,front,handle,axis,travel,width,height,depth,bodyMaterial=mats.wood}){
  const p=front.position,parts=[front,handle],sign=Math.sign(travel);
  const along=axis==='x'?'x':'z';
  const add=(name,u,y,v,w,h,d)=>{const pos=along==='x'?[v,y,u]:[u,y,v],size=along==='x'?[d,h,w]:[w,h,d];const o=box(parent,name,...pos,...size,bodyMaterial);parts.push(o);};
  const u=along==='x'?p.z:p.x,v=p[along]-sign*depth/2,y=p.y;
  add('Дно выдвижного ящика',u,y-height/2+.016,v,width-.025,.016,depth);
  for(const side of [-1,1])add('Боковина выдвижного ящика',u+side*(width/2-.016),y,v,.016,height-.018,depth);
  add('Задняя стенка выдвижного ящика',u,y,p[along]-sign*(depth-.008),width-.025,height-.018,.016);
  return register(parent,{id,label,roomId,parts,offset:axis==='x'?[travel,0,0]:[0,0,travel]});
 }
 function set(item,t){item.group.position.copy(item.origin).addScaledVector(item.offset,t);item.group.rotation.y=item.angle*t;item.group.updateWorldMatrix(true,true);}
 function intersects(item,x,z,y){bounds.setFromObject(item.group);return y+.1<bounds.max.y&&y+1.62>bounds.min.y&&x>bounds.min.x-.16&&x<bounds.max.x+.16&&z>bounds.min.z-.16&&z<bounds.max.z+.16;}
 function toggle(id,player){const item=items.find(i=>i.id===id);if(!item)return false;const target=item.open?0:1;
  if(player){for(let n=1;n<=24;n++){set(item,item.progress+(target-item.progress)*n/24);if(intersects(item,...player)){set(item,item.progress);return false;}}set(item,item.progress);}
  item.open=!item.open;return true;
 }
 function update(dt){for(const i of items){const target=i.open?1:0;if(i.progress===target)continue;i.progress+=Math.sign(target-i.progress)*Math.min(Math.abs(target-i.progress),dt*1.8);set(i,i.progress);}}
 return {register,drawer,items,toggle,update,snapshot:()=>items.map(({id,label,roomId,open})=>({id,label,roomId,open})),blocked:(x,z,y)=>items.some(i=>intersects(i,x,z,y))};
}
