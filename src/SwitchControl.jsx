import React,{useRef,useState} from 'react';
import {getSwitchCommand,switchStateLabels} from './ha/switchStates';

export default function SwitchControl({device,powerStates,mappings,states,connected,onToggle,onError}){
 const inFlight=useRef(new Set()),[pending,setPending]=useState({});
 const press=async channel=>{
  if(inFlight.current.has(channel.id)||!getSwitchCommand(device.id,channel.id,mappings,states,connected))return;
  inFlight.current.add(channel.id);setPending(p=>({...p,[channel.id]:true}));
  try{await onToggle(device.id,channel.id);}catch(e){onError(e.message);}
  finally{inFlight.current.delete(channel.id);setPending(p=>({...p,[channel.id]:false}));}
 };
 return <section className="wall-switch-control" aria-label="Управление выключателем">
  <p className="muted switch-hint">Нажми на клавишу, чтобы переключить свет.</p>
  <div className="wall-switch-frame" style={{'--key-count':device.channels.length}}>
   {device.channels.map((channel,i)=>{
    const state=powerStates[`${device.id}:${channel.id}`]||'disconnected',waiting=!!pending[channel.id];
    const command=getSwitchCommand(device.id,channel.id,mappings,states,connected);
    return <button key={channel.id} type="button" className={`wall-switch-key ${state}`} disabled={!command||waiting}
     aria-label={`Клавиша ${i+1}: ${channel.label}`} aria-pressed={state==='on'} aria-busy={waiting}
     title={command?(state==='on'?'Выключить':'Включить'):switchStateLabels[state]} onClick={()=>press(channel)}>
     <span className="rocker-number">{i+1}</span><span className="rocker-label">{channel.label}</span>
     <span className="rocker-indicator" aria-hidden="true"/><span className="rocker-state" aria-live="polite">{waiting?'Отправка…':switchStateLabels[state]}</span>
    </button>;
   })}
  </div>
 </section>;
}
