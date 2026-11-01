import * as T from 'three';
import {LEVEL,STAIR,UPPER_HALL_PLAN} from './layout.js';

export const UPPER_HALL={window:{...UPPER_HALL_PLAN.window,bottom:.85,top:2.35},rug:{x:4.10,z:6.30,width:1.65,length:2.15}};
export function upperHallMaterials(mat){
 const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;
 const ctx=canvas.getContext('2d');ctx.fillStyle='#99978f';ctx.fillRect(0,0,256,256);
 let seed=79;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 for(let i=0;i<7000;i++){ctx.fillStyle=random()>.5?'rgba(255,255,255,.065)':'rgba(35,30,24,.05)';ctx.fillRect(random()*256,random()*256,1,3);}
 const texture=new T.CanvasTexture(canvas);texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.repeat.set(4,3);texture.colorSpace=T.SRGBColorSpace;
 const wall=mat('#ffffff',{map:texture,roughness:.96});
 const woodCanvas=document.createElement('canvas');woodCanvas.width=128;woodCanvas.height=512;const woodCtx=woodCanvas.getContext('2d');
 woodCtx.fillStyle='#a96d3f';woodCtx.fillRect(0,0,128,512);
 for(let i=0;i<180;i++){const x=random()*128;woodCtx.strokeStyle=random()>.5?'rgba(70,32,12,.13)':'rgba(244,190,123,.16)';woodCtx.beginPath();woodCtx.moveTo(x,0);woodCtx.bezierCurveTo(x+random()*8,170,x-random()*8,340,x,512);woodCtx.stroke();}
 const woodTexture=new T.CanvasTexture(woodCanvas);woodTexture.colorSpace=T.SRGBColorSpace;
 const wood=mat('#ffffff',{map:woodTexture,roughness:.58}),darkWood=mat('#654137',{roughness:.62}),trim=mat('#b5b5ac',{metalness:.38,roughness:.5});
 return{wall,wood,darkWood,trim,dispose:()=>{texture.dispose();woodTexture.dispose();wall.dispose();wood.dispose();darkWood.dispose();trim.dispose();}};
}

export function buildUpperHall(parent,{box,cylinder,mats,finishes}){
 const y=LEVEL,{holeX0,x1,z1,holeZ0}=STAIR;
 const g=new T.Group();g.name='Отделка коридора второго этажа';parent.add(g);
 // Dark wood lining of the slab edge, capped with a thin metal angle.
 for(const x of [holeX0,x1]){
  box(g,'Тёмная обшивка лестничного проёма',x,y-.115,(holeZ0+z1)/2,.018,.23,z1-holeZ0,finishes.darkWood);
  box(g,'Металлическая кромка проёма',x,y+.003,(holeZ0+z1)/2,.032,.006,z1-holeZ0,finishes.trim);
 }
 for(const z of [holeZ0,z1]){
  box(g,'Торцевая обшивка проёма',(holeX0+x1)/2,y-.115,z,x1-holeX0,.23,.018,finishes.darkWood);
  box(g,'Торцевая кромка проёма',(holeX0+x1)/2,y+.003,z,x1-holeX0,.006,.032,finishes.trim);
 }
 const p=UPPER_HALL_PLAN,[rear,childSide,front,bedroomSide]=p.bounds;
 // Skirting follows the measured openings without crossing their thresholds.
 for(const [z,d] of [[childSide,p.child],[bedroomSide,p.bedroom]])for(const[a,b]of [[rear,d.at],[d.at+d.width,front]])box(g,'Плинтус второго этажа',(a+b)/2,y+.035,z,b-a,.07,.018,finishes.trim);
 for(const[a,b]of [[childSide,p.bathroom.at],[p.bathroom.at+p.bathroom.width,bedroomSide]])box(g,'Плинтус у душевой',rear,y+.035,(a+b)/2,.018,.07,b-a,finishes.trim);
 box(g,'Плинтус под окном',front-.01,y+.035,(childSide+bedroomSide)/2,.018,.07,bedroomSide-childSide,finishes.trim);
 const center=UPPER_HALL.window.at+UPPER_HALL.window.width/2;
 for(let i=0;i<8;i++){
  const z=center-.28+i*.08;
  box(g,'Радиатор второго этажа · секция',7.22,y+.45,z,.12,.52,.072,mats.white);
  for(const dy of [-.215,.215])cylinder(g,7.22,y+.45+dy,z,.032,.032,.05,mats.white).rotation.x=Math.PI/2;
 }
 for(const z of [center-.34,center+.34]){
  cylinder(g,7.27,y+.46,z,.012,.012,.57,mats.white);
  box(g,'Кран радиатора',7.24,y+.72,z,.06,.025,.03,mats.metal);
 }
 box(g,'Выключатель у окна второго этажа',7.334,y+.92,center+.70,.025,.08,.08,mats.white);
 box(g,'Розетка под окном второго этажа',7.334,y+.22,center+.70,.025,.08,.08,mats.white);
 const c=document.createElement('canvas');c.width=512;c.height=768;const ctx=c.getContext('2d');
 ctx.fillStyle='#aaa395';ctx.fillRect(0,0,512,768);
 // Interlaced ivory and taupe lines, approximating the rug in the photos.
 for(const direction of [-1,1])for(let offset=-900;offset<1000;offset+=115){
  ctx.strokeStyle=offset%230===0?'#e5dfd0':'#79756c';ctx.lineWidth=offset%230===0?5:3;ctx.beginPath();
  for(let yy=0;yy<=768;yy+=4){const xx=offset+direction*yy*.65+12*Math.sin(yy/37);if(yy===0)ctx.moveTo(xx,yy);else ctx.lineTo(xx,yy);}ctx.stroke();
 }
 ctx.strokeStyle='#c9c2b4';ctx.lineWidth=10;ctx.strokeRect(0,0,512,768);
 const rugTexture=new T.CanvasTexture(c);rugTexture.colorSpace=T.SRGBColorSpace;
 const rugMaterial=new T.MeshStandardMaterial({map:rugTexture,roughness:1});
 const rug=new T.Mesh(new T.PlaneGeometry(UPPER_HALL.rug.width,UPPER_HALL.rug.length),rugMaterial);rug.name='Серо-бежевый ковёр второго этажа';rug.rotation.x=-Math.PI/2;rug.position.set(UPPER_HALL.rug.x,y+.007,UPPER_HALL.rug.z);rug.receiveShadow=true;g.add(rug);
 return()=>{rugTexture.dispose();rugMaterial.dispose();};
}
