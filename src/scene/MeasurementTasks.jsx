import React,{useEffect,useState} from 'react';
import {api} from '../ha/serverClient';
import {measurementRequests,offsetDirections,requestAnswer} from '../model/measurementRequests';

function AnswerForm({task,answer,onSave}){
 const [actual,setActual]=useState(answer?.actualCm==null?'':String(answer.actualCm));
 const [direction,setDirection]=useState(answer?.direction||'');
 const [comment,setComment]=useState(answer?.comment||'');
 const [busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const data={actualCm:actual.trim()===''?null:Number(actual.replace(',','.')),direction,comment};
 const valid=!!requestAnswer(data,task.id);
 async function submit(event){event.preventDefault();if(!valid)return;setBusy(true);setMessage('');try{await onSave(data);setMessage('Ответ сохранён на сервере. Геометрия не изменена.');}catch(error){setMessage(error.message);}finally{setBusy(false);}}
 return <form className="measurement-review-form" onSubmit={submit}>
  <label>Фактический размер, см<input inputMode="decimal" placeholder="Введите свой замер" value={actual} disabled={busy} onChange={e=>{setActual(e.target.value);setMessage('');}}/></label>
  {task.direction&&<label>Куда смещена верхняя стена<select value={direction} disabled={busy} onChange={e=>{setDirection(e.target.value);setMessage('');}}><option value="">Выберите направление</option>{Object.entries(offsetDirections).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>}
  <label>Комментарий<textarea rows={3} maxLength={1000} value={comment} disabled={busy} placeholder="Если измерить нельзя — объясните здесь" onChange={e=>{setComment(e.target.value);setMessage('');}}/></label>
  <p>Можно оставить только комментарий, если размер пока недоступен.</p>
  {actual.trim()&&!valid&&<p className="measurement-error">Проверьте размер{task.direction?' и направление (для нулевого уступа — «Стены в одной плоскости»)':''}.</p>}
  <button className="button" disabled={!valid||busy}>{busy?'Сохранение…':'Сохранить ответ'}</button>
  {message&&<p role="status">{message}</p>}
 </form>;
}

export default function MeasurementTasks({selected,onSelect}){
 const [answers,setAnswers]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[version,setVersion]=useState(0);
 useEffect(()=>{let cancelled=false;setLoading(true);setError('');api('/measurement-requests').then(data=>{if(!cancelled)setAnswers(data.answers);}).catch(e=>{if(!cancelled)setError(e.message);}).finally(()=>{if(!cancelled)setLoading(false);});return()=>{cancelled=true;};},[version]);
 const task=measurementRequests.find(t=>t.id===selected),answer=answers.find(a=>a.id===selected);
 return <section aria-label="Нужные замеры">
  <p>Уточняем лестницу и привязку этажей. Ответы с размером: {answers.filter(a=>a.actualCm!==null).length} из {measurementRequests.length}.</p>
  {task?<div className="measurement-type"><label>Нужный замер<select value={task.id} onChange={e=>onSelect(measurementRequests.find(t=>t.id===e.target.value))}>{measurementRequests.map(t=><option key={t.id} value={t.id}>{t.number}. {t.title}{answers.some(a=>a.id===t.id)?' · Есть ответ':''}</option>)}</select></label><button className="button" onClick={()=>onSelect(task)}>Показать ориентиры А и Б</button></div>:<ol className="measurement-task-list">{measurementRequests.map(t=><li key={t.id}><button className="button" onClick={()=>onSelect(t)}>{t.number}. {t.title}<small>{t.floor} этаж · {answers.some(a=>a.id===t.id)?'Есть ответ':'Нужно уточнить'}</small></button></li>)}</ol>}
  {loading&&<p role="status">Загрузка ответов…</p>}
  {error&&<div role="alert"><p>{error}</p><button className="button" onClick={()=>setVersion(v=>v+1)}>Повторить загрузку</button></div>}
  {task&&<><h3>{task.number}. {task.title}</h3><p>{task.hint}</p><p>{task.instruction}</p><p className="muted">Синие А и Б — ориентиры в текущей модели, видны сквозь стены. Прежние значения не считаются подтверждёнными.</p>
   {!loading&&!error&&<AnswerForm key={task.id} task={task} answer={answer} onSave={async data=>{const result=await api(`/measurement-requests/${task.id}`,{method:'PUT',body:JSON.stringify(data)});setAnswers(all=>[result.answer,...all.filter(a=>a.id!==task.id)]);}}/>}
  </>}
 </section>;
}
