import test from 'node:test';
import assert from 'node:assert/strict';
import {getSwitchStates,getSwitchCommand} from '../src/ha/switchStates.js';
const devices=[{id:'double',channels:[{id:'a'},{id:'b'}]}];

test('Нажатие управляет основной сущностью именно нажатой клавиши',()=>{
 const mappings={'double:a':['light.a','sensor.extra'],'double:b':['switch.b']};
 const states={'light.a':{state:'on'},'switch.b':{state:'off'}};
 assert.deepEqual(getSwitchCommand('double','a',mappings,states,true),{entityId:'light.a',service:'turn_off'});
 assert.deepEqual(getSwitchCommand('double','b',mappings,states,true),{entityId:'switch.b',service:'turn_on'});
 assert.equal(getSwitchCommand('double','a',mappings,states,false),null);
 assert.equal(getSwitchCommand('double','missing',mappings,states,true),null);
 for(const state of ['unknown','unavailable',undefined])assert.equal(getSwitchCommand('double','a',mappings,{'light.a':{state}},true),null);
 assert.equal(getSwitchCommand('double','a',{'double:a':['sensor.extra']},{'sensor.extra':{state:'on'}},true),null);
});
test('Индикация каждой клавиши следует основной сущности, дополнительные датчики не влияют',()=>{
 const mappings={'double:a':['light.a','sensor.a'],'double:b':['switch.b']};
 const states={'light.a':{state:'on'},'sensor.a':{state:'off'},'switch.b':{state:'off'}};
 assert.deepEqual(getSwitchStates(devices,mappings,states,true),{'double:a':'on','double:b':'off'});
 states['light.a'].state='off';states['switch.b'].state='on';
 assert.deepEqual(getSwitchStates(devices,mappings,states,true),{'double:a':'off','double:b':'on'});
 assert.deepEqual(getSwitchStates(devices,mappings,states,false),{'double:a':'disconnected','double:b':'disconnected'});
});
test('Неизвестное состояние и отсутствие привязки не отображаются как выключение',()=>{
 const mappings={'double:a':['light.a']};
 for(const value of ['unknown','unavailable','23',undefined]){
  const result=getSwitchStates(devices,mappings,{'light.a':{state:value}},true);
  assert.equal(result['double:a'],value==='unavailable'?'unavailable':'unknown');assert.equal(result['double:b'],'unmapped');
 }
 assert.equal(getSwitchStates(devices,mappings,{},true)['double:a'],'unknown');
});
