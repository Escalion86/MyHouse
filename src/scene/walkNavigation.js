import {LEVEL, STAIR, mirrorX, stairHeight, CHILD, planRooms} from '../model/layout.js';

const MAX_RISE = LEVEL / STAIR.rises + .015;
const insideHole = (x,z) => x>mirrorX(STAIR.x1)&&x<mirrorX(STAIR.holeX0)&&z>STAIR.holeZ0&&z<STAIR.z1;
const upstairs = (x,z) => x>=mirrorX(7.5)&&x<=mirrorX(-.33)&&z>=CHILD.bounds[1]-.15&&z<=planRooms.find(r=>r.id==='room-6').bounds[3]+.14;

// Resolve the supporting surface before collisions. Upstairs floor takes
// precedence over a flight underneath it; the empty part of the opening never does.
export function walkSurface(x,z,feet) {
 const tread=stairHeight(x,z);
 if(feet>=LEVEL-1e-6) return upstairs(x,z)?(insideHole(x,z)?tread:LEVEL):null;
 if(feet<.1) return tread!==null&&tread>1.85?0:tread??0;
 if(tread!==null) return tread;
 if(feet>=LEVEL-MAX_RISE&&upstairs(x,z)&&!insideHole(x,z)) return LEVEL;
 return feet<=MAX_RISE?0:null;
}

export function walkBlocked(model,x,z,feet) {
 return model.doorSystem.blocked(x,z,feet)||model.furnitureSystem.blocked(x,z,feet)||model.colliders.some(b=>
  x>b.minX-.16&&x<b.maxX+.16&&z>b.minZ-.16&&z<b.maxZ+.16&&feet+1.3>b.minY&&feet+.1<b.maxY);
}

// Short steps also keep low-frame-rate motion from skipping a narrow tread or wall.
export function moveWalker(state,dx,dz,blocked) {
 let next=state;
 const count=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.025));
 const attempt=(x,z)=>{
  const feet=walkSurface(x,z,next.feet);
  if(feet===null||Math.abs(feet-next.feet)>MAX_RISE||x<=-10||x>=24||z<=-1.2||z>=23||blocked(x,z,feet))return false;
  next={x,z,feet};return true;
 };
 for(let i=0;i<count;i++){
  if(!attempt(next.x+dx/count,next.z+dz/count)){
   if(dx)attempt(next.x+dx/count,next.z);
   if(dz)attempt(next.x,next.z+dz/count);
  }
 }
 return next;
}

// A centreline through the two flights and the three winders, with landings.
const s=STAIR,cx=s.x1-s.width,cz=s.z0+s.width,r=s.width/2;
const routeCorners=[
 [mirrorX(s.x0)+.35,s.z0+r],
 [mirrorX(cx),cz-r],
 ...Array.from({length:12},(_,i)=>{const a=(i+1)*Math.PI/24;return [mirrorX(cx+r*Math.sin(a)),cz-r*Math.cos(a)];}),
 [mirrorX(s.x1-r),s.z1+.36],
 [mirrorX(s.holeX0)+.4,s.z1+.36]
];
export const stairRoute=[routeCorners[0],...routeCorners.slice(1).flatMap(([x,z],i)=>{
 const [px,pz]=routeCorners[i],count=Math.ceil(Math.hypot(x-px,z-pz)/.08);
 return Array.from({length:count},(_,j)=>[px+(x-px)*(j+1)/count,pz+(z-pz)*(j+1)/count]);
})];

export function routeToFloor(state,targetFloor) {
 if(state.feet>.1&&state.feet<LEVEL-.01){
  let nearest=0,distance=Infinity;
  stairRoute.forEach(([x,z],i)=>{const d=Math.hypot(x-state.x,z-state.z);if(d<distance){distance=d;nearest=i;}});
  // Include the nearest point so resuming after a pause stays on the treads.
  return targetFloor===2?stairRoute.slice(nearest):stairRoute.slice(0,nearest+1).reverse();
 }
 if(targetFloor===2)return [[stairRoute[0][0],state.z],...stairRoute];
 const last=stairRoute.at(-1);
 return [[state.x,last[1]],...stairRoute.toReversed()];
}

export function followStairRoute(state,route,distance,blocked) {
 let next=state,remaining=distance;
 while(route.length&&remaining>0){
  const [x,z]=route[0],length=Math.hypot(x-next.x,z-next.z);
  if(length<.01){route.shift();continue;}
  const travel=Math.min(length,remaining),before=next;
  next=moveWalker(next,(x-next.x)/length*travel,(z-next.z)/length*travel,blocked);
  if(Math.hypot(next.x-before.x,next.z-before.z)<travel*.5)return {state:next,blocked:true};
  remaining-=travel;
 }
 return {state:next,blocked:false};
}
