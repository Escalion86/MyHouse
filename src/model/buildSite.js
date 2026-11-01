import * as T from 'three';
import {projectFacadeUV} from './facadeUV.js';

// The courtyard widths are provisional photo estimates; building positions use the house plan.
export const SITE = {pathWidth:1.18, lawnStart:4.3, streetZ:-4.7, fenceZ:-2.1};

export function buildSite(site,{box,cylinder,sphere,wall,win,door,mat,mats,annexX,annexWidth,houseEdge}) {
 const textures=[];
 function grain(kind){
  const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');
  let seed=514;const rnd=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
  g.fillStyle=kind==='grass'?'#66834b':'#666968';g.fillRect(0,0,256,256);
  for(let i=0;i<16000;i++){const v=Math.floor(rnd()*70);g.fillStyle=kind==='grass'?`rgba(${80+v},${102+v},${43+v/2},.35)`:`rgba(${70+v},${74+v},${73+v},.4)`;g.fillRect(rnd()*256,rnd()*256,1,kind==='grass'?3:1);}
  const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;textures.push(t);return t;
 }
 mats.siteGrass=mat('#ffffff',{map:grain('grass'),roughness:1});
 mats.siteAsphalt=mat('#ffffff',{map:grain('asphalt'),roughness:1});
 mats.siteTimber=mat('#665244',{map:mats.terraceWood.map});
 mats.siteLogs=mat('#8a7966',{map:mats.terraceWood.map});
 mats.siteSteel=mat('#303b40',{metalness:.4,roughness:.65});
 mats.siteConcrete=mat('#8b8a7e',{roughness:1});
 mats.siteBrick=mat('#b87c61',{map:mats.brick.map,roughness:1});
 mats.siteLeaves=mat('#527440',{roughness:1});
 mats.siteRoof=mat('#858e88',{metalness:.35,roughness:.7,side:T.DoubleSide});
 function surface(name,x0,x1,z0,z1,y,material){
  const mesh=box(site,name,(x0+x1)/2,y,(z0+z1)/2,x1-x0,.04,z1-z0,material);mesh.castShadow=false;
  projectFacadeUV(mesh,1,1);return mesh;
 }
 function beam(parent,name,a,b,r,material=mats.siteTimber){
  const v=new T.Vector3(...b).sub(new T.Vector3(...a));
  const o=box(parent,name,(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2,r,v.length(),r,material);
  o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return o;
 }
 surface('Зелёный участок',-2.4,annexX+annexWidth+.6,-2.15,19,-.23,mats.siteGrass);
 surface('Асфальтированная дорога',-9,25,-8,-4,-.20,mats.siteAsphalt);
 surface('Асфальт перед воротами',-2.4,annexX+annexWidth+.6,-4,-2.1,-.19,mats.siteAsphalt);
 surface('Асфальтовая площадка между домом и гаражом',houseEdge,annexX,-2.1,SITE.lawnStart,-.18,mats.siteAsphalt);
 surface('Асфальтовая дорожка вдоль дома',houseEdge,houseEdge+SITE.pathWidth,SITE.lawnStart,14,-.18,mats.siteAsphalt);
 surface('Дорожка позади дома',-.7,annexX+annexWidth,13,14.15,-.18,mats.siteAsphalt);
 surface('Боковая дорожка к сараю',-1.45,-.24,3,13,-.18,mats.siteAsphalt);
 const lawnX=houseEdge+SITE.pathWidth+.08;
 surface('Приподнятая лужайка',lawnX,annexX-.08,SITE.lawnStart,12.95,-.075,mats.siteGrass);
 box(site,'Бордюр вдоль лужайки',lawnX-.035,-.10,8.63,.07,.22,8.66,mats.siteConcrete);
 box(site,'Бордюр у площадки',(lawnX+annexX)/2,-.10,SITE.lawnStart,annexX-lawnX,.22,.08,mats.siteConcrete);
 // Corrugation and supporting timbers are geometry, visible from below too.
 function roof(parent,z0,z1,h){
  const x0=annexX-.38,x1=annexX+annexWidth+.38,mid=(x0+x1)/2,rise=.67;
  for(const [a,b,ya,yb] of [[x0,mid,h,h+rise],[mid,x1,h+rise,h]]){
   const count=Math.ceil((z1-z0)/.035),p=[],idx=[];
   for(let i=0;i<=count;i++){const z=z0+(z1-z0)*i/count,w=.018*Math.cos((z-z0)*Math.PI*2/.18);p.push(a,ya+w,z,b,yb+w,z);if(i<count){const k=i*2;idx.push(k,k+2,k+1,k+1,k+2,k+3);}}
   const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(p,3));geo.setIndex(idx);geo.computeVertexNormals();
   const m=new T.Mesh(geo,mats.siteRoof);m.name='Волнистая кровля пристройки';m.castShadow=m.receiveShadow=true;parent.add(m);
   for(let z=z0+.12;z<z1;z+=.62)beam(parent,'Деревянная стропила',[a,ya-.055,z],[b,yb-.055,z],.09);
  }
  for(const x of [annexX+.1,annexX+annexWidth-.1])for(let z=z0+.5;z<z1;z+=1.5)box(parent,'Опора крыши',x,h-.22,z,.1,.55,.1,mats.siteTimber);
 }
 const garage=new T.Group();garage.name='Гараж';site.add(garage);
 const gh=2.65,gz=-.2,ge=5.8;
 wall(garage,'z',gz,ge,annexX+.1,0,gh,.2,[win(.5,.73),win(2.05,.73),door(4.2,.85,{id:'garage',label:'Гараж',swing:1,dark:true,floor:0})],mats.siteBrick);
 for(const z of [gz+.1,ge-.1])box(garage,'Торец гаража',annexX+annexWidth/2,gh/2,z,annexWidth,gh,.2,mats.siteBrick,true);
 box(garage,'Задняя стена гаража',annexX+annexWidth-.1,gh/2,2.8,.2,gh,6,mats.siteBrick,true);
 box(garage,'Пол гаража',annexX+annexWidth/2,-.05,2.8,annexWidth,.1,6,mats.siteConcrete);
 garage.traverse(o=>{if(o.isMesh&&(o.material===mats.siteBrick||Array.isArray(o.material)&&o.material.includes(mats.siteBrick)))projectFacadeUV(o,1.2,.96);});
 for(const [z,len,h] of [[.1,.55,1.6],[1.7,.4,1.1],[3.5,.65,1.7],[5.5,.55,.9]])box(garage,'Участок бетонной кладки',annexX-.008,h/2,z,.025,h,len,mats.siteConcrete);
 roof(garage,-.55,6.0,3.05);
 const bath=new T.Group();bath.name='Баня';site.add(bath);
 const bz=5.8,be=10.6,bh=2.5,front=be-.1;
 const sideWindow={at:7.65,width:.83,bottom:.85,top:2.05};
 wall(bath,'z',bz,be,annexX+.1,0,bh,.2,[sideWindow],mats.siteLogs);
 const openings=[{at:annexX+.48,width:.84,bottom:0,top:2.13,leaf:{id:'sauna',label:'Баня',swing:1,floor:0,style:'pvc-glazed'}},{at:annexX+1.5,width:.85,bottom:.7,top:2.08},{at:annexX+2.95,width:.65,bottom:.85,top:1.75}];
 wall(bath,'x',annexX,annexX+annexWidth,front,0,bh,.2,openings,mats.siteLogs);
 box(bath,'Задняя стена бани',annexX+annexWidth-.1,bh/2,8.2,.2,bh,4.8,mats.siteLogs,true);
 box(bath,'Перегородка бани',annexX+annexWidth/2,bh/2,bz+.1,annexWidth,bh,.2,mats.siteBrick,true);
 box(bath,'Пол бани',annexX+annexWidth/2,-.05,8.2,annexWidth,.1,4.8,mats.floor);
 // Rounded log faces stop at the actual openings.
 function logs(axis,a,b,fixed,cuts){for(let y=.1;y<bh;y+=.21){let ranges=[[a,b]];for(const cut of cuts)if(y+.1>cut.bottom&&y-.1<cut.top)ranges=ranges.flatMap(([lo,hi])=>[[lo,Math.min(hi,cut.at)],[Math.max(lo,cut.at+cut.width),hi]].filter(([l,r])=>r-l>.01));for(const [lo,hi] of ranges){const o=cylinder(bath,axis==='x'?(lo+hi)/2:fixed,y,axis==='x'?fixed:(lo+hi)/2,.115,.115,hi-lo,mats.siteLogs,12);o.name='Бревно сруба';o.rotation[axis==='x'?'z':'x']=Math.PI/2;}}}
 logs('z',bz,be,annexX+.035,[sideWindow]);logs('x',annexX,annexX+annexWidth,be-.035,openings);
 roof(bath,5.6,11.02,2.95);
 cylinder(bath,annexX+2.9,3.6,7.1,.095,.095,1.7,mats.metal);
 cylinder(bath,annexX+2.9,4.47,7.1,0,.19,.16,mats.metal);
 beam(bath,'Желоб бани',[annexX-.36,2.94,5.6],[annexX-.36,2.94,11.02],.09,mats.metal);
 // IBC rainwater tank beside the log wall.
 const tx=annexX-.66,tz=9.35;
 box(site,'Подставка еврокуба',tx,.02,tz,1.15,.35,1.14,mats.siteSteel,true);
 box(site,'Еврокуб для воды',tx,.70,tz,1.02,1.03,1.04,mats.white,true);
 for(let i=0;i<=5;i++){const off=-.55+i*.22;for(const x of [tx-.56,tx+.56])beam(site,'Решётка еврокуба',[x,.18,tz+off],[x,1.25,tz+off],.018,mats.metal);for(const z of [tz-.56,tz+.56])beam(site,'Решётка еврокуба',[tx+off,.18,z],[tx+off,1.25,z],.018,mats.metal);}
 for(const y of [.22,.55,.9,1.24]){for(const x of [tx-.56,tx+.56])beam(site,'Обвязка еврокуба',[x,y,tz-.56],[x,y,tz+.56],.025,mats.metal);for(const z of [tz-.56,tz+.56])beam(site,'Обвязка еврокуба',[tx-.56,y,z],[tx+.56,y,z],.025,mats.metal);}
 cylinder(site,tx,1.24,tz,.08,.08,.05,mats.siteSteel);
 beam(site,'Водосток к еврокубу',[annexX-.36,2.92,10.9],[tx,1.3,tz],.085,mats.metal);
 // Street pickets and closed timber boundary on the narrow side.
 function fence(axis,a,b,fixed,tall=false){
  const h=tall?1.8:1.15,spacing=tall?.155:.17;
  for(let t=a;t<b;t+=spacing){const x=axis==='x'?t:fixed,z=axis==='x'?fixed:t;box(site,'Деревянный штакетник',x,h/2-.18,z,axis==='x'?.11:.045,h,axis==='x'?.045:.11,mats.siteTimber);}
  for(const y of [.15,h-.38])box(site,'Поперечина забора',axis==='x'?(a+b)/2:fixed,y,axis==='x'?fixed:(a+b)/2,axis==='x'?b-a:.07,.07,axis==='x'?.07:b-a,mats.siteTimber);
  box(site,'Граница ограждения',axis==='x'?(a+b)/2:fixed,.5,axis==='x'?fixed:(a+b)/2,axis==='x'?b-a:.06,1.4,axis==='x'?.06:b-a,mats.siteTimber,true).visible=false;
 }
 fence('x',-1.9,houseEdge,-2.1);fence('z',-2.1,18.5,-1.9,true);
 // Paired steel vehicle gates and a separate pedestrian gate.
 const gate0=houseEdge+.64,gate1=annexX,gw=(gate1-gate0-1.0)/2;
 for(const x of [gate0,gate0+1,gate1])box(site,'Стойка ворот',x,1.05,-2.1,.10,2.5,.12,mats.siteSteel,true);
 for(const [x,w,h] of [[gate0+.5,.9,1.85],[gate0+1+gw/2,gw-.04,2.25],[gate1-gw/2,gw-.04,2.25]]){
  box(site,'Створка металлических ворот',x,h/2-.15,-2.1,w,h,.055,mats.siteSteel,true);
  for(const y of [-.1,.85,h-.19])box(site,'Рама ворот',x,y,-2.055,w,.045,.045,mats.metal);
  for(const dx of [-w/2,w/2])box(site,'Рама ворот',x+dx,h/2-.15,-2.055,.045,h,.045,mats.metal);
  if(h>2)beam(site,'Диагональ ворот',[x-w/2,-.08,-2.04],[x+w/2,.84,-2.04],.045,mats.metal);
 }
 fence('x',houseEdge,gate0,-2.1,true);
 // Summer vegetation and small path lamps, without temporary stored materials.
 for(const [x,z,r] of [[2,-1.2,.65],[1.3,15.2,.8],[8.6,15.6,.7],[3.8,17,.9]]){cylinder(site,x,.40,z,.045,.065,1.15,mats.siteTimber);sphere(site,x,1.25,z,r,r*.9,r,mats.siteLeaves);}
 for(let i=0;i<8;i++)sphere(site,3.2+(i%4)*.55,.65+Math.floor(i/4),12.5,.55,.72,.20,mats.siteLeaves);
 for(const z of [5.2,8.2,11.6]){const x=lawnX+.12;cylinder(site,x,.12,z,.018,.025,.5,mats.siteSteel);cylinder(site,x,.38,z,.085,.05,.12,mats.white,6);cylinder(site,x,.47,z,0,.12,.09,mats.siteSteel,6);}
 site.userData.measurements='Ширина дорожек и границы лужайки приблизительные, по фотографиям';
 return ()=>textures.forEach(t=>t.dispose());
}
