export class HomeAssistantClient {
 constructor({WebSocketImpl=globalThis.WebSocket,onStatus=()=>{},onStates=()=>{}}={}) {this.WS=WebSocketImpl;this.onStatus=onStatus;this.onStates=onStates;this.pending=new Map();this.states={};this.id=0;this.socket=null;this.ready=false;}
 async connect(address,token) {
  this.disconnect();const url=new URL(address);if(!['http:','https:'].includes(url.protocol))throw new Error('Укажите адрес http:// или https://');
  url.protocol=url.protocol==='https:'?'wss:':'ws:';url.pathname='/api/websocket';url.search='';url.hash='';
  if(!token.trim())throw new Error('Введите токен Home Assistant');
  this.onStatus('connecting');const socket=new this.WS(url.href);this.socket=socket;this.id=0;
  return new Promise((resolve,reject)=>{
   let settled=false;const fail=message=>{if(!settled){settled=true;clearTimeout(timer);this.cancelConnect=null;reject(new Error(message));}if(this.socket===socket){this.ready=false;this.onStatus('disconnected');}};
   const timer=setTimeout(()=>{fail('Home Assistant не ответил. Проверьте адрес и доступ к домашней сети.');socket.close();},12000);
   this.cancelConnect=()=>fail('Подключение отменено');
   socket.onopen=()=>{};
   socket.onerror=()=>{fail('Не удалось подключиться. Проверьте сеть, адрес и разрешение браузера на доступ к локальной сети.');socket.close();};
   socket.onclose=()=>{fail('Соединение с Home Assistant закрыто');if(this.socket===socket){this.rejectPending();this.states={};this.onStates({});}};
   socket.onmessage=async event=>{
    if(this.socket!==socket)return;let m;try{m=JSON.parse(event.data);}catch{return;}
    if(m.type==='auth_required'){socket.send(JSON.stringify({type:'auth',access_token:token.trim()}));token='';return;}
    if(m.type==='auth_invalid'){fail('Home Assistant отклонил токен');socket.close();return;}
    if(m.type==='auth_ok'){
     this.ready=true;
     try {
      // Subscribe before snapshot; queue events until snapshot is applied.
      this.buffer=[];
      await this.send({type:'subscribe_events',event_type:'state_changed'});
      const all=await this.send({type:'get_states'});
      if(this.socket!==socket)return;
      this.states=Object.fromEntries(all.map(s=>[s.entity_id,s]));
      for(const data of this.buffer)this.applyEvent(data,false);this.buffer=null;this.onStates({...this.states});
      if(!settled){settled=true;clearTimeout(timer);this.cancelConnect=null;this.onStatus('connected');resolve();}
     }catch(error){fail(error.message);socket.close();}return;
    }
    if(m.type==='result'){const p=this.pending.get(m.id);if(p){clearTimeout(p.timer);this.pending.delete(m.id);m.success?p.resolve(m.result):p.reject(new Error(m.error?.message||'Home Assistant отклонил команду'));}return;}
    if(m.type==='event'&&m.event?.event_type==='state_changed'){const data=m.event.data;if(this.buffer)this.buffer.push(data);else this.applyEvent(data);}
   };
  });
 }
 applyEvent(data,notify=true){if(!data?.entity_id)return;if(data.new_state)this.states[data.entity_id]=data.new_state;else delete this.states[data.entity_id];if(notify)this.onStates({...this.states});}
 send(message){if(!this.ready||this.socket?.readyState!==1)return Promise.reject(new Error('Home Assistant не подключён'));const id=++this.id;return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{this.pending.delete(id);reject(new Error('Время ожидания ответа истекло'));},10000);this.pending.set(id,{resolve,reject,timer});this.socket.send(JSON.stringify({id,...message}));});}
 service(entityId,service,data={}){const state=this.states[entityId];if(!state||['unavailable','unknown'].includes(state.state))return Promise.reject(new Error('Устройство недоступно'));const domain=entityId.split('.')[0];return this.send({type:'call_service',domain,service,target:{entity_id:entityId},service_data:data});}
 rejectPending(){for(const p of this.pending.values()){clearTimeout(p.timer);p.reject(new Error('Соединение закрыто'));}this.pending.clear();}
 disconnect(){this.cancelConnect?.();this.cancelConnect=null;if(this.socket){this.socket.onclose=null;this.socket.onerror=null;this.socket.onmessage=null;this.socket.close();this.socket=null;}this.ready=false;this.buffer=null;this.rejectPending();this.states={};this.onStates({});this.onStatus('disconnected');}
}
