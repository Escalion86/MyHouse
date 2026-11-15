import React, {useId, useState} from 'react';
import './EntityPicker.css';

const entityLabel = entity => entity.attributes?.friendly_name
  ? `${entity.attributes.friendly_name} · ${entity.entity_id}`
  : entity.entity_id;

export default function EntityPicker({entities, value, onChange, label, ariaLabel, placeholder}) {
  const [query, setQuery] = useState('');
  const id = useId();
  const words = query.trim().toLocaleLowerCase('ru').split(/\s+/).filter(Boolean);
  const matches = entities.filter(entity => {
    const text = entityLabel(entity).toLocaleLowerCase('ru');
    return words.every(word => text.includes(word));
  });
  // Keep the controlled selection even when it falls outside the search results.
  const hiddenSelection = value && !matches.some(entity => entity.entity_id === value);
  const selected = hiddenSelection && entities.find(entity => entity.entity_id === value);

  return <div className="entity-picker">
    <label htmlFor={`${id}-search`}>Поиск · {label.toLocaleLowerCase('ru')}</label>
    <input id={`${id}-search`} type="search" placeholder="Название или ID устройства"
      autoComplete="off" value={query} onChange={event => setQuery(event.target.value)}
      aria-describedby={`${id}-results`}/>
    <span id={`${id}-results`} className="muted" role="status">
      {matches.length ? `Найдено: ${matches.length}` : 'Ничего не найдено. Измените запрос.'}
    </span>
    <label htmlFor={`${id}-select`}>{label}</label>
    <select id={`${id}-select`} aria-label={ariaLabel} value={value}
      onChange={event => onChange(event.target.value)}>
      <option value="">{placeholder}</option>
      {hiddenSelection && <optgroup label="Текущая привязка">
        <option value={value}>{selected ? entityLabel(selected) : value}</option>
      </optgroup>}
      {matches.map(entity => <option key={entity.entity_id} value={entity.entity_id}>{entityLabel(entity)}</option>)}
    </select>
  </div>;
}
