// Project facade finishes in metres, using one origin for all wall fragments.
// Window/door cuts therefore neither stretch the pattern nor restart its rows.
export function projectFacadeUV(mesh,tileWidth,tileHeight) {
 const {position,normal,uv}=mesh.geometry.attributes;
 for(let i=0;i<position.count;i++){
  const x=position.getX(i)+mesh.position.x,y=position.getY(i)+mesh.position.y,z=position.getZ(i)+mesh.position.z;
  const horizontal=Math.abs(normal.getY(i))>.5;
  uv.setXY(i,(Math.abs(normal.getX(i))>.5?z:x)/tileWidth,(horizontal?z:y)/tileHeight);
 }
 uv.needsUpdate=true;
 mesh.userData.facadeTileHeight=tileHeight;
}
