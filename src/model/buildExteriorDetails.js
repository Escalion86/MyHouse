import * as T from 'three';
import {W,D,LEVEL,LIVING,CHILD,BATHROOM,EXTERIOR_THICKNESS as EXT,exteriorMeasurements as em} from './layout.js';

// Corrugations run down the slope: the exposed outer edge has a real wavy
// silhouette rather than a flat plane with stripes painted onto it.
function corrugated(parent,name,x0,x1,z0,z1,y0,y1,material) {
 const count=Math.ceil((x1-x0)/.018),positions=[],uv=[],indices=[];
 for(let i=0;i<=count;i++){
  const x=x0+(x1-x0)*i/count,wave=.012*Math.cos((x-x0)*Math.PI*2/.14);
  positions.push(x,y0+wave,z0,x,y1+wave,z1);uv.push(i/count,0,i/count,1);
  if(i<count){const k=i*2;indices.push(k,k+1,k+2,k+1,k+3,k+2);}
 }
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));
 geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();
 const mesh=new T.Mesh(geo,material);mesh.name=name;mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);return mesh;
}

export function buildExteriorDetails(exterior,site,{box,mat,mats}) {
 const g=new T.Group();g.name='Межэтажный карниз по обмерам';exterior.add(g);
 const wall={x0:LIVING.x0-EXT,x1:W+EXT,z0:LIVING.z0-EXT,z1:D+EXT};
 const projection=em.soffitFromGroundWall,lip=em.metalBeyondSoffit;
 const edge={x0:wall.x0-projection.rear,x1:wall.x1+projection.front,z0:wall.z0-projection.living,z1:wall.z1+projection.office};
 const metalX0=edge.x0-lip,metalX1=edge.x1+lip;
 mats.apronMetal=mat('#9aa7a4',{metalness:.65,roughness:.52,side:T.DoubleSide});
 mats.fascia=mat('#987553',{map:mats.terraceWood.map,roughness:.92});
 mats.shedWood=mat('#a49a85',{map:mats.terraceWood.map,roughness:1});
 // Solid, closed edge of the floor with OSB underside and timber fascia.
 // The bottom overhang and the sheet edge are measured from different walls.
 const strip=(name,x0,x1,z0,z1)=>{
  box(g,'Основание карниза · '+name,(x0+x1)/2,3.105,(z0+z1)/2,x1-x0,.25,z1-z0,mats.fascia);
  box(g,'Нижняя обшивка карниза · '+name,(x0+x1)/2,2.975,(z0+z1)/2,x1-x0,.018,z1-z0,mats.osb);
 };
 strip('гостиная',edge.x0,edge.x1,edge.z0,wall.z0);
 strip('задняя сторона',edge.x0,wall.x0,wall.z0,wall.z1);
 strip('входная сторона',wall.x1,edge.x1,wall.z0,wall.z1);
 box(g,'Лобовая доска карниза детской',(edge.x0+edge.x1)/2,3.105,edge.z0+.016,edge.x1-edge.x0,.25,.032,mats.fascia);
 const upperWallZ=CHILD.bounds[1]-em.upperWallThicknessAssumed;
 const sheet=corrugated(g,'Рифлёный карниз детской',metalX0,metalX1,upperWallZ,edge.z0-lip,LEVEL+.085,LEVEL+.02,mats.apronMetal);
 sheet.userData.wallToEdge=em.childApronFromUpperWall;
 sheet.userData.metalBeyondSoffit=lip;
 // Low flashing seals the junction to the upper facade.
 box(g,'Примыкание карниза к стене детской',(metalX0+metalX1)/2,LEVEL+.10,upperWallZ-.007,metalX1-metalX0,.09,.014,mats.apronMetal);
 // The recessed balcony ends at its parapet: no apron across the rear facade.
 // Keep the roof extents independent of this missing rear apron.
 const drainage=new T.Group();drainage.name='Водосток со стороны гаража';exterior.add(drainage);
 const zinc=mat('#b4bdc1',{metalness:.72,roughness:.35,side:T.DoubleSide});
 const gutterX=metalX1+.025,gutterY=LEVEL+.015,zStart=edge.z0-lip,zEnd=wall.z1;
 const vertices=[],indices=[];
 for(let i=0;i<=20;i++){
  const angle=Math.PI*i/20,x=gutterX+.075*Math.cos(angle),y=gutterY-.075*Math.sin(angle);
  vertices.push(x,y,zStart,x,y,zEnd);
  if(i<20){const k=i*2;indices.push(k,k+1,k+2,k+1,k+3,k+2);}
 }
 const gutterGeo=new T.BufferGeometry();gutterGeo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));gutterGeo.setIndex(indices);gutterGeo.computeVertexNormals();
 const gutter=new T.Mesh(gutterGeo,zinc);gutter.name='Желоб вдоль гаражного фасада';drainage.add(gutter);
 // Only the horizontal gutter is installed; there is no downpipe yet.

 // Small timber shed directly to the left when facing the living-room gable.
 // Its unmeasured footprint is estimated from the owner's exterior photos.
 const shed=new T.Group();shed.name='Сарай вплотную к дому';site.add(shed);
 const sx1=wall.x0,sx0=sx1-1.55,sz0=wall.z0,sz1=BATHROOM.window.at-.60,h=2.16;
 shed.userData.estimatedDimensions=[1.55,sz1-sz0,h];
 box(shed,'Пол сарая',(sx0+sx1)/2,-.08,(sz0+sz1)/2,sx1-sx0,.12,sz1-sz0,mats.shedWood);
 for(const x of [sx0+.04,sx1-.04])box(shed,'Стойка сарая',x,h/2,sz0+.05,.08,h,.10,mats.fascia,true);
 const doorX=sx0+.16,doorWidth=.72;
 // Solid wall behind the plank seams prevents pinholes through the facade.
 box(shed,'Боковая стена сарая',sx0+.025,h/2,(sz0+sz1)/2,.05,h,sz1-sz0,mats.shedWood,true);
 // Courtyard entrance: grey vertical door beside the warm horizontal siding.
 const rearDoorX=sx0+.12,rearDoorWidth=.80,rearDoorHeight=1.96;
 box(shed,'Левый простенок дворового входа',sx0+.06,h/2,sz1-.025,.12,h,.05,mats.fascia,true);
 box(shed,'Обшивка рядом с дворовой дверью',(rearDoorX+rearDoorWidth+sx1)/2,h/2,sz1-.025,sx1-rearDoorX-rearDoorWidth,h,.05,mats.fascia,true);
 box(shed,'Перемычка дворовой двери',rearDoorX+rearDoorWidth/2,(h+rearDoorHeight)/2,sz1-.025,rearDoorWidth,h-rearDoorHeight,.05,mats.fascia,true);
 box(shed,'Дверь сарая со двора',rearDoorX+rearDoorWidth/2,rearDoorHeight/2,sz1,rearDoorWidth,rearDoorHeight,.045,mats.shedWood,true);
 for(let i=0;i<6;i++)box(shed,'Вертикальная доска дворовой двери',rearDoorX+(i+.5)*rearDoorWidth/6,rearDoorHeight/2,sz1+.028,rearDoorWidth/6-.006,rearDoorHeight,.018,mats.shedWood);
 for(let i=0;i<14;i++)box(shed,'Дворовая горизонтальная обшивка',(rearDoorX+rearDoorWidth+sx1)/2,(i+.5)*h/14,sz1+.014,sx1-rearDoorX-rearDoorWidth,h/14-.006,.025,mats.fascia);
 box(shed,'Чёрная ручка дворовой двери',rearDoorX+rearDoorWidth-.08,.94,sz1+.061,.11,.025,.035,mats.dark);
 box(shed,'Правая часть фасада сарая',(doorX+doorWidth+sx1)/2,h/2,sz0+.04,sx1-doorX-doorWidth,h,.08,mats.shedWood,true);
 for(let i=0;i<14;i++)box(shed,'Горизонтальная доска сарая',(doorX+doorWidth+sx1)/2,(i+.5)*h/14,sz0-.008,sx1-doorX-doorWidth,h/14-.006,.035,mats.shedWood);
 box(shed,'Дверь сарая',doorX+doorWidth/2,.91,sz0-.018,doorWidth,1.82,.045,mats.shedWood,true);
 for(let i=0;i<5;i++)box(shed,'Вертикальная доска двери сарая',doorX+(i+.5)*doorWidth/5,.91,sz0-.045,doorWidth/5-.005,1.82,.015,mats.shedWood);
 for(const y of [.25,1.36])box(shed,'Поперечина двери сарая',doorX+doorWidth/2,y,sz0-.065,doorWidth+.06,.065,.035,mats.fascia);
 box(shed,'Ручка двери сарая',doorX+doorWidth-.09,.86,sz0-.095,.10,.022,.035,mats.metal);
 box(shed,'Тёмный проём над дверью сарая',doorX+doorWidth/2,1.98,sz0+.07,doorWidth,.27,.012,mats.dark);
 box(shed,'Верхняя балка сарая',(sx0+sx1)/2,h+.04,sz0+.02,sx1-sx0+.10,.13,.12,mats.fascia);
 corrugated(shed,'Рифлёная крыша сарая',sx0-.15,sx1,sz0-.17,sz1+.10,h+.14,h+.27,mats.apronMetal);

 return {metalX0,metalX1,metalFront:edge.z0-lip,metalBack:edge.z1+lip};
}
