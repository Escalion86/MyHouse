import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {LEVEL,SHOWER} from './layout.js';

// u runs left-to-right from the doorway; v runs from the doorway to the window.
// Room/opening dimensions are measured; fixture dimensions are photo estimates.
export function buildShowerRoom(parent,ceilings,{box,cylinder,sphere,mat,mats,colliders,pickables,furnitureSystem}){
 const g=new T.Group();g.name='Душевая второго этажа по фотографиям';parent.add(g);
 const [x0,z0,x1,z1]=SHOWER.bounds,depth=x1-x0,width=z1-z0,w=SHOWER.window;
 const materials=[],textures=[],m=(c,p={})=>{const a=mat(c,p);materials.push(a);return a;};
 const pos=(u,y,v)=>[x1-v,LEVEL+y,z0+u];
 const add=(name,u,y,v,a,h,b,material,wall=false)=>box(wall?parent:g,name,...pos(u,y,v),b,h,a,material,false,wall);
 const round=(name,u,y,v,a,h,b,material,r=.025)=>{
  const o=new T.Mesh(new RoundedBoxGeometry(b,h,a,3,r),material);o.position.set(...pos(u,y,v));o.name=name;o.castShadow=o.receiveShadow=true;g.add(o);return o;
 };
 const ball=(name,u,y,v,a,h,b,material)=>{const o=sphere(g,...pos(u,y,v),b,h,a,material);o.name=name;return o;};
 const cyl=(name,u,y,v,r,h,material)=>{const o=cylinder(g,...pos(u,y,v),r,r,h,material);o.name=name;return o;};
 const rod=(name,a,b,r,material)=>{const p=new T.Vector3(...pos(...a)),q=new T.Vector3(...pos(...b)),o=cylinder(g,...p.clone().add(q).multiplyScalar(.5).toArray(),r,r,p.distanceTo(q),material);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),q.sub(p).normalize());o.name=name;return o;};
 const tube=(name,points,r,material)=>{const path=new T.CatmullRomCurve3(points.map(a=>new T.Vector3(...pos(...a))));const o=new T.Mesh(new T.TubeGeometry(path,48,r,8,false),material);o.name=name;o.castShadow=true;g.add(o);return o;};
 const solid=(u,v,a,b,h)=>{const [x,,z]=pos(u,0,v);colliders.push({minX:x-b/2,maxX:x+b/2,minZ:z-a/2,maxZ:z+a/2,minY:LEVEL,maxY:LEVEL+h});};
 const white=m('#f4f4ef',{roughness:.22}),black=m('#171d20',{roughness:.38}),chrome=m('#bdc7c9',{metalness:.82,roughness:.23});
 const grey=m('#5b6361'),beige=m('#c6b49a'),porcelain=m('#f6f5ef',{roughness:.19,side:T.DoubleSide});
 const glass=m('#a7c2bc',{transparent:true,opacity:.17,roughness:.13,metalness:.08,depthWrite:false,side:T.DoubleSide});
 let seed=109;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const canvas=draw=>{const c=document.createElement('canvas');c.width=c.height=512;draw(c.getContext('2d'));const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;textures.push(t);return t;};
 const board=canvas(c=>{c.fillStyle='#83a99b';c.fillRect(0,0,512,512);for(let i=0;i<6000;i++){c.fillStyle=rand()>.5?'rgba(250,248,224,.045)':'rgba(32,69,60,.045)';c.fillRect(rand()*512,rand()*512,2,2);}c.strokeStyle='#638a7e';c.lineWidth=1;c.strokeRect(1,1,510,510);for(let y=12;y<512;y+=54)for(const x of [7,505]){c.fillStyle='#46665c';c.beginPath();c.arc(x,y,1.4,0,7);c.fill();}});
 const green=m('#ffffff',{map:board,roughness:1});
 // Cut every lining around the real window and door instead of covering the openings.
 const winU=w.at-z0;
 for(const [a,b]of [[0,winU],[winU+w.width,width]])add('Зелёная стена душевой у окна',(a+b)/2,1.35,depth-.009,b-a,2.7,.016,green,true);
 add('Стена душевой под окном',winU+w.width/2,w.bottom/2,depth-.009,w.width,w.bottom,.016,green,true);
 add('Стена душевой над окном',winU+w.width/2,(w.top+2.7)/2,depth-.009,w.width,2.7-w.top,.016,green,true);
 for(const u of [.009,width-.009])add('Боковая зелёная стена душевой',u,1.35,depth/2,.016,2.7,depth,green,true);
 const doorU=SHOWER.door.at-z0,dw=SHOWER.door.width;
 for(const [a,b]of [[0,doorU],[doorU+dw,width]])add('Зелёная стена душевой у входа',(a+b)/2,1.35,.009,b-a,2.7,.016,green,true);
 add('Зелёная стена над входом в душевую',doorU+dw/2,2.4,.009,dw,.6,.016,green,true);
 // 5 cm side trims give an 80 cm outside width around the 70 cm door.
 const frame=m('#79513d');for(const u of [doorU-.025,doorU+dw+.025])add('Короб двери душевой',u,1.055,.025,.05,2.11,.035,frame);
 add('Верх короба двери душевой',doorU+dw/2,2.125,.025,SHOWER.door.frameWidth,.05,.035,frame);
 const floor=add('Светлый пол душевой',width/2,.012,depth/2,width,.018,depth,mats.floor);floor.userData.roomId='room-9';pickables.push(floor);
 for(const u of [winU+.01,winU+w.width-.01])add('Откос окна душевой',u,(w.bottom+w.top)/2,depth+.15,.022,w.top-w.bottom,.30,white,true);
 add('Подоконник душевой',winU+w.width/2,w.bottom-.025,depth+.10,w.width+.12,.045,.46,white);
 add('Верхний откос душевой',winU+w.width/2,w.top-.01,depth+.15,w.width,.02,.30,white,true);
 const fabric=canvas(c=>{c.fillStyle='#bfaaa7';c.fillRect(0,0,512,512);for(let i=0;i<512;i+=3){c.strokeStyle=i%2?'rgba(255,255,255,.18)':'rgba(67,51,45,.12)';c.beginPath();c.moveTo(i,0);c.lineTo(i,512);c.moveTo(0,i);c.lineTo(512,i);c.stroke();}});
 const blind=m('#ffffff',{map:fabric,roughness:1,side:T.DoubleSide});
 for(let i=0;i<2;i++){
  const u=winU+.305+i*.57,h=i?.78:.56;
  add('Рулонная штора душевой '+(i+1),u,w.top-.06-h/2,depth+.104,.526,h,.012,blind);
  rod('Вал рулонной шторы',[u-.27,w.top-.045,depth+.10],[u+.27,w.top-.045,depth+.10],.018,white);
  rod('Нижняя планка шторы',[u-.264,w.top-.06-h,depth+.10],[u+.264,w.top-.06-h,depth+.10],.009,beige);
 }
 rod('Ручка окна душевой',[winU+.62,1.53,depth+.09],[winU+.62,1.42,depth+.09],.009,white);
 const ru=winU+w.width/2;
 for(let i=0;i<9;i++){const u=ru-.32+i*.08;round('Секция радиатора душевой',u,.43,depth-.105,.072,.53,.13,white,.009);for(const y of [.23,.63])rod('Коллектор радиатора душевой',[u-.04,y,depth-.105],[u+.04,y,depth-.105],.025,white);}
 for(const y of [.08,.13])rod('Труба отопления под окном',[1.1,y,depth-.045],[width-.03,y,depth-.045],.011,white);
 tube('Подводка радиатора душевой',[[ru+.40,.09,depth-.05],[ru+.40,.69,depth-.05],[ru+.32,.69,depth-.10]],.012,white);
 add('Красный вентиль радиатора',ru+.4,.68,depth-.085,.05,.023,.035,m('#92392d'));

 // Hollow rounded basin rings, used for the tray and washbasin.
 function basin(name,u,v,levels,material,power=.38,cornerRadius=null){
  const vertices=[],indices=[],n=64;for(const [a,b,y]of levels)for(let i=0;i<n;i++){
   const t=i/n*Math.PI*2;
   if(cornerRadius!==null){
    const r=Math.min(cornerRadius,a,b),quadrant=Math.floor(i/16),angle=(quadrant+(i%16)/15)*Math.PI/2;
    const su=quadrant===0||quadrant===3?1:-1,sv=quadrant<2?1:-1;
    vertices.push(...pos(u+su*(a-r)+r*Math.cos(angle),y,v+sv*(b-r)+r*Math.sin(angle)));
   }else vertices.push(...pos(u+a*Math.sign(Math.cos(t))*Math.abs(Math.cos(t))**power,y,v+b*Math.sign(Math.sin(t))*Math.abs(Math.sin(t))**power));
  }
  for(let j=0;j<levels.length-1;j++)for(let i=0;i<n;i++){const a=j*n+i,b=j*n+(i+1)%n;indices.push(a,b,a+n,b,b+n,a+n);}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geo.setIndex(indices);geo.computeVertexNormals();const o=new T.Mesh(geo,material);o.name=name;o.castShadow=o.receiveShadow=true;g.add(o);return o;
 }
 // Rectangular enclosure in the left window corner, with two glass faces.
 const cu=.64,cv=depth-.46,ca=1.20,cb=.88;
 basin('Поддон душевой кабины',cu,cv,[[.60,.44,.09],[.60,.44,.25],[.555,.395,.25],[.53,.37,.145],[.001,.001,.145]],porcelain,.38,.025);
 // Straight front apron conceals the supports; the side clearance stays open.
 add('Передний экран поддона',cu,.055,cv-.4275,ca-.05,.07,.025,porcelain);
 solid(cu,cv,ca,cb,2.18);
 for(const u of [cu-.525,cu+.525])for(const v of [cv-.28,cv+.28])add('Деревянная подкладка кабины',u,.05,v,.13,.08,.12,mats.wood);
 add('Тёмная задняя панель кабины',cu,1.22,depth-.025,ca,1.94,.025,black);
 add('Боковая панель кабины у стены',.035,1.22,cv,.025,1.94,cb,black);
 const back=m('#bbc4bd');add('Светлая левая панель душевой стойки',.055,1.22,cv,.014,1.85,cb-.06,back);
 for(const u of [.035,cu+ca/2])for(const v of [cv-cb/2,depth-.025])if(u===.035||v===depth-.025)add('Стойка кабины',u,1.23,v,.027,1.98,.027,black);
 for(const y of [.27,2.20]){
  add('Передняя рама кабины',cu,y,cv-cb/2,ca+.03,.045,.035,black);
  add('Боковая рама кабины',cu+ca/2,y,cv,.035,.045,cb,black);
 }
 // Corner entrance: one leaf on each perpendicular face, sliding over fixed glass.
 const frontV=cv-cb/2,rightU=cu+ca/2;
 add('Неподвижное переднее стекло кабины',cu-ca/4,1.235,frontV+.018,ca/2-.025,1.88,.008,glass);
 add('Неподвижное правое стекло кабины',rightU-.018,1.235,cv+cb/4,.008,1.88,cb/2-.025,glass);
 rod('Профиль неподвижного переднего стекла',[cu,.28,frontV+.018],[cu,2.18,frontV+.018],.007,chrome);
 rod('Профиль неподвижного правого стекла',[rightU-.018,.28,cv],[rightU-.018,2.18,cv],.007,chrome);
 // The closing profiles share a face at the corner; each travels with its leaf.
 const frontPlane=frontV-.006,sidePlane=rightU+.006,profile=.014,jointV=frontPlane+profile/2;
 const frontParts=[add('Стеклянная передняя дверь кабины',(cu+sidePlane)/2,1.235,frontPlane,sidePlane-cu,1.88,.008,glass)];
 const sideParts=[add('Стеклянная правая дверь кабины',sidePlane,1.235,(jointV+cv)/2,.008,1.88,cv-jointV,glass)];
 frontParts.push(rod('Профиль передней двери кабины',[cu,.28,frontPlane],[cu,2.18,frontPlane],.007,chrome));
 sideParts.push(rod('Профиль правой двери кабины',[sidePlane,.28,cv],[sidePlane,2.18,cv],.007,chrome));
 frontParts.push(add('Стыковой профиль передней двери',sidePlane,1.23,frontPlane,profile,1.90,profile,chrome));
 sideParts.push(add('Стыковой профиль правой двери',sidePlane,1.23,jointV+profile/2,profile,1.90,profile,chrome));
 frontParts.push(rod('Ручка передней двери кабины',[rightU-.075,1.04,frontV-.045],[rightU-.075,1.25,frontV-.045],.009,black));
 sideParts.push(rod('Ручка правой двери кабины',[rightU+.045,1.04,frontV+.075],[rightU+.045,1.25,frontV+.075],.009,black));
 for(const y of [1.04,1.25]){
  frontParts.push(rod('Крепление передней ручки кабины',[rightU-.075,y,frontV-.006],[rightU-.075,y,frontV-.045],.007,black));
  sideParts.push(rod('Крепление правой ручки кабины',[rightU+.006,y,frontV+.075],[rightU+.045,y,frontV+.075],.007,black));
 }
 furnitureSystem.register(g,{id:'shower-front-door',label:'Кабина · передняя дверь влево',roomId:'room-9',parts:frontParts,offset:[0,0,-(ca/2-.035)]});
 furnitureSystem.register(g,{id:'shower-right-door',label:'Кабина · правая дверь вправо',roomId:'room-9',parts:sideParts,offset:[-(cb/2-.035),0,0]});
 add('Крыша душевой кабины',cu,2.19,cv,ca,.04,cb,white);
 add('Верхний квадратный душ',cu,2.16,cv,.24,.015,.23,black);
 cyl('Слив поддона',cu,.15,cv+.22,.031,.004,chrome);
 // Hand shower and controls are mounted on the left face, facing into the cabin.
 add('Чёрная душевая стойка',.085,1.24,cv+.04,.035,.70,.12,black);
 rod('Штанга лейки',[.11,.95,cv-.18],[.11,1.91,cv-.18],.009,chrome);
 ball('Ручная душевая лейка',.15,1.88,cv-.18,.012,.065,.055,chrome);
 tube('Шланг кабины',[[.115,1.02,cv+.04],[.16,.78,cv+.10],[.19,.72,cv-.18],[.16,1.03,cv-.22],[.13,1.82,cv-.18]],.008,black);
 for(const y of [1.12,1.36])ball('Смеситель кабины',.112,y,cv+.04,.012,.028,.028,chrome);
 const bottles=[m('#e8e6dc'),m('#3c9d91'),m('#bf5863'),m('#6e93b0'),m('#cdb86e')];
 function bottle(u,y,v,i,h=.15){cyl('Флакон на полке душевой',u,y+h/2,v,.022,h,bottles[i%bottles.length]);cyl('Крышка флакона',u,y+h+.01,v,.013,.022,white);}
 for(const y of [1.48,1.77]){
  // Two joined arms follow the rear and left walls, leaving an L-shaped outline.
  add('Угловая полочка кабины · заднее плечо',.285,y,depth-.11,.43,.025,.13,black);
  add('Угловая полочка кабины · левое плечо',.135,y,depth-.265,.13,.025,.18,black);
  for(let i=0;i<3;i++)bottle(.14+i*.13,y+.015,depth-.11,i,.13+i*.025);
  bottle(.135,y+.015,depth-.28,3,.14);
 }

 // Toilet and pedestal washbasin occupy the opposite short wall.
 const tu=width-.39,tv=1.60;
 round('Бачок унитаза душевой',width-.16,.72,tv,.23,.40,.38,white,.045);
 round('Крышка бачка душевой',width-.16,.935,tv,.25,.025,.40,white,.02);
 cyl('Кнопка смыва душевой',width-.17,.954,tv,.022,.007,chrome);
 ball('Основание унитаза душевой',tu-.10,.16,tv,.20,.16,.14,white);
 ball('Ножка унитаза душевой',tu+.025,.25,tv,.14,.22,.13,white);
 ball('Чаша унитаза душевой',tu-.06,.37,tv,.29,.15,.195,white);
 // Ceramic rear neck and mounting shelf connect the cistern to the bowl.
 round('Задняя опора бачка душевой',width-.25,.39,tv,.26,.20,.27,white,.05);
 round('Полка под бачком душевой',width-.19,.49,tv,.29,.07,.36,white,.025);
 ball('Сиденье унитаза душевой',tu-.08,.465,tv,.285,.035,.20,white);
 ball('Закрытая крышка унитаза душевой',tu-.08,.491,tv,.273,.018,.192,white);
 solid(tu-.04,tv,.68,.43,1.0);
 const su=width-.30,sv=.76;
 cyl('Пьедестал раковины душевой',su,.37,sv,.10,.72,white);
 basin('Раковина душевой',su,sv,[[.16,.17,.67],[.25,.29,.82],[.24,.28,.85],[.19,.23,.85],[.12,.15,.73],[.001,.001,.73]],porcelain,.75);
 solid(su,sv,.53,.59,.87);
 cyl('Слив раковины душевой',su,.735,sv,.023,.005,chrome);
 tube('Смеситель раковины',[[width-.12,.84,sv],[width-.12,.98,sv],[width-.25,.98,sv],[width-.27,.94,sv]],.015,chrome);
 add('Рычаг смесителя раковины',width-.12,1.01,sv,.07,.016,.025,chrome);
 cyl('Стакан зубных щёток',su,.90,sv-.21,.035,.10,beige);
 for(let i=0;i<3;i++)rod('Зубная щётка',[su+i*.012-.012,.91,sv-.21],[su+i*.018-.018,1.045,sv-.21],.004,bottles[i]);
 bottle(su,.85,sv+.22,4,.115);
 // Wavy mirror outline matching the photograph, backed by a thin reflective face.
 const shape=new T.Shape();shape.moveTo(-.22,-.31);shape.bezierCurveTo(-.28,-.10,-.16,.12,-.22,.31);shape.lineTo(.22,.31);shape.bezierCurveTo(.28,.10,.16,-.12,.22,-.31);shape.closePath();
 const mirror=new T.Mesh(new T.ShapeGeometry(shape),m('#a6b8b3',{metalness:.92,roughness:.08,side:T.DoubleSide}));mirror.name='Волнистое зеркало душевой';mirror.rotation.y=Math.PI;mirror.position.set(...pos(width-.025,1.55,sv));g.add(mirror);
 add('Стеклянная полочка под зеркалом',width-.09,1.22,sv,.15,.012,.47,glass);
 // Three-level trolley and three narrow wall shelves beside the sink.
 const shelfU=width-.25,shelfV=.22;
 for(const u of [shelfU-.17,shelfU+.17])for(const v of [.07,.37])add('Стойка этажерки душевой',u,.43,v,.026,.84,.026,grey);
 for(const y of [.10,.37,.76]){add('Полка этажерки душевой',shelfU,y,shelfV,.38,.025,.36,grey);for(let i=0;i<3;i++)bottle(shelfU-.10+i*.095,y+.02,shelfV,i+(y>.5?2:0),.10+i*.02);}
 solid(shelfU,shelfV,.40,.39,.91);
 for(const y of [1.22,1.55,1.88]){add('Настенная полочка душевой',width-.13,y,.19,.23,.02,.32,chrome);for(let i=0;i<3;i++)bottle(width-.13,y+.015,.08+i*.10,i,.13+i*.025);rod('Бортик настенной полки',[width-.255,y+.055,.04],[width-.255,y+.055,.34],.004,chrome);}
 // Cloth hangs naturally from a narrow top rather than as rigid boxes.
 function towel(name,u,top,v,a,h,color,onSide=false){
  const geo=new T.PlaneGeometry(a,h,20,28),p=geo.attributes.position;
  for(let i=0;i<p.count;i++){const s=p.getX(i)/a,t=.5-p.getY(i)/h,spread=a*(.24+.76*Math.sin(t*Math.PI/2)),wave=.025*Math.sin(s*18+t*9);p.setXYZ(i,...pos(u+(onSide?wave:s*spread),top-t*h+.018*Math.sin(s*9)*t,v+(onSide?s*spread:wave)));}geo.computeVertexNormals();const o=new T.Mesh(geo,m(color,{roughness:1,side:T.DoubleSide}));o.name=name;o.castShadow=true;g.add(o);
 }
 add('Планка крючков для халатов',.78,1.70,.035,1.20,.035,.025,white);
 for(let i=0;i<5;i++){const u=.25+i*.25;rod('Крючок халата',[u,1.70,.035],[u,1.72,.095],.009,chrome);towel('Полотенце или халат на крючке',u,1.69,.09,.29,.75+(i%3)*.15,['#ddd6cb','#656267','#b1a697','#c9c3bb','#c68c83'][i]);}
 rod('Крючок полотенца раковины',[width-.03,1.57,1.16],[width-.09,1.59,1.16],.009,white);
 towel('Полотенце у раковины',width-.09,1.56,1.16,.28,.63,'#a77e66',true);
 round('Корзина для белья у кабины',.24,.29,.28,.38,.54,.39,beige,.025);solid(.24,.28,.39,.40,.57);
 add('Крышка корзины для белья',.24,.572,.28,.40,.027,.41,beige);
 round('Мусорное ведро у унитаза',width-.25,.22,2.12,.26,.41,.25,beige,.04);
 round('Крышка мусорного ведра',width-.25,.44,2.12,.28,.04,.27,m('#58473b'),.025);
 cyl('Подставка ёршика',width-.50,.06,1.96,.052,.11,beige);rod('Ручка ёршика',[width-.50,.08,1.96],[width-.50,.40,1.96],.007,chrome);
 for(const y of [.08,.14])rod('Трубы вдоль стены за унитазом',[width-.045,y,.34],[width-.045,y,depth],.012,white);
 // Two white mats with dark marble veins.
 const marble=canvas(c=>{c.fillStyle='#e6e5e1';c.fillRect(0,0,512,512);for(let i=0;i<8;i++){c.beginPath();let x=rand()*512;c.moveTo(x,0);for(let y=0;y<=512;y+=16){x+=(rand()-.53)*58;c.lineTo(x,y);}c.strokeStyle=i%2?'#999c9f':'#535d67';c.lineWidth=i%2?1:2;c.stroke();}});
 const matRug=m('#ffffff',{map:marble,roughness:.92});
 for(const [name,u,v,a,b]of [['Коврик перед кабиной',.86,1.05,.75,.47],['Коврик перед унитазом',width-.88,tv,.43,.52]])round(name,u,.029,v,a,.009,b,matRug,.015);
 const light=new T.Group();light.name='Светильник душевой второго этажа';ceilings.add(light);
 box(light,'Корпус светильника душевой',...pos(1.95,2.673,1.26),.055,.035,1.18,white);
 box(light,'Рассеиватель светильника душевой',...pos(1.95,2.65,1.26),.04,.018,1.13,m('#ffffff',{emissive:'#fff8ec',emissiveIntensity:.65}));
 return()=>{materials.forEach(a=>a.dispose());textures.forEach(a=>a.dispose());};
}
