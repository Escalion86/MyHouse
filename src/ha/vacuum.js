// VacuumEntityFeature values from Home Assistant's vacuum/const.py.
const actions=[['start',8192,'Начать уборку'],['pause',4,'Пауза'],['return_to_base',16,'На базу'],['stop',8,'Остановить']];
export const vacuumStateLabels={cleaning:'Убирает',docked:'На базе',idle:'Ожидает',paused:'На паузе',returning:'Возвращается на базу',error:'Ошибка',unavailable:'Недоступен',unknown:'Нет данных'};
export function vacuumView(entity,connected){
 const valid=entity?.entity_id?.startsWith('vacuum.'),state=valid?entity.state:null;
 const available=connected&&valid&&!['unknown','unavailable'].includes(state)&&Boolean(state);
 const flags=Number(entity?.attributes?.supported_features)||0;
 return {
  label:!connected?'Нет связи с Home Assistant':!valid?'Выберите сущность пылесоса':vacuumStateLabels[state]||state,
  actions:actions.map(([service,feature,label])=>({service,label:service==='start'&&state==='paused'?'Продолжить уборку':label,
   enabled:Boolean(available&&(flags&feature)&&!(service==='start'&&state==='cleaning')&&!(service==='pause'&&!['cleaning','returning'].includes(state))&&!(service==='return_to_base'&&['docked','returning'].includes(state)))}))
 };
}
export function vacuumCommand(entity,connected,service){
 return vacuumView(entity,connected).actions.some(a=>a.service===service&&a.enabled)?{entityId:entity.entity_id,service}:null;
}
export function vacuumBattery(entity,readings,connected){
 if(!connected||!entity?.entity_id?.startsWith('vacuum.')||['unknown','unavailable'].includes(entity.state))return null;
 const value=entity.attributes?.battery_level??readings.find(s=>s?.attributes?.device_class==='battery'&&s.attributes.unit_of_measurement==='%'&&!['unknown','unavailable'].includes(s.state))?.state;
 if(value==null||value==='')return null;const n=Number(value);return Number.isFinite(n)&&n>=0&&n<=100?n:null;
}
