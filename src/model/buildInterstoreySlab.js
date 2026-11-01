import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Subtract an axis-aligned opening without overlapping the resulting strips.
export function subtract(rect,cut){
 const [a,b,c,d]=rect,[x,z,xx,zz]=cut;
 const l=Math.max(a,x),r=Math.min(c,xx),n=Math.max(b,z),f=Math.min(d,zz);
 if(r-l<1e-8||f-n<1e-8)return [rect];
 return [[a,b,l,d],[r,b,c,d],[l,b,r,n],[l,f,r,d]].filter(([x,z,xx,zz])=>xx-x>1e-8&&zz-z>1e-8);
}
const without=(rects,cuts)=>cuts.reduce((pieces,cut)=>pieces.flatMap(rect=>subtract(rect,cut)),rects);

export function buildInterstoreySlab(parent,{footprints,floors,opening,bottom,top,material}){
 // Union the actual floor/wall footprints with the lower facade. No change to
 // room dimensions or floor registration is needed to close the building shell.
 let outline=[];
 for(const rect of footprints)outline.push(...without([rect],outline));
 outline=without(outline,[opening]);
 const parts=[];
 const layer=(rects,lo,hi)=>{
  if(hi-lo<1e-8)return;
  for(const [x,z,xx,zz]of rects){
   const geometry=new T.BoxGeometry(xx-x,hi-lo,zz-z);
   geometry.translate((x+xx)/2,(lo+hi)/2,(z+zz)/2);parts.push(geometry);
  }
 };
 // Existing room floors provide the upper 20 cm. Fill around, not over them,
 // so their floor textures remain visible and the stairwell remains open.
 layer(outline,bottom,top-.2);
 layer(without(outline,floors),top-.2,top);
 const geometry=mergeGeometries(parts);parts.forEach(p=>p.dispose());
 const slab=new T.Mesh(geometry,material);slab.name='Межэтажное перекрытие';
 slab.castShadow=slab.receiveShadow=true;parent.add(slab);
 return slab;
}
