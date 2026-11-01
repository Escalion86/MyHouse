import * as T from 'three';

// Photo 183744: Deco at left, Alice at right, acrylic server below between them.
// Dimensions and component placement remain visual estimates, not board CAD.
export function buildWallDevices({device,box,cylinder,sphere,mat,mats}) {
 const textures=[],materials=[];
 const material=(color,options={})=>{const m=mat(color,options);materials.push(m);return m;};
 const white=material('#f0f0e9',{roughness:.48}),black=material('#171a20'),rubber=material('#292c31'),silver=material('#a4abb0',{metalness:.8,roughness:.28});
 const acrylic=material('#dfedf0',{transparent:true,opacity:.15,roughness:.13,depthWrite:false,side:T.DoubleSide});
 const edge=material('#becdce',{transparent:true,opacity:.48,roughness:.22});
 const green=material('#24e1a0',{emissive:'#19d38d',emissiveIntensity:1.5});
 const red=material('#ed3041',{emissive:'#f01c30',emissiveIntensity:1.3});
 const pcb=material('#283f43'),gold=material('#c7a04e',{metalness:.65,roughness:.4});
 const place=(g,x,y,z)=>{g.position.set(x,y,z);g.rotation.y=Math.PI/2;g.scale.x=-1;};
 const mesh=(g,name,geometry,m,x=0,y=0,z=0)=>{const o=new T.Mesh(geometry,m);o.name=name;o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;g.add(o);return o;};
 const cube=(g,name,x,y,z,w,h,d,m)=>box(g,name,x,y,z,w,h,d,m);
 const cyl=(g,name,x,y,z,r,h,m,n=48)=>{const o=cylinder(g,x,y,z,r,r,h,m,n);o.name=name;return o;};
 const faceDisc=(g,name,x,y,z,r,h,m)=>{const o=cyl(g,name,x,y,z,r,h,m);o.rotation.x=Math.PI/2;return o;};
 function canvasTexture(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;textures.push(t);return t;}
 function label(g,name,text,x,y,z,w,h,color='#727575'){
  const t=canvasTexture(512,128,(c,W,H)=>{c.clearRect(0,0,W,H);c.fillStyle=color;c.font='64px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(text,W/2,H/2);});
  const m=new T.MeshBasicMaterial({map:t,transparent:true,depthWrite:false,side:T.DoubleSide});materials.push(m);
  return mesh(g,name,new T.PlaneGeometry(w,h),m,x,y,z);
 }
 function repeated(g,name,geometry,m,positions){const o=new T.InstancedMesh(geometry,m,positions.length);o.name=name;const matrix=new T.Matrix4();positions.forEach((p,i)=>{matrix.makeTranslation(...p);o.setMatrixAt(i,matrix);});o.castShadow=true;g.add(o);return o;}
 function roundedBody(g,name,profile,m){
  const geometry=new T.LatheGeometry(profile.map(([r,y])=>new T.Vector2(r,y)),64);
  // Lathe poles on the axis can have zero normals; give the end caps stable normals.
  const normals=geometry.attributes.normal,positions=geometry.attributes.position;
  for(let i=0;i<normals.count;i++)if(Math.hypot(normals.getX(i),normals.getY(i),normals.getZ(i))<.01)normals.setXYZ(i,0,positions.getY(i)<0?-1:1,0);
  geometry.normalizeNormals();return mesh(g,name,geometry,m);
 }
 device('office-router',g=>{
  place(g,2.75,2.13,10.13);
  cube(g,'Deco X60 · настенная площадка',0,-.155,-.045,.235,.018,.17,white);
  cube(g,'Deco X60 · основание крепления',0,-.137,-.12,.22,.11,.015,white);
  roundedBody(g,'Deco X60 · белый корпус',[[0,-.133],[.081,-.133],[.103,-.126],[.110,-.110],[.111,.115],[.106,.130],[.095,.135],[0,.135]],white);
  const top=cyl(g,'Deco X60 · верхняя крышка',0,.133,0,.098,.004,white,64);
  top.material=material('#e6e9e4',{roughness:.65});
  const seam=mesh(g,'Deco X60 · шов крышки',new T.TorusGeometry(.102,.0012,6,64),material('#cdd0ca'),0,.129,0);seam.rotation.x=Math.PI/2;
  cyl(g,'Deco X60 · нижний пояс',0,-.119,0,.105,.015,white);
  cube(g,'Deco X60 · прорезь индикатора',0,-.097,.108,.058,.007,.003,black);
  cube(g,'Deco X60 · зелёный индикатор',0,-.097,.111,.033,.004,.002,green);
  label(g,'Deco X60 · логотип','deco',0,-.056,.112,.066,.018,'#6b706e');
  for(const x of [-.085,.085])faceDisc(g,'Deco X60 · винт крепления',x,-.150,.043,.003,.003,silver);
 });
 const fabric=canvasTexture(512,256,(c,w,h)=>{c.fillStyle='#242832';c.fillRect(0,0,w,h);for(let y=0;y<h;y+=5)for(let x=0;x<w;x+=5){c.fillStyle=(x+y)%10?'#11151c':'#3b3f49';c.fillRect(x+(y%10?2:0),y,2,2);}});
 const cloth=material('#dddddf',{map:fabric,roughness:.94});
 device('office-speaker',g=>{
  place(g,2.75,2.045,10.42);
  cube(g,'Алиса · настенная площадка',0,-.103,-.039,.176,.018,.145,black);
  cube(g,'Алиса · задняя пластина крепления',0,-.073,-.12,.17,.105,.013,black);
  roundedBody(g,'Алиса · нижняя чашка',[[0,-.091],[.063,-.091],[.080,-.083],[.091,-.060],[.095,-.031]],rubber);
  cyl(g,'Алиса · тканевая решётка',0,.020,0,.093,.103,cloth,64);
  cyl(g,'Алиса · верхняя панель',0,.074,0,.091,.008,black,64);
  const rim=mesh(g,'Алиса · ободок',new T.TorusGeometry(.092,.0014,6,64),rubber,0,.070,0);rim.rotation.x=Math.PI/2;
  for(const [x,z] of [[-.030,0],[.030,0],[0,-.031],[0,.031]])cyl(g,'Алиса · кнопка',x,.079,z,.008,.002,rubber,24);
  cube(g,'Алиса · плюс',.030,.081,0,.009,.001,.0015,mats.metal);
  cube(g,'Алиса · плюс',.030,.081,0,.0015,.001,.009,mats.metal);
  cube(g,'Алиса · минус',-.030,.081,0,.009,.001,.0015,mats.metal);
  for(const x of [-.061,.061])cyl(g,'Алиса · микрофон',x,.079,-.031,.0018,.001,black,12);
  // Dot-matrix time from the reference; this is decorative, not a live device state.
  const clock=canvasTexture(512,160,(c,w,h)=>{
   c.clearRect(0,0,w,h);c.fillStyle='#92b9ff';
   const glyphs={'1':['010','110','010','010','111'],'8':['111','101','111','101','111'],':':['0','1','0','1','0'],'3':['111','001','111','001','111'],'7':['111','001','010','010','010']};
   let x=24;for(const digit of '18:37'){const glyph=glyphs[digit];for(let row=0;row<5;row++)for(let col=0;col<glyph[row].length;col++)if(glyph[row][col]==='1'){c.beginPath();c.arc(x+col*25,25+row*26,8,0,Math.PI*2);c.fill();}x+=digit===':'?40:94;}
  });
  const clockMat=new T.MeshBasicMaterial({map:clock,transparent:true,depthWrite:false,side:T.DoubleSide});materials.push(clockMat);
  const displayGeo=new T.CylinderGeometry(.094,.094,.041,40,1,true,-.70,1.40);
  // The device frame already compensates for the house reflection; keep native UVs.
  mesh(g,'Алиса · часы 18:37 по фото',displayGeo,clockMat,0,.020,0);
 });
 device('office-server',g=>{
  place(g,2.656,1.69,10.29);
  cube(g,'Orange Pi 3B · задняя акриловая пластина',0,0,-.014,.15,.19,.005,acrylic);
  cube(g,'Orange Pi 3B · плата',0,0,.003,.12,.16,.003,pcb);
  cube(g,'Orange Pi 3B · передняя акриловая пластина',0,0,.058,.15,.19,.004,acrylic);
  for(const x of [-.073,.073])cube(g,'Orange Pi 3B · боковая кромка корпуса',x,0,.022,.003,.19,.072,edge);
  for(const y of [-.093,.093])cube(g,'Orange Pi 3B · торцевая кромка корпуса',0,y,.022,.15,.003,.072,edge);
  for(const x of [-.062,.062])for(const y of [-.078,.078]){
   faceDisc(g,'Orange Pi 3B · латунная стойка',x,y,.025,.0035,.061,gold);
   faceDisc(g,'Orange Pi 3B · винт крышки',x,y,.062,.004,.003,silver);
   cube(g,'Orange Pi 3B · шлиц винта',x,y,.064,.005,.001,.001,black);
  }
  cube(g,'Orange Pi 3B · радиатор',0,.019,.016,.041,.038,.019,silver);
  repeated(g,'Orange Pi 3B · рёбра радиатора',new T.BoxGeometry(.002,.034,.009),silver,Array.from({length:9},(_,i)=>[-.018+i*.0045,.019,.03]));
  cube(g,'Orange Pi 3B · рамка вентилятора',0,-.022,.036,.056,.056,.011,black);
  faceDisc(g,'Orange Pi 3B · кольцо вентилятора',0,-.022,.043,.024,.004,rubber);
  faceDisc(g,'Orange Pi 3B · ротор',0,-.022,.047,.009,.005,black);
  for(let i=0;i<7;i++){const a=i*Math.PI*2/7;const blade=sphere(g,Math.sin(a)*.015,-.022+Math.cos(a)*.015,.047,.006,.011,.0018,black);blade.name='Orange Pi 3B · лопасть вентилятора';blade.rotation.z=-a+.4;}
  for(const [x,w] of [[-.031,.026],[.006,.026],[.043,.029]]){
   cube(g,'Orange Pi 3B · металлический разъём',x,.073,.024,w,.028,.033,silver);
   cube(g,'Orange Pi 3B · гнездо разъёма',x,.075,.041,w-.006,.016,.002,black);
   cube(g,'Orange Pi 3B · контактная вставка',x,.071,.043,w-.010,.003,.002,x<0?material('#236289'):gold);
  }
  cube(g,'Orange Pi 3B · колодка GPIO',-.049,-.004,.015,.009,.070,.008,black);
  repeated(g,'Orange Pi 3B · контакты GPIO',new T.BoxGeometry(.0016,.0016,.007),gold,Array.from({length:40},(_,i)=>[-.052+(i%2)*.006,-.037+Math.floor(i/2)*.0035,.022]));
  for(const [x,y] of [[.040,.031],[.036,-.050],[-.027,-.061]])cube(g,'Orange Pi 3B · микросхема',x,y,.011,.016,.014,.006,black);
  cube(g,'Orange Pi 3B · красный индикатор',.036,-.067,.026,.006,.006,.004,red);
  cube(g,'Orange Pi 3B · второй индикатор',.048,-.067,.026,.003,.003,.004,green);
  cube(g,'Orange Pi 3B · антенный адаптер',-.026,.104,.016,.019,.045,.021,black);
  const antenna=new T.Group();antenna.name='Orange Pi 3B · антенна';antenna.position.set(-.027,.125,.016);antenna.rotation.z=.22;g.add(antenna);
  cyl(antenna,'Orange Pi 3B · шарнир антенны',0,.007,0,.007,.02,black);
  cyl(antenna,'Orange Pi 3B · стержень антенны',0,.092,0,.006,.16,black);
  sphere(antenna,0,.174,0,.006,.006,.006,black).name='Orange Pi 3B · наконечник антенны';
  label(g,'Orange Pi 3B · маркировка','Orange Pi 3B',0,-.084,.065,.098,.013,'#d0d8d2');
 });
 return ()=>{textures.forEach(t=>t.dispose());materials.forEach(m=>m.dispose());};
}
