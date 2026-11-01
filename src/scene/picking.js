import {LEVEL,roomAt} from '../model/layout.js';

// Decorative lines are not solid surfaces. Three's default one-metre line
// threshold can otherwise intercept clicks through walls from adjacent rooms.
export function pickSurface(ray,root){
 return ray.intersectObject(root,true).find(hit=>{
  if(!hit.object.isMesh||hit.object.userData.pickThrough)return false;
  for(let object=hit.object;object;object=object.parent)if(!object.visible)return false;
  return true;
 });
}

// Resolve the visible surface, including rugs and furniture, on the active floor.
// Do not select a lower room through the stair opening or through an exterior wall.
export function roomForSurface(hit,floor){
 if(!hit||!floor)return null;
 let owner=hit.object;
 while(owner&&owner.userData.floor===undefined)owner=owner.parent;
 if(owner?.userData.floor!==floor)return null;
 return roomAt(hit.point.x,hit.point.z,floor===2?LEVEL:0)??null;
}

