import source from '../../house-data.json' with {type:'json'};
export const W = 7.16, D = 12.11, LEVEL = 3.23, GAP = 4.55;
export const wallNames=source.wallNames;
export const hallMeasurements=source.hallMeasurements;
const hm=hallMeasurements;
const hallDepth=hm.officeSide.frontCornerToOpening+hm.officeSide.openingWidth+hm.officeSide.openingToRearCorner;
const hallWidth=hm.front.leftCornerToOpening+hm.front.openingWidth+hm.front.openingToRightCorner;
// Keep the office partition fixed; fit measured hall inward from the front facade.
const hallFrontX=W,hallRearX=W-hallDepth,hallRightZ=7.84,hallLeftZ=hallRightZ-hallWidth;
export const HALL = {
 bounds:[hallRearX,hallLeftZ,hallFrontX,hallRightZ],
 entrance:{at:hallLeftZ+hm.front.leftCornerToOpening,width:hm.front.openingWidth,height:hm.front.openingHeight},
 officeOpening:{at:hallRearX+hm.officeSide.openingToRearCorner,width:hm.officeSide.openingWidth,height:hm.officeSide.openingHeight},
 livingOpening:{at:hallRearX+hm.livingSide.rearCornerToOpening,width:hm.livingSide.openingWidth,height:hm.livingSide.openingHeight},
 // Anchor the wardrobe in its corner; retain the 25 cm gap and 70 cm bath opening.
 // The unresolved 3 cm closure lands on the living-side end (67 vs measured 64 cm).
 bathroom:{at:hallRightZ-hm.rear.wardrobeWidth-hm.rear.wardrobeToBathDoor-hm.rear.bathDoorWidth,width:hm.rear.bathDoorWidth},
 wardrobe:{backX:hallRearX,centerZ:hallRightZ-hm.rear.wardrobeWidth/2,width:hm.rear.wardrobeWidth,depth:hm.rear.wardrobeDepth,height:2.60},
 bench:{centerX:6.40,backZ:hallRightZ-.03,width:1.04,depth:.38},
 shoeCabinet:{centerX:5.25,centerZ:hallRightZ-.21}
};
export const livingMeasurements=source.livingMeasurements;
const lm=livingMeasurements;
export const EXTERIOR_THICKNESS=lm.groundFloorExteriorWallThickness;
export const LIVING={
 x0:W-lm.leftWallFromTvCorner.reduce((s,v)=>s+v,0),x1:W,
 z0:hallLeftZ-.15-lm.frontWallFromTvCorner.reduce((s,v)=>s+v,0),z1:hallLeftZ-.15,
 windowWidth:lm.windowWidth,windowBottom:lm.windowBottom,sashWidths:lm.sashWidths,
};
LIVING.leftWindows=[W-.86-1.8,W-.86-1.8-1.33-1.8];
LIVING.frontWindow=LIVING.z0+.81;
const bm=source.bathroomMeasurements.windowWallLeftToRight;
export const BATHROOM={
 bounds:[LIVING.x0,hallLeftZ,hallRearX-.10,hallLeftZ+bm.reduce((sum,v)=>sum+v,0)],
 // Left-to-right looking at the rear facade from inside; bath corner anchors Z.
 window:{at:hallLeftZ+bm[0],width:bm[1],bottom:.90,top:2.10}
};
// Register both storeys by exterior faces, not by the original traced plan.
export const exteriorMeasurements=source.exteriorMeasurements;
const em=exteriorMeasurements;
export const UPPER_LIVING_SETBACK=em.childApronFromUpperWall-em.metalBeyondSoffit-em.soffitFromGroundWall.living;
const measuredChildOuterZ=LIVING.z0-EXTERIOR_THICKNESS+UPPER_LIVING_SETBACK;
export const UPPER_Z_SHIFT=measuredChildOuterZ+em.upperWallThicknessAssumed+source.childMeasurements.sideWall+.15-4.35;
export const upperHallMeasurements=source.upperHallMeasurements;
const uh=upperHallMeasurements.clockwiseFromWindowWallLeftCorner;
const upperFrontX=7.35,upperChildZ=4.35+UPPER_Z_SHIFT;
const upperRearX=upperFrontX-uh.childWall.reduce((s,v)=>s+v,0);
const upperBedroomZ=upperChildZ+uh.windowWall.reduce((s,v)=>s+v,0);
export const UPPER_HALL_PLAN={
 bounds:[upperRearX,upperChildZ,upperFrontX,upperBedroomZ],
 window:{at:upperBedroomZ-uh.windowWall[0]-uh.windowWall[1],width:uh.windowWall[1]},
 child:{at:upperFrontX-uh.childWall[0]-uh.childWall[1],width:uh.childWall[1]},
 bathroom:{at:upperChildZ+uh.bathroomWall[0],width:uh.bathroomWall[1]},
 bedroom:{at:upperRearX+uh.bedroomWall[0],width:uh.bedroomWall[1]}
};
// Coherent draft footprints. All ranges are inside faces; source dimensions remain in house-data.json.
export const showerMeasurements=source.showerMeasurements;
export const SHOWER={
 bounds:[upperRearX-.15-showerMeasurements.sideWall,upperChildZ,upperRearX-.15,upperBedroomZ],
 window:{at:upperChildZ+showerMeasurements.windowWallLeftToRight[0],width:showerMeasurements.windowWallLeftToRight[1],bottom:.85,top:2.35},
 door:{...UPPER_HALL_PLAN.bathroom,frameWidth:showerMeasurements.doorFrameOuterWidth}
};
export const childMeasurements=source.childMeasurements;
const cm=childMeasurements;
// Keep room sizes and the stair-opening offsets; the entire upper plan follows
// the measured facade registration. The lower stair entrance remains fixed.
export const CLOSET={bounds:[upperFrontX-cm.closetSize[0],upperChildZ-.15-cm.closetSize[1],upperFrontX,upperChildZ-.15]};
const childX1=UPPER_HALL_PLAN.child.at+UPPER_HALL_PLAN.child.width+cm.entranceWallReturns[0],childZ1=upperChildZ-.15;
const childX0=UPPER_HALL_PLAN.child.at-cm.entranceWallReturns[1],childZ0=childZ1-cm.sideWall;
export const CHILD={
 bounds:[childX0,childZ0,childX1,childZ1],
 window:{at:childX0+cm.windowWallFromClosetCorner[2],width:cm.windowWallFromClosetCorner[1],bottom:.9,top:2.4,sections:cm.windowSections,operable:cm.operableSections},
 closetOpening:{at:childZ0+cm.closetWallFromEntranceCorner[2],width:cm.closetWallFromEntranceCorner[1]},
 // Fit the unmeasured partition thickness between the measured inside faces.
 closetPartition:{center:(childX1+CLOSET.bounds[0])/2,thickness:CLOSET.bounds[0]-childX1},
 door:UPPER_HALL_PLAN.child
};
const bounds = {
  'room-1':[LIVING.x0,7.99,2.51,12.11], 'room-2':[2.61,7.99,7.16,12.11],
  'room-3':HALL.bounds, 'room-4':BATHROOM.bounds, 'room-5':[LIVING.x0,LIVING.z0,W,LIVING.z1],
  'room-6':[-.18,12.11+UPPER_Z_SHIFT,7.35,13.46+UPPER_Z_SHIFT], 'room-7':[-.18,upperBedroomZ+.15,7.35,11.96+UPPER_Z_SHIFT],
  'room-8':UPPER_HALL_PLAN.bounds, 'room-9':SHOWER.bounds,
  'room-10':CHILD.bounds, 'room-11':CLOSET.bounds
};
// Plans were initially traced with reversed handedness. Mirror the whole site on X,
// keeping source coordinates explicit and world coordinates consistent for navigation.
export const mirrorX = x=>W-x;
export const worldPoint = ([x,y,z])=>[mirrorX(x),y,z];
export const planRooms = source.rooms.map(r=>({...r, bounds:bounds[r.id], y:r.floor===1?0:LEVEL}));
export const rooms = planRooms.map(r=>({...r,bounds:[mirrorX(r.bounds[2]),r.bounds[1],mirrorX(r.bounds[0]),r.bounds[3]]}));
export const devices = source.rooms.flatMap(r=>r.devices.map(d=>({...d,roomId:r.id})));
export const roomById = Object.fromEntries(rooms.map(r=>[r.id,r]));
export const centerOf = r=>[(r.bounds[0]+r.bounds[2])/2,r.y,(r.bounds[1]+r.bounds[3])/2];
export const devicePositions = Object.fromEntries(Object.entries({
 'office-router':[2.75,2.13,10.13], 'office-speaker':[2.75,2.045,10.42], 'office-server':[2.656,1.69,10.29],
 'office-3d-printer':[2.895,.75,10.195], 'office-paper-printer':[2.90,.985,10.87],
 'office-desk-wled':[3.23,.785,10.87]
}).map(([id,p])=>[id,worldPoint(p)]));
export const entrance = {position:worldPoint([W+EXTERIOR_THICKNESS/2,0,HALL.entrance.at+HALL.entrance.width/2]),forward:[1,0,0]};
export const officeDoor = {position:worldPoint([HALL.officeOpening.at+HALL.officeOpening.width/2,0,hallRightZ+.075]),forward:[0,0,1]};
export const boilerDoor = worldPoint([2.56,0,8.55]);
export const assumptions = [
 'Фасады: стена детской утоплена на 19 см относительно наружной стены гостиной (66 − 4 − 43 см). Карниз из рифлёного металла выступает на 66 см от стены детской и на 4 см за нижнюю обшивку. Нижний уступ: гостиная 43 см, боковые стороны 38–39 см, противоположный торец 40 см. Уклон и высота торцевой доски — по фото. Толщина наружной стены второго этажа пока 30 см; глубина террасы 135 см и размеры примыкающего сарая приблизительные.',
 'Детская и гардеробная: мебель, текстиль и лампа в форме воздушного шара восстановлены по фотографиям. Детская 531 × 351 см, гардеробная 203 × 351 см, открытый проход 70 см с отступами 42 и 239 см. Окно 245 см с секциями 63–119–63 см, средняя глухая, боковые открываются. Отступы окна 39 и 247 см. Стена входа: 108 см до двери, дверь 80 см, затем 343 см до угла. Толщина перегородки гардеробной согласована между обмеренными внутренними гранями и составляет 17 см; отдельно не измерена. Габариты мебели и высоты окна приблизительные. Потолок принят чистовым белым по аналогии с остальными комнатами. В гардеробную ведёт открытый проход без двери. При взгляде от входа вглубь гардеробной комод, секции с коробами и одежда слева, гладильная доска и сушилка справа, чёрный стеллаж в торце. Узкое зеркало детской — на стене входной двери; телевизор на кронштейне, отступ от стены около 22 см принят по фото.',
 'Душевая второго этажа: 393 × 238 см, окно 118 см с отступами 183 и 92 см, дверь 70 см (80 см с коробом). Высота окна, кабина, сантехника и мебель пока по пропорциям фотографий. Размерная цепочка двери сохранена по полотну; короб шириной 80 см перекрывает края проёма.',
 'Котельная: оборудование, трубы, вешалка со щитками и стремянка восстановлены по фотографиям; размеры и трассы приблизительные. Окно слева, наружная дверь справа при взгляде изнутри. Сохранена установленная черновая отделка, убраны складируемые листы и мусор.',
 'Ванная первого этажа: стена с окном 345 см, цепочка слева направо 212–83–50 см. За исходный угол принят угол со стороны ванны; разница с прежними 370 см учтена со стороны унитаза. Высота окна, ширина комнаты и мебель пока приблизительные. Инсталляция в стене, потолок белый, верх машин свободен.',
 'Спальня: две кровати, угловой шкаф с зеркалом, тумбочки, ковры, фотообои и шторы — по фотографиям. Размеры и расстановка мебели, балконный блок и высоты пока приблизительные; потолок чистовой белый по пожеланию владельца. Рисунки текстиля и фотообоев переданы схематично.',
 'Коридор второго этажа: 488 × 393 см, окно 117 см, двери детской и спальни 80 см, ванной 70 см — по обмерам. В гардеробную вход из детской. Высота окна, ковёр и радиатор пока приблизительные.',
 'Кухня-гостиная по внутренним обмерам: 672 × 376 см. Наружные стены первого этажа — 67 см. Окна гостиной и кабинета шириной 180 см, низ на 60 см; верх пока принят на 240 см. Мебель кухни и гостиной — по пропорциям фотографий.',
 'Перекрытие принято 23 см: пол второго этажа на отметке 3,23 м.',
 'Комнаты размещены по схеме плана. Несогласованные размеры сведены в общий контур; площади в списке — из документа, а не обмер 3D-модели.',
 'Фронтальная стена — с входом; левая — со стороны гостиной и кухни; правая — со стороны кабинета и котельной; задняя — со стороны кухни, ванной и котельной.',
 'Коридор по обмерам: 462 × 370 см. Противоположная размерная цепочка даёт 367 см; расхождение 3 см временно оставлено у угла со стороны гостиной (67 вместо 64 см).',
 'Проёмы кабинета и гостиной 123 × 232 см; вход 98 × 200 см. Размер 70 см двери ванной пока трактуется как ширина проёма. Остальные двери высотой 210 см — приблизительные.',
 'Лестница: 15 деревянных ступеней и 16 подъёмов с выходом на пол второго этажа. Проём 150 × 263 см, от окна 32 см, от стены детской 6 см. Распределение 6 прямых + 3 забежных + 6 прямых, ширина марша 90 см и высота подъёма 20,19 см пока расчётные.',
 'Высоты излома и конька крыши, гараж и баня приблизительные. Расстояние между стенами дома и постройками — 4,55 м.',
 'Шкаф 80 × 48 × 202 см; полка принтера 62 × 45 × 45 см; большой стеллаж 169 × 169 см — по обмерам. Столешница 152 × 134 см — по CDR, высота 85 см, толщина 3 см. Высоты и глубины узкого стеллажа, клетки и её столика приблизительные.',
 'Мебель кабинета и коридора построена без временного беспорядка. Габариты шкафа коридора 208 × 60 см подтверждены; его высота, лавочка и вешалка пока приблизительные.',
 'В демонстрации меняется только свет модели. Состояние реального дома доступно после подключения Home Assistant.'
];
const opening=upperHallMeasurements.stairOpening;
export const STAIR = {
 x0:HALL.livingOpening.at+HALL.livingOpening.width+hm.livingSide.openingToStairStart,
 x1:upperFrontX-opening.windowWallGap,z0:hallLeftZ,
 z1:upperChildZ+opening.childWallGap+opening.length,width:.9,
 holeX0:upperFrontX-opening.windowWallGap-opening.width,holeZ0:upperChildZ+opening.childWallGap,
 lowerSteps:6,winderSteps:3,upperSteps:6,rises:upperHallMeasurements.riseCount
};
export const OFFICE={
 wallX:2.61,backZ:12.11,
 wardrobe:{width:.80,depth:.48,height:2.02,gap:.03,z0:9.17},
 printerShelf:{width:.62,depth:.45,height:.45,gap:.06,z0:9.97},
 largeShelf:{width:1.69,height:1.69,depth:.39,x0:5.47,columns:5,rows:5},
 cageTable:{width:.86,height:.56,depth:.48,x0:4.61},
 narrowShelf:{width:.34,height:1.35,depth:.39,x0:4.22},
 desk:{width:1.52,depth:1.34,height:.85,thickness:.03,legDiameter:.05,
  // CDR coordinates in metres, origin at top left; two 20mm outside corners.
  outline:[[0,0],[1.52,0],[1.52,1.34],[1.12,1.34],[1.10,1.32],[1.10,.94],[.67,.70],[.02,.70],[0,.68]],
  legs:[[.10,.60],[1.42,1.23]]}
};
export const deskPlanPoint=([u,v])=>[OFFICE.wallX+v,OFFICE.backZ-OFFICE.desk.width+u];
// Lower flight runs along the living-room wall (+X), upper along the entrance wall (+Z).
export function stairHeight(x,z) {
 x=mirrorX(x);
 const s=STAIR;
 const turnX=s.x1-s.width,turnZ=s.z0+s.width;
 const rise=LEVEL/s.rises;
 if(x>=s.x0&&x<turnX&&z>=s.z0&&z<=turnZ)return (Math.min(s.lowerSteps-1,Math.floor((x-s.x0)/(turnX-s.x0)*s.lowerSteps))+1)*rise;
 if(x>=turnX&&x<=s.x1&&z>=s.z0&&z<=turnZ){
  const angle=Math.atan2(x-turnX,turnZ-z);
  if(z<turnZ)return (s.lowerSteps+Math.min(s.winderSteps-1,Math.floor(s.winderSteps*angle/(Math.PI/2)))+1)*rise;
 }
 if(x>=turnX&&x<=s.x1&&z>=turnZ&&z<=s.z1){
  if(z>=s.z1-1e-8)return LEVEL;
  return (s.lowerSteps+s.winderSteps+Math.min(s.upperSteps-1,Math.floor(s.upperSteps*(z-turnZ)/(s.z1-turnZ)))+1)*rise;
 }
 return null;
}
export function roomAt(x,z,y) {return rooms.find(r=>Math.abs(y-r.y)<.4&&x>=r.bounds[0]&&x<=r.bounds[2]&&z>=r.bounds[1]&&z<=r.bounds[3]);}
// The entrance is below the upper flight: walking underneath must not snap upstairs.
export function walkStairHeight(x,z,feet) {
 const height=stairHeight(x,z);
 return feet<.1&&height!==null&&height>1.85?0:height;
}
