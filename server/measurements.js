import {measureSurfaceExtent} from '../src/model/measurementExtent.js';
const vector=v=>Array.isArray(v)&&v.length===3&&v.every(n=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<=1000);
const positive=n=>typeof n==='number'&&Number.isFinite(n)&&n>0&&n<=1000;
const label=s=>typeof s==='string'&&s.length<=200;
export const validMeasurementId=id=>typeof id==='string'&&/^[a-f0-9-]{36}$/.test(id);

// Persist observations only. Coordinates describe the model at the time of review.
export function measurementRecord(input,id){
 if(!input||!validMeasurementId(id)||![0,1,2].includes(input.floor)||!label(input.label)||!positive(input.distance)||!positive(input.actualDistance)||!vector(input.start)||!vector(input.end))return null;
 const surfaces=input.surfaces;
 const type=input.type??'distance';
 if(!['distance','width','height'].includes(type))return null;
 if(!Array.isArray(surfaces)||surfaces.length!==(type==='distance'?2:1)||!surfaces.every(s=>s&&label(s.name)&&['wall','floor','ceiling'].includes(s.kind)&&vector(s.point)&&vector(s.normal)&&Math.abs(Math.hypot(...s.normal)-1)<.00001&&Array.isArray(s.vertices)&&s.vertices.length>=9&&s.vertices.length<=1800&&s.vertices.length%9===0&&s.vertices.every(n=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<=1000)))return null;
 if(type==='distance'){
 const dot=(a,b)=>a.reduce((sum,n,i)=>sum+n*b[i],0),delta=surfaces[1].point.map((n,i)=>n-surfaces[0].point[i]);
 if(Math.abs(Math.abs(dot(surfaces[0].normal,surfaces[1].normal))-1)>1e-6||Math.abs(Math.abs(dot(delta,surfaces[0].normal))-input.distance)>1e-5)return null;
 const signed=dot(delta,surfaces[0].normal);
 if(input.start.some((v,i)=>Math.abs(v-surfaces[0].point[i])>1e-5)||input.end.some((v,i)=>Math.abs(v-input.start[i]-surfaces[0].normal[i]*signed)>1e-5))return null;
 }else{
  const extent=measureSurfaceExtent(surfaces[0],type);
  if(!extent||Math.abs(extent.distance-input.distance)>1e-5||['start','end'].some(key=>input[key].some((n,i)=>Math.abs(n-extent[key][i])>1e-5)))return null;
 }
 for(const {anchor} of surfaces)if(anchor!==undefined&&(!anchor||!label(anchor.id)||!anchor.id||!vector(anchor.normal)||anchor.normal.filter(n=>Math.abs(n)===1).length!==1||anchor.normal.some(n=>n!==0&&Math.abs(n)!==1)||!vector(anchor.position)||anchor.position.some(n=>n<0||n>1)))return null;
 return {id,type,floor:input.floor,label:input.label.trim(),distance:input.distance,actualDistance:input.actualDistance,start:[...input.start],end:[...input.end],surfaces:surfaces.map(({name,kind,point,normal,vertices,anchor})=>({name,kind,point,normal,vertices,...(anchor?{anchor:{id:anchor.id,normal:[...anchor.normal],position:[...anchor.position]}}:{})})),updatedAt:new Date().toISOString()};
}
