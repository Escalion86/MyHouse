import {STAIR} from './layout.js';

export const stairOpening = () => [STAIR.holeX0, STAIR.holeZ0, STAIR.x1, STAIR.z1];
export const rectangleArea = ([x0,z0,x1,z1]) => Math.max(0,x1-x0)*Math.max(0,z1-z0);
export function intersection(a,b) {
 return [Math.max(a[0],b[0]),Math.max(a[1],b[1]),Math.min(a[2],b[2]),Math.min(a[3],b[3])];
}

// Both the renderer and the room schedule use these finished floor surfaces.
// Preserve mesh names: saved surface measurements refer to them.
export function roomFloorPieces(room, opening=stairOpening()) {
 const [a,b,c,d]=room.bounds;
 if(room.id!=='room-8'||rectangleArea(intersection(room.bounds,opening))===0)
  return [{name:room.name,bounds:room.bounds}];
 const [l,n,r,f]=intersection(room.bounds,opening);
 return [
  {name:'Пол коридора',bounds:[a,b,l,d]},
  {name:'Пол у лестницы',bounds:[l,f,c,d]},
  {name:'Верхняя площадка',bounds:[r,b,c,f]},
  {name:'Пол у стены детской',bounds:[l,b,r,n]},
 ].filter(piece=>rectangleArea(piece.bounds)>1e-10);
}

export const isEnclosedRoom = room => room.id!=='room-6';
