import test from 'node:test';
import assert from 'node:assert/strict';
import {HomeAssistantClient} from '../src/ha/client.js';

const entity=(state='off')=>({entity_id:'light.desk',state,attributes:{friendly_name:'Стол'}});
class FakeSocket {
 static instances=[];
 constructor(url){this.url=url;this.readyState=1;this.messages=[];FakeSocket.instances.push(this);queueMicrotask(()=>this.emit({type:'auth_required'}));}
 emit(data){this.onmessage?.({data:JSON.stringify(data)});}
 send(raw){const m=JSON.parse(raw);this.messages.push(m);queueMicrotask(()=>{
  if(m.type==='auth')this.emit({type:'auth_ok'});
  else if(m.type==='subscribe_events')this.emit({type:'result',id:m.id,success:true,result:null});
  else if(m.type==='get_states'){
   this.change(entity('on'));
   this.emit({type:'result',id:m.id,success:true,result:[entity()]});
  }else this.emit({type:'result',id:m.id,success:true,result:null});
 });}
 change(new_state){this.emit({type:'event',event:{event_type:'state_changed',data:{entity_id:'light.desk',new_state}}});}
 close(){if(this.readyState===3)return;this.readyState=3;this.onclose?.();}
}
test('HA: подписка до снимка, события не теряются, управление только по запросу',async()=>{
 let status;const c=new HomeAssistantClient({WebSocketImpl:FakeSocket,onStatus:s=>status=s});
 await c.connect('http://192.168.1.232:8123','test-only-token');const socket=FakeSocket.instances.at(-1);
 assert.equal(socket.url,'ws://192.168.1.232:8123/api/websocket');assert.equal(status,'connected');
 assert.equal(c.states['light.desk'].state,'on');
 assert.deepEqual(socket.messages.map(m=>m.type),['auth','subscribe_events','get_states']);
 await c.service('light.desk','turn_off');
 assert.equal(c.states['light.desk'].state,'on','Состояние не подменяется отправленной командой');
 assert.deepEqual(socket.messages.at(-1).target,{entity_id:'light.desk'});
 socket.change(entity('off'));assert.equal(c.states['light.desk'].state,'off');
 socket.change(entity('unavailable'));await assert.rejects(c.service('light.desk','turn_on'),/недоступно/);
 socket.change(null);assert.equal(c.states['light.desk'],undefined);
 socket.close();assert.equal(status,'disconnected');assert.deepEqual(c.states,{});c.disconnect();
});
test('HA: отмена подключения завершает ожидание и не сохраняет соединение',async()=>{
 class SilentSocket extends FakeSocket{emit(){}}
 const c=new HomeAssistantClient({WebSocketImpl:SilentSocket});const connecting=c.connect('http://10.10.0.2:8123','test');
 c.disconnect();await assert.rejects(connecting,/отменено/);assert.equal(c.socket,null);assert.equal(c.ready,false);
});
test('HA: протокол и пустой токен проверяются до соединения',async()=>{
 const c=new HomeAssistantClient({WebSocketImpl:FakeSocket});
 await assert.rejects(c.connect('file:///tmp','test'),/http/);await assert.rejects(c.connect('http://localhost:8123',' '),/токен/);
});
