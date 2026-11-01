import React,{useRef,useState} from 'react';
import {vacuumView,vacuumBattery} from './ha/vacuum';

export default function VacuumControl({entity,readings,connected,onCommand,onError}){
 const [pending,setPending]=useState(false),busy=useRef(false);
 const view=vacuumView(entity,connected),battery=vacuumBattery(entity,readings,connected);
 const run=async service=>{if(busy.current)return;busy.current=true;setPending(true);try{await onCommand(service);}catch(e){onError(e.message);}finally{busy.current=false;setPending(false);}};
 return <section className="vacuum-control" aria-label="Управление пылесосом">
  <div className="vacuum-readings" aria-live="polite"><strong>{view.label}</strong>{battery!==null&&<span>Заряд: {battery}%</span>}</div>
  <div className="vacuum-buttons">{view.actions.map(a=><button key={a.service} className={`button ${a.service==='start'?'primary':''}`} disabled={pending||!a.enabled} onClick={()=>run(a.service)}>{a.label}</button>)}</div>
  {pending&&<p role="status" className="muted">Отправка команды…</p>}
  {!entity&&<p className="muted">Выберите основную сущность пылесоса в настройке привязки ниже.</p>}
 </section>;
}
