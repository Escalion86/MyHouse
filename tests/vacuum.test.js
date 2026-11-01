import test from 'node:test';
import assert from 'node:assert/strict';
import {vacuumView,vacuumCommand,vacuumBattery} from '../src/ha/vacuum.js';
import {HomeAssistantClient} from '../src/ha/client.js';

const entity=(state='docked',features=8220)=>({entity_id:'vacuum.xiaomi_s20',state,attributes:{supported_features:features}});
test('Пылесос: команды соответствуют текущему состоянию и возможностям HA',()=>{
 assert.deepEqual(vacuumCommand(entity(),true,'start'),{entityId:'vacuum.xiaomi_s20',service:'start'});
 assert.equal(vacuumCommand(entity(),true,'return_to_base'),null);
 assert.equal(vacuumCommand(entity('cleaning'),true,'start'),null);
 assert.ok(vacuumCommand(entity('cleaning'),true,'pause'));
 assert.ok(vacuumCommand(entity('paused'),true,'return_to_base'));
 assert.equal(vacuumView(entity('paused'),true).actions[0].label,'Продолжить уборку');
 assert.equal(vacuumCommand(entity('cleaning',8192),true,'pause'),null);
 for(const e of [undefined,entity('unavailable'),entity('unknown'),{...entity(),entity_id:'switch.other'}])assert.equal(vacuumCommand(e,true,'start'),null);
 assert.equal(vacuumCommand(entity(),false,'start'),null);
 assert.equal(vacuumCommand(entity(),true,'toggle'),null);
});
test('Пылесос: заряд 0% сохраняется; отдельный датчик используется только из привязанных показаний',()=>{
 const e=entity(),sensor={state:'78',attributes:{device_class:'battery',unit_of_measurement:'%'}};
 assert.equal(vacuumBattery(e,[sensor],true),78);
 e.attributes.battery_level=0;assert.equal(vacuumBattery(e,[sensor],true),0);
 assert.equal(vacuumBattery(e,[sensor],false),null);
 delete e.attributes.battery_level;
 assert.equal(vacuumBattery(e,[],true),null);
 assert.equal(vacuumBattery(e,[{...sensor,state:'unavailable'}],true),null);
 assert.equal(vacuumBattery(e,[{...sensor,state:'150'}],true),null);
});
test('Команда уборки адресована только выбранной сущности vacuum',async()=>{
 const client=new HomeAssistantClient();client.states={'vacuum.xiaomi_s20':entity()};
 const sent=[];client.send=async m=>sent.push(m);
 assert.equal(sent.length,0);
 const cmd=vacuumCommand(client.states['vacuum.xiaomi_s20'],true,'start');
 await client.service(cmd.entityId,cmd.service);
 assert.deepEqual(sent,[{type:'call_service',domain:'vacuum',service:'start',target:{entity_id:'vacuum.xiaomi_s20'},service_data:{}}]);
});
