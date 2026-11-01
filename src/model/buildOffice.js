import * as T from 'three';
import {OFFICE as O,deskPlanPoint,HALL} from './layout.js';
import {buildWallDevices} from './buildWallDevices.js';
import {buildOfficeChair} from './buildOfficeChair.js';

// All coordinates here are source-plan coordinates. The house root reflects them once.
export function buildOffice(parent,{box,cylinder,sphere,mat,mats,colliders,pickables,deviceMeshes,furnitureSystem}) {
 const office=new T.Group();office.name='Кабинет — мебель по обмерам';parent.add(office);
 const gray=mat('#626767'),gold=mat('#a39768',{metalness:.65,roughness:.35});
 const add=(name,x,y,z,w,h,d,m,collision=false)=>box(office,name,x,y,z,w,h,d,m,collision);
 function device(id,make){const group=new T.Group();group.name=id;group.userData.deviceId=id;office.add(group);make(group);group.traverse(o=>{if(o.isMesh){o.userData.deviceId=id;pickables.push(o);}});deviceMeshes[id]=group;return group;}
 const wardrobe=O.wardrobe,wx=O.wallX+wardrobe.gap+wardrobe.depth/2,wz=wardrobe.z0+wardrobe.width/2;
 const cabinet=new T.Group();cabinet.name='Шкаф 80 × 48 × 202 см';office.add(cabinet);
 const shell=(name,x,y,z,w,h,d)=>box(cabinet,name,x,y,z,w,h,d,mats.wood,true);
 shell('Задняя стенка шкафа',wx-.232,1.01,wz,.016,2.02,.80);
 for(const z of [wz-.391,wz+.391])shell('Боковина шкафа',wx,1.01,z,.48,2.02,.018);
 for(const y of [.009,2.011])shell('Горизонтальная панель шкафа',wx,y,wz,.48,.018,.80);
 shell('Перегородка шкафа',wx,1.01,wz,.45,1.98,.018);
 shell('Полка над ящиками',wx,.735,wz+.20,.45,.018,.38);
 const front=O.wallX+.03+.48+.012;
 const leftDoor=add('Левая створка шкафа',front,1.03,wz-.20,.02,1.96,.392,mats.wood);
 const rightDoor=add('Правая створка шкафа',front,1.38,wz+.20,.02,1.26,.392,mats.wood);
 for(let i=0;i<3;i++){
  const yy=.16+i*.235,drawer=add('Правый выдвижной ящик шкафа '+(i+1),front+.002,yy,wz+.20,.023,.22,.392,mats.wood);
  const handle=add('Ручка ящика',front+.032,yy+.045,wz+.20,.025,.014,.15,gold);
  furnitureSystem.drawer(office,{id:'office-drawer-'+i,label:'Шкаф · ящик '+(3-i),roomId:'room-2',front:drawer,handle,axis:'x',travel:.28,width:.392,height:.22,depth:.36});
 }
 for(const [index,zz] of [wz-.035,wz+.035].entries()){
  const handle=add('Ручка створки',front+.035,1.09,zz,.025,.12,.016,gold);
  furnitureSystem.register(office,{id:'office-cabinet-door-'+index,label:'Шкаф · '+(index?'правая':'левая')+' дверца',roomId:'room-2',parts:[index?rightDoor:leftDoor,handle],pivot:[front,0,wz+(index?.396:-.396)],angle:index?-Math.PI/2:Math.PI/2});
 }
 add('Цоколь шкафа',wx,.025,wz,.47,.05,.79,mat('#6c5c4b'));

 const ps=O.printerShelf,px=O.wallX+ps.gap+ps.depth/2,pz=ps.z0+ps.width/2,board=.018;
 // Open two-level rack, lower level open to the floor, as in the photograph.
 for(const zz of [ps.z0+board/2,ps.z0+ps.width-board/2])add('Боковина полки принтера',px,.225,zz,.45,.45,board,mats.wood,true);
 for(const yy of [.441,.225])add('Горизонтальная полка принтера',px,yy,pz,.45,board,.62,mats.wood,true);
 add('Перегородка верхней полки',px,.334,pz,.45,.20,board,mats.wood);
 // A few orderly filament spools; temporary bags and boxes are intentionally omitted.
 for(const yy of [.065,.137]){const spool=cylinder(office,px,yy,ps.z0+.15,.075,.075,.05,mats.dark);spool.name='Катушка филамента';}
 const printerZ=ps.z0+.225,printerY=.45,printerDepth=.462,printerWidth=.435;
 device('office-3d-printer',group=>{
  box(group,'Основание K1 Max',px,printerY+.04,printerZ,printerDepth,.08,printerWidth,mats.dark);
  box(group,'Верх K1 Max',px,printerY+.55,printerZ,printerDepth,.065,printerWidth,mats.dark);
  for(const dx of [-printerDepth/2+.014,printerDepth/2-.014])for(const dz of [-printerWidth/2+.014,printerWidth/2-.014])box(group,'Рама K1 Max',px+dx,printerY+.30,printerZ+dz,.028,.49,.028,mats.metal);
  for(const dz of [-printerWidth/2,printerWidth/2])box(group,'Боковое стекло K1 Max',px,printerY+.30,printerZ+dz,printerDepth-.025,.49,.007,mats.glass);
  box(group,'Передняя дверь K1 Max',px+printerDepth/2,printerY+.30,printerZ,.007,.49,printerWidth-.025,mats.glass);
  box(group,'Платформа K1 Max',px,printerY+.10,printerZ,.32,.015,.32,mats.metal);
  box(group,'Экран K1 Max',px+printerDepth/2+.026,printerY+.10,printerZ+.13,.035,.075,.105,mats.dark);
 });
 const dz=printerZ+printerWidth/2+.075;
 add('Сушилка филамента Creality',px,.45+.17,dz,.27,.34,.145,mats.dark);
 add('Прозрачная крышка сушилки',px+.14,.70,dz,.012,.18,.13,mats.glass);
 add('Экран сушилки',px+.145,.53,dz,.012,.055,.105,mat('#374a56',{emissive:'#1a3442',emissiveIntensity:.3}));
 const disposeWallDevices=buildWallDevices({device,box,cylinder,sphere,mat,mats});

 // Imported CDR outline: 1520 × 1340 mm, chamfer and two 20 mm rounded corners.
 const shape=new T.Shape();const go=(method,u,v,...rest)=>{const p=deskPlanPoint([u,v]);shape[method](...p,...rest);};
 go('moveTo',0,0);go('lineTo',1.52,0);go('lineTo',1.52,1.34);go('lineTo',1.12,1.34);
 shape.quadraticCurveTo(...deskPlanPoint([1.10,1.34]),...deskPlanPoint([1.10,1.32]));
 go('lineTo',1.10,.94);go('lineTo',.67,.70);go('lineTo',.02,.70);
 shape.quadraticCurveTo(...deskPlanPoint([0,.70]),...deskPlanPoint([0,.68]));shape.closePath();
 const deskGeometry=new T.ExtrudeGeometry(shape,{depth:.03,bevelEnabled:false,curveSegments:8});deskGeometry.rotateX(Math.PI/2);
 const desktop=new T.Mesh(deskGeometry,mats.dark);desktop.position.y=.85;desktop.name='Столешница по CDR · 152 × 134 × 3 см';desktop.castShadow=desktop.receiveShadow=true;office.add(desktop);
 // Narrow collision strips preserve the cut-out instead of blocking its bounding box.
 for(let v=0;v<1.34;v+=.02){const minU=v<.70?0:v<.94?.67+(v-.70)/.24*.43:1.10;colliders.push({minX:O.wallX+v,maxX:O.wallX+Math.min(v+.02,1.34),minZ:O.backZ-1.52+minU,maxZ:O.backZ,minY:.82,maxY:.85});}
 for(const uv of O.desk.legs){const [x,z]=deskPlanPoint(uv);const leg=cylinder(office,x,.41,z,.025,.025,.82,mats.dark);leg.name='Круглая ножка стола Ø 5 см';}
 add('Крепление стола к боковой стене',2.63,.79,11.35,.04,.07,1.48,mats.dark);
 add('Крепление стола к дальней стене',3.28,.79,12.08,1.30,.07,.04,mats.dark);
 // Equipment on the long arm, facing the seated user to the right of the desk.
 device('office-paper-printer',group=>{box(group,'Brother DCP-T720DW',2.90,.985,10.87,.38,.27,.435,mats.dark);box(group,'Лоток Brother',3.13,.90,10.87,.17,.025,.25,mats.dark);});
 for(const [x,z,angle] of [[2.91,11.49,Math.PI/2],[3.45,11.89,0]]){
  const screen=new T.Group();screen.position.set(x,0,z);screen.rotation.y=angle;office.add(screen);
  box(screen,'Монитор',0,1.16,0,.56,.33,.035,mats.dark);box(screen,'Экран монитора',0,1.16,-.021,.52,.29,.008,mat('#40555d',{emissive:'#1b2c34',emissiveIntensity:.25}));box(screen,'Подставка монитора',0,.94,0,.025,.19,.025,mats.metal);
 }
 add('Клавиатура',3.46,.878,11.70,.42,.018,.14,mats.dark);
 buildOfficeChair(office,{mats,mat});
 device('office-desk-wled',group=>{box(group,'Чёрный контроллер подсветки стола',3.23,.785,10.87,.06,.06,.06,mats.dark);});
 const ledMaterial=mat('#e3dccb',{emissive:'#efc995',emissiveIntensity:0});
 const a=deskPlanPoint([.12,.695]),b=deskPlanPoint([.66,.695]);add('Подсветка под столом',(a[0]+b[0])/2,.805,(a[1]+b[1])/2,.018,.018,.54,ledMaterial);
 const ledLight=new T.PointLight('#efc995',0,3,2);ledLight.position.set(3.28,.64,11.30);office.add(ledLight);

 function shelf(name,x0,width,height,columns,rows,depth=.39){
  const cellW=(width-board)/columns,cellH=(height-board)/rows,z=O.backZ-depth/2;
  add(name+' · задняя стенка',x0+width/2,height/2,O.backZ-.008,width,height,.016,mats.white);
  for(let col=0;col<=columns;col++)add(name+' · вертикаль',x0+board/2+col*cellW,height/2,z,board,height,depth,mats.white,true);
  for(let row=0;row<=rows;row++)add(name+' · горизонталь',x0+width/2,board/2+row*cellH,z,width,board,depth,mats.white,true);
  const cell=(col,row)=>[x0+board+cellW*(col-.5),height-board-cellH*(row-.5),O.backZ-depth-.012];
  const door=(col,row)=>{const [x,y,zz]=cell(col,row),panel=add(name+` · серая дверца ${row}:${col}`,x,y,zz,cellW-.018,cellH-.018,.025,gray),handle=add('Петелька дверцы',x+cellW*.35,y,zz-.02,.018,.045,.012,mats.dark);
   furnitureSystem.register(office,{id:`shelf-${columns}-${row}-${col}-door`,label:`${name} · дверца ${row}:${col}`,roomId:'room-2',parts:[panel,handle],pivot:[x-cellW/2+.009,0,zz],angle:Math.PI/2});};
  const drawers=(col,row)=>{const [x,y,zz]=cell(col,row);for(const sign of [-1,1]){const panel=add(name+` · двойной ящик ${row}:${col}`,x,y+sign*cellH/4,zz,cellW-.018,cellH/2-.018,.025,gray),handle=add('Петелька ящика',x,y+sign*cellH/4+.035,zz-.02,.02,.04,.012,mats.dark);
   furnitureSystem.drawer(office,{id:`shelf-${columns}-${row}-${col}-${sign}`,label:`${name} · ${row}:${col}, ${sign>0?'верхний':'нижний'} ящик`,roomId:'room-2',front:panel,handle,axis:'z',travel:-.23,width:cellW-.018,height:cellH/2-.018,depth:.30,bodyMaterial:gray});}};
  return {cell,door,drawers,cellW,cellH,z};
 }
 const large=O.largeShelf,grid=shelf('Стеллаж 5 × 5',large.x0,1.69,1.69,5,5);
 for(const row of [1,5])for(const col of [1,5])grid.door(col,row);
 for(const col of [2,4])grid.drawers(col,3);
 const narrow=O.narrowShelf,small=shelf('Стеллаж 1 × 4',narrow.x0,narrow.width,narrow.height,1,4);
 small.drawers(1,2);small.door(1,3);small.door(1,4);
 const [sx,sy]=small.cell(1,1);add('Дополнительная полка верхней секции',sx,sy,small.z,narrow.width-board,.018,.39,mats.white);
 // A few permanent decorative objects leave the compartment layout readable.
 for(const [col,row] of [[2,2],[5,4]]){const [x,y,z]=grid.cell(col,row);for(let i=0;i<3;i++)add('Книга',x-.08+i*.055,y-.025,z+.15,.035,.19,.12,i%2?mats.dark:mats.wood);}
 const [fx,fy,fz]=grid.cell(1,2);add('Рамка на полке',fx,fy,fz+.08,.25,.21,.025,gray);add('Поле рамки',fx,fy,fz+.063,.20,.16,.007,mats.white);

 const table=O.cageTable,tx=table.x0+table.width/2,tz=O.backZ-table.depth/2;
 add('Столик клетки · 86 см',tx,table.height-.012,tz,.86,.024,.48,mats.wood,true);
 for(const x of [table.x0+.06,table.x0+.80])add('Боковина столика клетки',x,.27,tz,.025,.52,.43,mats.wood,true);
 add('Нижняя полка столика клетки',tx,.08,tz,.82,.024,.46,mats.wood);
 const cageBottom=table.height,cageW=.80,cageD=.44,cageH=.43;
 add('Поддон клетки',tx,cageBottom+.065,tz,cageW,.13,cageD,mats.white);
 const wire=mat('#a0aca7',{metalness:.6,roughness:.35});
 for(let i=0;i<=20;i++){const x=tx-cageW/2+i*cageW/20;for(const z of [tz-cageD/2,tz+cageD/2])add('Прут клетки',x,cageBottom+.28,z,.004,.30,.004,wire);add('Прут крыши клетки',x,cageBottom+cageH,tz,.004,.004,cageD,wire);}
 for(let i=0;i<=11;i++){const z=tz-cageD/2+i*cageD/11;for(const x of [tx-cageW/2,tx+cageW/2])add('Прут торца клетки',x,cageBottom+.28,z,.004,.30,.004,wire);}
 for(const y of [cageBottom+.14,cageBottom+.28,cageBottom+cageH])for(const z of [tz-cageD/2,tz+cageD/2])add('Горизонтальный прут',tx,y,z,cageW,.004,.004,wire);
 const rabbit=mat('#eeeae2'),pink=mat('#ceb5b0');
 sphere(office,tx+.12,cageBottom+.19,tz-.04,.11,.08,.065,rabbit).name='Кролик';sphere(office,tx+.205,cageBottom+.23,tz-.055,.055,.055,.046,rabbit);
 for(const x of [tx+.185,tx+.223]){const ear=sphere(office,x,cageBottom+.307,tz-.05,.016,.065,.022,rabbit);ear.rotation.z=-.12;sphere(office,x,cageBottom+.307,tz-.071,.009,.045,.004,pink);}
 sphere(office,tx+.22,cageBottom+.243,tz-.098,.005,.005,.005,mats.dark);sphere(office,tx+.017,cageBottom+.19,tz-.03,.036,.036,.036,rabbit);

 // User approved the existing hexagonal wallpaper representation.
 const hexColor=new T.Color('#d5d3ce');
 for(let row=0;row<5;row++)for(let col=0;col<9;col++){const x=2.91+col*.47+(row%2)*.235,yy=.38+row*.42;if(x>7.05)continue;const points=[];for(let j=0;j<=6;j++){const a=j*Math.PI/3;points.push(new T.Vector3(x+.27*Math.cos(a),yy+.27*Math.sin(a),12.095));}office.add(new T.Line(new T.BufferGeometry().setFromPoints(points),new T.LineBasicMaterial({color:hexColor})));}
 const beanbag=mat('#35343a');
 for(const [x,z] of [[5.42,8.52],[6.77,8.52]]){sphere(office,x,.30,z,.42,.34,.44,beanbag);const back=sphere(office,x,.52,z-.14,.33,.43,.30,beanbag);back.rotation.x=.2;}
 // Approximate dimensions from the photograph; long side extends into the room.
 const coffeeX=6.095,coffeeZ=8.48;
 add('Рама журнального столика',coffeeX,.48,coffeeZ,.50,.035,.80,mats.dark);
 add('Стеклянная столешница журнального столика',coffeeX,.503,coffeeZ,.465,.012,.765,mat('#b8c3c1',{metalness:.25,roughness:.17,transparent:true,opacity:.83}));
 add('Нижняя полка журнального столика',coffeeX,.18,coffeeZ,.46,.025,.74,mats.dark);
 for(const x of [coffeeX-.225,coffeeX+.225])for(const z of [coffeeZ-.37,coffeeZ+.37]){
  add('Ножка журнального столика',x,.24,z,.04,.44,.04,mats.dark);
  const wheel=cylinder(office,x,.035,z,.025,.025,.025,mats.dark,12);wheel.rotation.z=Math.PI/2;
 }
 add('Рамка картины DeLorean',coffeeX,1.73,8.013,.77,.54,.035,mats.dark);
 // Sample only the artwork in the supplied photo, leaving the original file intact.
 // UV order compensates for the house root's X reflection so the car isn't mirrored.
 const artGeometry=new T.PlaneGeometry(.744,.514);
 artGeometry.setAttribute('uv',new T.Float32BufferAttribute([
  806/2048,1-250/956,609/2048,1-240/956,
  806/2048,1-381/956,614/2048,1-376/956
 ],2));
 const artTexture=typeof Image!=='undefined'?new T.TextureLoader().load(new URL('../../references/office/20260916_210529.jpg',import.meta.url).href):null;
 if(artTexture)artTexture.colorSpace=T.SRGBColorSpace;
 const artMaterial=new T.MeshBasicMaterial({map:artTexture,color:artTexture?'#ffffff':'#35313d',side:T.DoubleSide});
 const artwork=new T.Mesh(artGeometry,artMaterial);artwork.name='DeLorean · Назад в будущее';artwork.position.set(coffeeX,1.73,8.032);office.add(artwork);
 // Round clock centred above the office doorway, as in the reference photo.
 const clock=new T.Group();clock.name='Настенные часы над проёмом';clock.position.set(HALL.officeOpening.at+HALL.officeOpening.width/2,2.57,8.015);clock.scale.x=-1;office.add(clock);
 const clockRim=cylinder(clock,0,0,0,.16,.16,.038,mats.dark,64);clockRim.rotation.x=Math.PI/2;
 const clockCanvas=document.createElement('canvas');clockCanvas.width=clockCanvas.height=256;
 const clockCtx=clockCanvas.getContext('2d');clockCtx.fillStyle='#eeeae1';clockCtx.fillRect(0,0,256,256);clockCtx.fillStyle='#292b30';clockCtx.textAlign='center';clockCtx.textBaseline='middle';clockCtx.font='23px sans-serif';
 for(let n=1;n<=12;n++){const a=n*Math.PI/6;clockCtx.fillText(String(n),128+Math.sin(a)*93,128-Math.cos(a)*93);}
 for(let n=0;n<60;n++){const a=n*Math.PI/30;clockCtx.strokeStyle='#53545a';clockCtx.lineWidth=n%5===0?2:1;clockCtx.beginPath();clockCtx.moveTo(128+Math.sin(a)*111,128-Math.cos(a)*111);clockCtx.lineTo(128+Math.sin(a)*117,128-Math.cos(a)*117);clockCtx.stroke();}
 const clockTexture=new T.CanvasTexture(clockCanvas);clockTexture.colorSpace=T.SRGBColorSpace;
 const clockFaceMaterial=new T.MeshBasicMaterial({map:clockTexture});
 const clockFace=new T.Mesh(new T.CircleGeometry(.145,64),clockFaceMaterial);clockFace.position.z=.020;clock.add(clockFace);
 for(const [name,length,angle,width] of [['Часовая стрелка',.076,Math.PI*.70,.008],['Минутная стрелка',.112,Math.PI,.005]]){
  const hand=box(clock,name,Math.sin(angle)*length/2,Math.cos(angle)*length/2,.023,width,length,.003,mats.dark);hand.rotation.z=-angle;
 }
 sphere(clock,0,0,.025,.010,.010,.004,mats.dark);
 add('Радиатор',7.02,.42,10.05,.10,.57,1.65,mats.white);
 const curtain=mat('#cac9c5',{transparent:true,opacity:.45});for(let i=0;i<45;i++)add('Нитяная штора',6.91,1.48,9.1+i*.041,.008,2.75,.008,curtain);
 for(const z of [9.15,10.8]){add('Крепление люстры',4.9,2.97,z,.8,.05,.10,mats.metal);for(const x of [4.58,4.9,5.22]){cylinder(office,x,2.68,z,.004,.004,.54,mats.dark,8);cylinder(office,x,2.39,z,.085,.11,.22,mat('#fff3d4',{emissive:'#ffdf9e',emissiveIntensity:.22}));}}
 return {ledMaterial,ledLight,disposeArtwork:()=>{disposeWallDevices();artTexture?.dispose();artMaterial.dispose();clockTexture.dispose();clockFaceMaterial.dispose();}};
}
