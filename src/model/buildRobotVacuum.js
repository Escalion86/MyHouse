import * as T from 'three';
import {STAIR} from './layout.js';

export function buildRobotVacuum(parent,{box,cylinder,mat,pickables,deviceMeshes}){
 const id='hall-robot-vacuum',g=new T.Group();g.name='Xiaomi S20+ под лестницей';
 g.position.set(STAIR.x0+.76,0,STAIR.z0+.27);parent.add(g);
 const materials=[],m=(color,props={})=>{const v=mat(color,props);materials.push(v);return v;};
 const white=m('#e5e3dc',{roughness:.38}),dark=m('#25292b'),gray=m('#909895'),red=m('#933b32'),metal=m('#9da3a0',{metalness:.5,roughness:.3});
 const cyl=(name,x,y,z,rt,rb,h,material)=>{const o=cylinder(g,x,y,z,rt,rb,h,material,64);o.name=name;return o;};
 const add=(name,x,y,z,w,h,d,material)=>box(g,name,x,y,z,w,h,d,material);
 cyl('Нижняя кромка робота',0,.024,0,.168,.163,.031,dark);
 cyl('Белый круглый корпус Xiaomi S20+',0,.059,0,.175,.175,.063,white);
 cyl('Крышка робота',0,.093,0,.169,.174,.013,white);
 const seam=new T.Mesh(new T.TorusGeometry(.17,.0013,6,64),gray);seam.rotation.x=Math.PI/2;seam.position.y=.094;g.add(seam);
 const bumper=new T.Mesh(new T.CylinderGeometry(.1755,.1755,.018,48,1,true,-1.05,2.1),dark);bumper.position.y=.072;bumper.name='Тёмная передняя полоса бампера';g.add(bumper);
 add('Передний датчик препятствий',0,.071,.176,.032,.014,.003,gray);
 // Raised lidar with the red accent visible in the owner's photo.
 cyl('Основание лидара',0,.104,-.055,.041,.042,.009,white);
 cyl('Красное кольцо лидара',0,.111,-.055,.035,.035,.009,red);
 cyl('Башенка лидара',0,.123,-.055,.034,.034,.017,white);
 cyl('Тёмное окно лидара',0,.133,-.055,.028,.028,.003,dark);
 for(const x of [-.015,.015]){cyl('Кнопка робота',x,.102,.028,.010,.010,.003,gray);cyl('Поверхность кнопки',x,.104,.028,.008,.008,.002,white);}
 const power=new T.Mesh(new T.TorusGeometry(.003,.0006,5,16,Math.PI*1.65),dark);power.rotation.x=-Math.PI/2;power.position.set(-.015,.1055,.028);g.add(power);
 add('Черта значка питания',-.015,.106,.026,.001,.001,.005,dark);
 add('Значок базы',.015,.106,.028,.005,.001,.005,dark);
 // Perforations are instanced to keep the detailed grille cheap to render.
 const vents=new T.InstancedMesh(new T.SphereGeometry(.0009,5,4),dark,144),dummy=new T.Object3D();let index=0;
 for(const side of [-1,1])for(let row=0;row<4;row++)for(let col=0;col<18;col++){
  const a=side*(.27+col*.025);dummy.position.set(Math.sin(a)*.1758,.042+row*.0037,Math.cos(a)*.1758);dummy.updateMatrix();vents.setMatrixAt(index++,dummy.matrix);
 }vents.name='Перфорация корпуса';g.add(vents);
 for(const x of [-.135,.135]){const wheel=cyl('Колесо робота',x,.022,0,.022,.022,.026,dark);wheel.rotation.z=Math.PI/2;}
 for(const x of [-.075,.075])cyl('Диск влажной уборки',x,.009,-.075,.061,.061,.012,gray);
 // Small charging dock against the wall, not a tall self-emptying station.
 add('Зарядная база Xiaomi S20+',0,.062,-.208,.16,.12,.064,dark);
 add('Верх базы',0,.125,-.208,.16,.007,.064,white);
 add('Площадка базы',0,.01,-.176,.18,.018,.11,dark);
 for(const x of [-.043,.043])add('Контакт зарядки',x,.055,-.173,.018,.032,.003,metal);
 g.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true;o.userData.deviceId=id;pickables.push(o);}});
 deviceMeshes[id]=g;
 return ()=>materials.forEach(v=>v.dispose());
}
