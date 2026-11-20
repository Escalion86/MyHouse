import {planRooms, LEVEL, finishedCeilingHeight} from './layout.js';
import {intersection, rectangleArea, roomFloorPieces, stairOpening, isEnclosedRoom} from './roomGeometry.js';

const round=value=>Math.round(value*1e6)/1e6;
export function calculateRoomMetrics({rooms=planRooms, opening=stairOpening(), level=LEVEL, ceilingHeight=finishedCeilingHeight}={}) {
 const values=rooms.map(room=>{
  const footprint=rectangleArea(room.bounds);
  const area=roomFloorPieces(room,opening).reduce((sum,piece)=>sum+rectangleArea(piece.bounds),0);
  const enclosed=isEnclosedRoom(room), height=enclosed?ceilingHeight(room.id):null;
  // The lower stairwell belongs to floor 1 up to the upper floor level.
  // Floor 2 includes the air above its opening, but not a fictitious floor.
  const extra=enclosed&&room.floor===1?rectangleArea(intersection(room.bounds,opening))*Math.max(0,level-height):0;
  return {
   id:room.id,name:room.name,floor:room.floor,enclosed,
   areaM2:round(area),footprintAreaM2:round(footprint),
   stairOpeningAreaM2:round(footprint-area),ceilingHeightM:height,
   stairwellExtraVolumeM3:round(extra),volumeM3:enclosed?round(footprint*height+extra):null,
  };
 });
 const totals=list=>({
  enclosedAreaM2:round(list.filter(r=>r.enclosed).reduce((sum,r)=>sum+r.areaM2,0)),
  enclosedVolumeM3:round(list.reduce((sum,r)=>sum+(r.volumeM3??0),0)),
  outdoorAreaM2:round(list.filter(r=>!r.enclosed).reduce((sum,r)=>sum+r.areaM2,0)),
 });
 return {
  schemaVersion:1,source:'model-geometry',units:{area:'m2',volume:'m3',length:'m'},
  rooms:values,totals:totals(values),
  floors:[...new Set(values.map(r=>r.floor))].sort((a,b)=>a-b).map(floor=>({floor,...totals(values.filter(r=>r.floor===floor))})),
  method:{
   area:'Interior finished floor surfaces; upper corridor excludes the stair opening.',
   volume:'Interior footprint times finished ceiling height. Lower stairwell extends to the upper floor level; upper stairwell air belongs to floor 2. Furniture and stairs are not deducted.',
   outdoor:'Room room-6 is an open balcony; its area is separate and volume is null.',
   accuracy:'Derived from current model dimensions, including unverified dimensions. Saved measurement reviews do not change geometry automatically.',
  },
 };
}
