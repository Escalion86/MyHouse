export const measurementTypes={distance:'Расстояние между поверхностями',width:'Ширина участка стены',height:'Высота участка стены'};

// Dimensions of the selected vertical face, in world metres. Width follows the
// wall, not the world X axis, so rotations and mirrored storeys remain correct.
export function measureSurfaceExtent(surface,type){
 if(!['width','height'].includes(type)||surface.kind!=='wall'||Math.abs(surface.normal[1])>.001)return null;
 const [nx,,nz]=surface.normal,length=Math.hypot(nx,nz);
 if(length<.999)return null;
 const tangent=[nz/length,0,-nx/length],vertices=surface.vertices;
 let minU=Infinity,maxU=-Infinity,minY=Infinity,maxY=-Infinity;
 for(let i=0;i<vertices.length;i+=3){
  const u=vertices[i]*tangent[0]+vertices[i+2]*tangent[2];
  minU=Math.min(minU,u);maxU=Math.max(maxU,u);minY=Math.min(minY,vertices[i+1]);maxY=Math.max(maxY,vertices[i+1]);
 }
 const plane=vertices[0]*nx+vertices[2]*nz;
 const point=(u,y)=>[nx*plane+tangent[0]*u,y,nz*plane+tangent[2]*u];
 const start=type==='width'?point(minU,(minY+maxY)/2):point((minU+maxU)/2,minY);
 const end=type==='width'?point(maxU,(minY+maxY)/2):point((minU+maxU)/2,maxY);
 const distance=type==='width'?maxU-minU:maxY-minY;
 return Number.isFinite(distance)&&distance>.0001?{distance,start,end}:null;
}
