export const switchStateLabels={on:'Включён',off:'Выключен',unmapped:'Не привязан',disconnected:'Нет связи',unavailable:'Недоступен',unknown:'Нет данных'};

export function getSwitchCommand(deviceId,channelId,mappings,states,connected){
 const entityId=mappings[`${deviceId}:${channelId}`]?.[0],state=states[entityId]?.state;
 if(!connected||!['light','switch','input_boolean'].includes(entityId?.split('.')[0])||!['on','off'].includes(state))return null;
 return {entityId,service:state==='on'?'turn_off':'turn_on'};
}

// Only the primary mapped entity determines a rocker state. Sensors attached
// as additional readings must never turn an unconfirmed channel green.
export function getSwitchStates(devices,mappings,states,connected){
 return Object.fromEntries(devices.flatMap(d=>(d.channels||[]).map(c=>{
  const key=`${d.id}:${c.id}`,entityId=mappings[key]?.[0],value=states[entityId]?.state;
  const state=!connected?'disconnected':!entityId?'unmapped':value==='on'||value==='off'||value==='unavailable'?value:'unknown';
  return [key,state];
 })));
}
