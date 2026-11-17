import React,{useEffect,useState} from 'react';
import {api} from '../ha/serverClient';
import {visibleReviews} from './wallMeasurement';
import {measurementStatus} from '../model/measurementComparison';
import {measurementTypes} from '../model/measurementExtent';

export const formatCm=n=>(n*100).toLocaleString('ru-RU',{maximumFractionDigits:1});

export function useMeasurementReviews(active,resolve){
 const [records,setRecords]=useState([]),[loading,setLoading]=useState(false),[error,setError]=useState(''),[version,setVersion]=useState(0);
 useEffect(()=>{
  if(!active)return;
  let cancelled=false;setLoading(true);setError('');
  api('/measurements').then(async data=>{
   if(cancelled)return;
   const current=resolve(data.measurements);setRecords(current);
   // Upgrade old snapshots only when both surfaces can be identified uniquely.
   const upgrades=current.filter((r,i)=>!r.unresolved&&data.measurements[i].surfaces.some(s=>!s.anchor));
   await Promise.all(upgrades.map(r=>api(`/measurements/${r.id}`,{method:'PUT',body:JSON.stringify(r)})));
  }).catch(e=>{if(!cancelled)setError(e.message);}).finally(()=>{if(!cancelled)setLoading(false);});
  return()=>{cancelled=true;};
 },[active,version,resolve]);
 return {records,loading,error,reload:()=>setVersion(v=>v+1),
  async save(record){const result=await api(`/measurements/${record.id}`,{method:'PUT',body:JSON.stringify(record)});setRecords(all=>[result.measurement,...all.filter(r=>r.id!==record.id)]);},
  async remove(id){await api(`/measurements/${id}`,{method:'DELETE'});setRecords(all=>all.filter(r=>r.id!==id));}
 };
}

function ReviewForm({draft,save,onSaved}){
 const [actual,setActual]=useState(Number.isFinite(draft.actualDistance)?String(Number((draft.actualDistance*100).toFixed(3))):''),[label,setLabel]=useState(draft.label),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const actualDistance=Number(actual.replace(',','.'))/100,valid=actual.trim()!==''&&Number.isFinite(actualDistance)&&actualDistance>0&&actualDistance<=1000;
 const matches=valid&&measurementStatus({...draft,actualDistance})==='correct';
 async function submit(event){
  event.preventDefault();setError('');
  if(!valid){setError('Укажите положительный размер в сантиметрах.');return;}
  setBusy(true);
  try{await save({...draft,label,actualDistance});onSaved();}catch(e){setError(e.message);}finally{setBusy(false);}
 }
 return <form onSubmit={submit} className="measurement-review-form">
  <p>{measurementTypes[draft.type||'distance']}</p>
  <p><strong>В модели: {formatCm(draft.distance)} см</strong></p>
  <label>Фактический размер, см<input required inputMode="decimal" value={actual} disabled={busy} onChange={e=>setActual(e.target.value)} placeholder="Например, 351"/></label>
  {valid&&<p role="status" className={matches?'measurement-match':'measurement-error'}>{matches?'Совпадает с моделью':'Отличается от модели — нужно исправить'}</p>}
  <label>Пометка<input value={label} maxLength={200} onChange={e=>setLabel(e.target.value)} placeholder="Например, ширина коридора"/></label>
  {error&&<p role="alert" className="measurement-error">{error}</p>}
  <button className="button" disabled={!valid||busy} type="submit">{busy?'Сохранение…':'Сохранить проверку'}</button>
 </form>;
}

export default function MeasurementReview({message,draft,reviews,showCorrect,onShowCorrect,floor,onReset,onEdit,measureType,onMeasureType}){
 const [notice,setNotice]=useState(''),[deleting,setDeleting]=useState(null);
 const visible=visibleReviews(reviews.records,{active:true,showCorrect,floor});
 useEffect(()=>{if(draft)setNotice('');},[draft]);
 async function remove(id){setDeleting(id);setNotice('');try{await reviews.remove(id);if(draft?.id===id)onReset();}catch(e){setNotice(e.message);}finally{setDeleting(null);}}
 return <div aria-label="Проверка замеров">
  <label className="measurement-type">Что измерить<select value={measureType} onChange={e=>onMeasureType(e.target.value)}>{Object.entries(measurementTypes).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
  <p role="status">{draft?'Проверьте размер и сохраните результат.':message}</p>
  {draft?<ReviewForm key={draft.id} draft={draft} save={reviews.save} onSaved={()=>{onReset();setNotice('Проверка сохранена. Геометрия дома не изменена.');}}/>:<p>{measureType==='distance'?'Выберите две параллельные поверхности стен, пола или потолка.':'Выберите один участок стены. Измеряется выделенный фрагмент между краями или проёмами, на полную высоту даже в обзоре со срезанными стенами.'}</p>}
  <button className="button" onClick={onReset}>Новый замер</button>
  <label className="measurement-checkbox"><input type="checkbox" checked={showCorrect} onChange={e=>onShowCorrect(e.target.checked)}/>Показывать верные замеры</label>
  <p className="measurement-legend"><span>Красный — нужно исправить.</span> <span>Зелёный — верный.</span></p>
  {notice&&<p role="status">{notice}</p>}
  {reviews.loading&&<p role="status">Загрузка сохранённых замеров…</p>}
  {reviews.error&&<div role="alert"><p className="measurement-error">{reviews.error}</p><button className="button" onClick={reviews.reload}>Повторить загрузку</button></div>}
  <details><summary>Сохранённые проверки ({visible.length})</summary>
   {!visible.length&&<p>Нет замеров для выбранного этажа и фильтра.</p>}
   <ul className="measurement-reviews">{visible.map(r=><li key={r.id} className={`measurement-${measurementStatus(r)}`}>
    <strong>{r.label||'Замер'} · {r.floor?r.floor+' этаж':'Участок'}</strong>
    <span>{measurementTypes[r.type||'distance']}</span>
    <span>{r.unresolved?'Последний размер в модели':'В модели'}: {formatCm(r.distance)} см · Фактически: {formatCm(r.actualDistance)} см</span>
    <span>{r.unresolved?'Поверхности изменились. Повторите замер.':measurementStatus(r)==='correct'?'Совпадает':'Нужно исправить'}</span>
    <div><button type="button" disabled={r.unresolved} onClick={()=>{onReset();onEdit(r);}}>Изменить</button><button type="button" disabled={deleting===r.id} onClick={()=>remove(r.id)}>Удалить</button></div>
   </li>)}</ul>
  </details>
 </div>;
}
