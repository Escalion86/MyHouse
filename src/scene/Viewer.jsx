import React,{useEffect,useRef,useState,useImperativeHandle,forwardRef} from 'react';
import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {buildHouse} from '../model/buildHouse';
import {W,D,LEVEL,roomById,centerOf,mirrorX,roomAt,entrance,officeDoor,HALL,LIVING,SHOWER,CHILD,CLOSET} from '../model/layout';
import {moveWalker,walkBlocked,routeToFloor,followStairRoute} from './walkNavigation';
import {pickSurface,roomForSurface} from './picking';

export default forwardRef(function Viewer({floor,mode,freeCamera=false,roomId,deviceId,onRoom,onDevice,deskLight,switchStates,onFloor,onDoors,onFurniture,onNotice},ref) {
 const mount=useRef(null),engine=useRef(null),props=useRef({});props.current={floor,mode,freeCamera,roomId,deviceId,onRoom,onDevice,onFloor,onDoors,onFurniture,onNotice};
 const [error,setError]=useState(''),[location,setLocation]=useState(''),[stairAvailable,setStairAvailable]=useState(false),[followingStairs,setFollowingStairs]=useState(false);
 useImperativeHandle(ref,()=>({focusDevice:id=>engine.current?.focusDevice(id),toggleDoor:id=>engine.current?.toggleDoor(id),toggleFurniture:id=>engine.current?.toggleFurniture(id),reset:()=>engine.current?.overview(props.current.floor),zoom:n=>engine.current?.zoom(n),move:(key,pressed)=>engine.current?.key(key,pressed),export:async()=>{
  const e=engine.current;if(!e)return;e.model.applyView(0,'walk');
  const lineMaterials=[];e.model.root.traverse(o=>{if(o.isLine){lineMaterials.push([o,o.material]);o.material=new T.MeshBasicMaterial({color:o.material.color});}});
  try{const data=await new GLTFExporter().parseAsync(e.model.root,{binary:true});return await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(new Blob([data],{type:'model/gltf-binary'}));});}finally{for(const [o,material] of lineMaterials){o.material.dispose();o.material=material;}e.model.applyView(props.current.floor,props.current.mode);}
 }}),[]);
 useEffect(()=>{
  const host=mount.current;let renderer;try{renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});}catch{setError('Браузер не смог запустить 3D. Включите аппаратное ускорение или откройте приложение в Chrome / Edge.');return;}
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;host.appendChild(renderer.domElement);renderer.domElement.setAttribute('aria-label','Интерактивная 3D-модель дома');renderer.domElement.setAttribute('tabindex','0');
  const scene=new T.Scene();scene.background=new T.Color('#eeeeeb');scene.fog=new T.Fog('#eeeeeb',50,100);
  const camera=new T.PerspectiveCamera(44,1,.04,180);const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.1;controls.maxPolarAngle=Math.PI*.48;controls.minDistance=3;controls.maxDistance=50;
  scene.add(new T.HemisphereLight('#ffffff','#b3b9a8',2.6));const sun=new T.DirectionalLight('#fff6e5',3.1);sun.position.set(-10,22,-6);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-25;sun.shadow.camera.right=25;sun.shadow.camera.top=25;sun.shadow.camera.bottom=-25;sun.shadow.normalBias=.025;sun.shadow.bias=-.0003;scene.add(sun);
  const model=buildHouse(scene);const keys=new Set();let yaw=0,pitch=0,feet=0,last=performance.now(),animation,drag=null,dragged=false,selectedGlow=null,lastRoom='',disposed=false,route=null,viewSelection=null,lastStairAvailable=false;
  const isFree=()=>props.current.mode==='overview'&&props.current.freeCamera;
  let focusTween=null;
  const cancelFocus=()=>{focusTween=null;controls.enableDamping=true;};
  const focusDevice=id=>{
   cancelFocus();
   const object=model.deviceMeshes[id];
   if(!object||props.current.mode!=='overview')return;
   model.root.updateMatrixWorld(true);
   const bounds=new T.Box3().setFromObject(object);
   if(bounds.isEmpty())return;
   const target=bounds.getCenter(new T.Vector3()),size=bounds.getSize(new T.Vector3());
   const direction=camera.position.clone().sub(controls.target).normalize();
   if(direction.lengthSq()<.01)direction.set(-.7,1,-1).normalize();
   direction.y=Math.max(direction.y,.45);direction.normalize();
   const halfFov=Math.min(T.MathUtils.degToRad(camera.fov)/2,Math.atan(Math.tan(T.MathUtils.degToRad(camera.fov)/2)*camera.aspect));
   const distance=Math.max(2.4,size.length()*.65/Math.sin(halfFov));
   const position=camera.position.clone(),quaternion=camera.quaternion.clone();
   controls.enableDamping=false;controls.update();camera.position.copy(position);camera.quaternion.copy(quaternion);
   controls.minDistance=.6;
   focusTween={start:performance.now(),from:position,fromTarget:controls.target.clone(),target,to:target.clone().addScaledVector(direction,distance)};
  };
  const syncLook=()=>{const angles=new T.Euler().setFromQuaternion(camera.quaternion,'YXZ');yaw=angles.y;pitch=angles.x;};
  const fly=distance=>{camera.getWorldDirection(flightDirection);camera.position.addScaledVector(flightDirection,distance);};
  const flightDirection=new T.Vector3(),flightRight=new T.Vector3(),flightMotion=new T.Vector3();
  let freeEnabled=false;
  const configureCamera=()=>{const next=isFree();if(next!==freeEnabled){keys.clear();drag=null;if(next){const position=camera.position.clone(),quaternion=camera.quaternion.clone();controls.enableDamping=false;controls.update();camera.position.copy(position);camera.quaternion.copy(quaternion);syncLook();}else{controls.enableDamping=true;if(props.current.mode==='overview'){camera.getWorldDirection(flightDirection);controls.target.copy(camera.position).addScaledVector(flightDirection,10);controls.maxPolarAngle=Math.PI-.01;controls.update();}}freeEnabled=next;}controls.enabled=props.current.mode==='overview'&&!next;};
  const stopStairs=()=>{route=null;setFollowingStairs(false);};
  props.current.onDoors?.(model.doorSystem.snapshot());
  props.current.onFurniture?.(model.furnitureSystem.snapshot());
  const toggleDoor=id=>{const player=props.current.mode==='walk'?[camera.position.x,camera.position.z,feet]:null;
   if(model.doorSystem.toggle(id,player))props.current.onDoors?.(model.doorSystem.snapshot());
   else props.current.onNotice?.('Отойди немного от двери, чтобы она могла открыться или закрыться.');
  };
  const toggleFurniture=id=>{const player=props.current.mode==='walk'?[camera.position.x,camera.position.z,feet]:null;if(model.furnitureSystem.toggle(id,player))props.current.onFurniture?.(model.furnitureSystem.snapshot());else props.current.onNotice?.('Отойди немного, чтобы открыть или закрыть мебель.');};
  const ray=new T.Raycaster(),pointer=new T.Vector2();
  const overview=f=>{cancelFocus();keys.clear();camera.fov=44;camera.updateProjectionMatrix();controls.maxPolarAngle=Math.PI*.48;controls.enabled=true;const target=new T.Vector3(f===0?mirrorX(7):W/2,f===2?(LEVEL+2.7)/2:.7,f===0?6.2:D/2);const direction=new T.Vector3(-.72,1,-1).normalize();camera.position.copy(target).add(direction);camera.lookAt(target);camera.updateMatrixWorld();
   const right=new T.Vector3().setFromMatrixColumn(camera.matrixWorld,0),up=new T.Vector3().setFromMatrixColumn(camera.matrixWorld,1);
   const min=f===0?[mirrorX(16.5),-.2,-2.2]:[mirrorX(7.6),-.37,-.3],max=f===0?[mirrorX(-1.1),7.2,15]:[mirrorX(-.5),(f===2?LEVEL:0)+3,f===2?13.65:12.45];
   const tan=Math.tan(T.MathUtils.degToRad(camera.fov/2));let distance=1;
   for(const x of [min[0],max[0]])for(const y of [min[1],max[1]])for(const z of [min[2],max[2]]){const v=new T.Vector3(x,y,z).sub(target);const depth=v.dot(direction);distance=Math.max(distance,Math.abs(v.dot(right))/(tan*camera.aspect)+depth,Math.abs(v.dot(up))/tan+depth);}
   camera.position.copy(target).addScaledVector(direction,distance*1.17);controls.target.copy(target);controls.update();syncLook();controls.enabled=!isFree();};
  const enterRoom=id=>{cancelFocus();camera.fov=65;camera.updateProjectionMatrix();const r=roomById[id]||roomById['room-3'];let [x,y,z]=centerOf(r);if(id==='room-3'){x=.65;z=entrance.position[2];}if(id==='room-8'){x=mirrorX(3.1);z=6.4;}if(id==='room-2'){x=officeDoor.position[0];z=officeDoor.position[2]+.405;}if(id==='room-5'){x=mirrorX(HALL.livingOpening.at+HALL.livingOpening.width/2);z=LIVING.z1-.45;}if(id==='room-7'){x=mirrorX(4.7);z=9.45;}if(id==='room-4'){x=mirrorX(1.49);z=5.18;}if(id==='room-1'){x=mirrorX(1.70);z=9.3;}if(id==='room-9'){x=mirrorX(SHOWER.bounds[2]-.42);z=SHOWER.door.at+SHOWER.door.width/2;}if(id==='room-10'){x=mirrorX(CHILD.door.at+CHILD.door.width/2);z=CHILD.bounds[3]-.55;}if(id==='room-11'){x=mirrorX((CLOSET.bounds[0]+CLOSET.bounds[2])/2);z=CHILD.closetOpening.at+CHILD.closetOpening.width/2;}feet=y;camera.position.set(x,y+1.62,z);yaw=id==='room-10'?-.65:id==='room-9'?-Math.PI/2:id==='room-1'?Math.PI+.25:id==='room-4'?Math.PI:id==='room-7'?-Math.PI/2:id==='room-5'?-.65:id==='room-2'?Math.PI:id==='room-3'?-Math.PI/2:0;pitch=id==='room-4'?-.23:0;camera.rotation.order='YXZ';camera.rotation.set(pitch,yaw,0);keys.clear();};
  const blocked=(x,z,y)=>walkBlocked(model,x,z,y);
  const player=()=>({x:camera.position.x,z:camera.position.z,feet});
  const place=next=>{camera.position.x=next.x;camera.position.z=next.z;feet=next.feet;};
  const step=(dx,dz)=>place(moveWalker(player(),dx,dz,blocked));
  const startStairs=()=>{keys.clear();route=routeToFloor(player(),props.current.floor===2?1:2);setFollowingStairs(true);};
  const click=ev=>{if(dragged)return;const rect=renderer.domElement.getBoundingClientRect();pointer.set((ev.clientX-rect.left)/rect.width*2-1,-(ev.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(pointer,camera);const hit=pickSurface(ray,model.root);
   if(props.current.mode==='overview'){
    const room=roomForSurface(hit,props.current.floor);
    props.current.onRoom(room?.id??null,false);
    return;
   }
   if(hit){const data=hit.object.userData;if(data.doorId)toggleDoor(data.doorId);else if(data.furnitureId)toggleFurniture(data.furnitureId);else if(data.deviceId)props.current.onDevice(data.deviceId,data.channelId,true);else if(data.roomId)props.current.onRoom(data.roomId,false);}
  };
  const down=ev=>{cancelFocus();stopStairs();drag={x:ev.clientX,y:ev.clientY,lastX:ev.clientX,lastY:ev.clientY};dragged=false;renderer.domElement.focus({preventScroll:true});if(props.current.mode==='walk'||isFree())renderer.domElement.setPointerCapture(ev.pointerId);};
  const move=ev=>{if(!drag)return;if(Math.hypot(ev.clientX-drag.x,ev.clientY-drag.y)>5)dragged=true;if(props.current.mode==='walk'||isFree()){yaw-=(ev.clientX-drag.lastX)*.004;pitch=T.MathUtils.clamp(pitch-(ev.clientY-drag.lastY)*.004,-1.25,1.25);camera.rotation.set(pitch,yaw,0,'YXZ');}drag.lastX=ev.clientX;drag.lastY=ev.clientY;};
  const up=ev=>{click(ev);drag=null;};
  const kd=ev=>{if((props.current.mode!=='walk'&&!isFree())||/INPUT|SELECT|TEXTAREA/.test(ev.target.tagName)||document.querySelector('dialog[open]'))return;const code=ev.code;if(code==='Escape')stopStairs();if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight',...(isFree()?['KeyQ','KeyE','ShiftLeft','ShiftRight']:[])].includes(code)){ev.preventDefault();cancelFocus();stopStairs();keys.add(code);}};
  const ku=ev=>keys.delete(ev.code);const blur=()=>{keys.clear();stopStairs();};
  const resize=()=>{const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();if(props.current.mode==='overview'&&!isFree())overview(props.current.floor);};const ro=new ResizeObserver(resize);ro.observe(host);
  const wheel=ev=>{cancelFocus();if(isFree()){ev.preventDefault();fly(-Math.sign(ev.deltaY)*.8);}};
  renderer.domElement.addEventListener('wheel',wheel,{passive:false});
  renderer.domElement.addEventListener('pointerdown',down);renderer.domElement.addEventListener('pointermove',move);renderer.domElement.addEventListener('pointerup',up);renderer.domElement.addEventListener('pointercancel',()=>drag=null);window.addEventListener('keydown',kd);window.addEventListener('keyup',ku);window.addEventListener('blur',blur);
  engine.current={model,camera,focusDevice,overview,configureCamera,enterRoom,toggleDoor,toggleFurniture,startStairs,stopStairs,key:(k,p)=>{if(p){cancelFocus();stopStairs();keys.add(k);}else keys.delete(k);},zoom:n=>{cancelFocus();if(isFree()){fly(n>0?1:-1);return;}camera.position.sub(controls.target).multiplyScalar(n>0?.84:1.18).add(controls.target);controls.update();},select:id=>{if(selectedGlow){scene.remove(selectedGlow);selectedGlow.geometry.dispose();selectedGlow.material.dispose();selectedGlow=null;}const r=roomById[id];if(r&&r.id!=='room-8'){const [x,z,xx,zz]=r.bounds;const geo=new T.PlaneGeometry(xx-x-.08,zz-z-.08);selectedGlow=new T.Mesh(geo,new T.MeshBasicMaterial({color:'#789486',transparent:true,opacity:.16,depthWrite:false,side:T.DoubleSide}));selectedGlow.rotation.x=-Math.PI/2;selectedGlow.position.set((x+xx)/2,r.y+.008,(z+zz)/2);scene.add(selectedGlow);}},setMode:(m,f,id)=>{const selection=m==='overview'?`overview:${f}`:`${m}:${f}:${id}`;if(selection===viewSelection)return;viewSelection=selection;stopStairs();controls.enabled=m!=='walk';if(m==='walk')enterRoom(id);else overview(f);}};
  overview(props.current.floor);model.applyView(props.current.floor,props.current.mode);engine.current.select(props.current.roomId);
  const tick=now=>{if(disposed)return;const dt=Math.min((now-last)/1000,.05);last=now;
   model.doorSystem.update(dt);model.furnitureSystem.update(dt);
   if(focusTween&&props.current.mode==='overview'){
    const t=Math.min(1,(now-focusTween.start)/650),ease=t*t*(3-2*t);
    camera.position.lerpVectors(focusTween.from,focusTween.to,ease);
    controls.target.lerpVectors(focusTween.fromTarget,focusTween.target,ease);
    camera.lookAt(controls.target);syncLook();
    if(t===1)cancelFocus();
   }else if(props.current.mode==='walk'){
    const forward=Number(keys.has('KeyW')||keys.has('ArrowUp'))-Number(keys.has('KeyS')||keys.has('ArrowDown'));const right=Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft'));
    const len=Math.hypot(forward,right)||1;const dist=(feet>0&&feet<LEVEL?1.15:2)*dt/len;const dx=(-Math.sin(yaw)*forward+Math.cos(yaw)*right)*dist,dz=(-Math.cos(yaw)*forward-Math.sin(yaw)*right)*dist;
    if(dx||dz)step(dx,dz);
    if(route){
     const before=player(),result=followStairRoute(before,route,1.1*dt,blocked);place(result.state);
     const mx=result.state.x-before.x,mz=result.state.z-before.z;
     if(Math.hypot(mx,mz)>.0001){const target=Math.atan2(-mx,-mz);yaw+=Math.atan2(Math.sin(target-yaw),Math.cos(target-yaw))*(1-Math.exp(-8*dt));pitch+=(-.22-pitch)*(1-Math.exp(-5*dt));camera.rotation.set(pitch,yaw,0,'YXZ');}
     if(result.blocked){stopStairs();props.current.onNotice?.('Путь перекрыт. Отойди от препятствия и продолжи стрелками или снова нажми кнопку лестницы.');}
     else if(!route.length)stopStairs();
    }
    camera.position.y+=(feet+1.62-camera.position.y)*(1-Math.exp(-14*dt));
    const onStairs=feet>.01&&feet<LEVEL-.01;
    const r=roomAt(camera.position.x,camera.position.z,feet);
    const label=onStairs?'Лестница · между 1 и 2 этажами':r?`${r.floor} этаж · ${r.name}`:'Участок';if(label!==lastRoom){setLocation(label);lastRoom=label;}
    const canUseStairs=onStairs||r?.id==='room-3'||r?.id==='room-8';
    if(canUseStairs!==lastStairAvailable){lastStairAvailable=canUseStairs;setStairAvailable(canUseStairs);}
    const reachedFloor=feet>=LEVEL-.001?2:feet<.001?1:null;
    if(reachedFloor&&reachedFloor!==props.current.floor){const id=reachedFloor===2?'room-8':'room-3';viewSelection=`walk:${reachedFloor}:${id}`;props.current.onFloor?.(reachedFloor,id);}
   }else if(isFree()){
    const forward=Number(keys.has('KeyW')||keys.has('ArrowUp'))-Number(keys.has('KeyS')||keys.has('ArrowDown'));
    const right=Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft'));
    const vertical=Number(keys.has('KeyE'))-Number(keys.has('KeyQ'));
    camera.getWorldDirection(flightDirection);flightRight.set(1,0,0).applyQuaternion(camera.quaternion);
    flightMotion.copy(flightDirection).multiplyScalar(forward).addScaledVector(flightRight,right);flightMotion.y+=vertical;
    if(flightMotion.lengthSq())camera.position.addScaledVector(flightMotion.normalize(),dt*(keys.has('ShiftLeft')||keys.has('ShiftRight')?9:3));
   }else controls.update();
   const caption=host.parentElement.querySelector('.room-caption');const r=roomById[props.current.roomId];if(caption&&r){const p=new T.Vector3(...centerOf(r));p.y=r.y+1.6;p.project(camera);caption.style.left=`${(p.x*.5+.5)*host.clientWidth}px`;caption.style.top=`${(-p.y*.5+.5)*host.clientHeight}px`;caption.style.transform='translate(-50%,-50%)';caption.style.visibility=Math.abs(p.x)>1||Math.abs(p.y)>1||p.z< -1||p.z>1?'hidden':'visible';}
   renderer.domElement.dataset.position=[camera.position.x,feet,camera.position.z].map(v=>v.toFixed(3)).join(',');
   renderer.domElement.dataset.cameraPosition=camera.position.toArray().map(v=>v.toFixed(3)).join(',');
   renderer.domElement.dataset.cameraMode=isFree()?'free':props.current.mode;
   renderer.render(scene,camera);animation=requestAnimationFrame(tick);
  };animation=requestAnimationFrame(tick);resize();
  return()=>{disposed=true;cancelAnimationFrame(animation);ro.disconnect();window.removeEventListener('keydown',kd);window.removeEventListener('keyup',ku);window.removeEventListener('blur',blur);renderer.domElement.removeEventListener('wheel',wheel);controls.dispose();model.dispose();renderer.dispose();host.replaceChildren();engine.current=null;};
 },[]);
 useEffect(()=>{const e=engine.current;if(e){e.model.applyView(floor,mode);e.select(roomId);e.setMode(mode,floor,roomId);e.configureCamera();}},[floor,mode,roomId,freeCamera]);
 useEffect(()=>{engine.current?.focusDevice(deviceId);},[deviceId,floor,mode]);
 useEffect(()=>{engine.current?.model.setDeskLight(deskLight.on,deskLight.color,deskLight.brightness);},[deskLight]);
 useEffect(()=>{engine.current?.model.setSwitchStates(switchStates);},[switchStates]);
 return <div className="viewer" ref={mount}>{error&&<div className="scene-error">{error}</div>}{mode==='walk'&&<div className="walk-location">{location}<span>WASD / стрелки · Потяните мышью, чтобы осмотреться</span>{stairAvailable&&<button className="button stair-walk" onClick={()=>followingStairs?engine.current?.stopStairs():engine.current?.startStairs()}>{followingStairs?'Остановиться':floor===2?'Спуститься на 1 этаж':'Подняться на 2 этаж'}</button>}</div>}</div>;
});




