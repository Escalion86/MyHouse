import React from 'react';
import './RoomMetrics.css';

export const formatMetric=value=>value.toLocaleString('ru-RU',{minimumFractionDigits:2,maximumFractionDigits:2});
const roomLabel=room=>room.enclosed?room.name:'Балкон (мансарда)';

export function RoomMetricSummary({room,onOpen}) {
 return <section className="room-metric-summary" aria-label="Расчёт выбранного помещения">
  {room&&<><h3>{roomLabel(room)}</h3><dl>
   <div><dt>Площадь пола</dt><dd>{formatMetric(room.areaM2)} м²</dd></div>
   <div><dt>Объём</dt><dd>{room.volumeM3===null?'Открытый балкон':`${formatMetric(room.volumeM3)} м³`}</dd></div>
  </dl></>}
  <button className="button full" onClick={onOpen}>Площади и объёмы всех помещений</button>
 </section>;
}

export default function RoomMetrics({report}) {
 return <div className="room-metrics">
  <p>По текущей геометрии дома. Пересчитывается при изменении размеров модели.</p>
  <div className="metric-totals">
   <div><span>Закрытые помещения</span><strong>{formatMetric(report.totals.enclosedAreaM2)} м²</strong></div>
   <div><span>Их объём</span><strong>{formatMetric(report.totals.enclosedVolumeM3)} м³</strong></div>
   <div><span>Открытый балкон</span><strong>{formatMetric(report.totals.outdoorAreaM2)} м²</strong></div>
  </div>
  {report.floors.map(floor=><section key={floor.floor}>
   <h3>{floor.floor} этаж</h3>
   <div className="metric-table-scroll" tabIndex={0} role="region" aria-label={`Размеры помещений ${floor.floor} этажа`}>
    <table><caption className="metric-caption">Площадь пола, высота потолка и объём</caption>
     <thead><tr><th scope="col">Помещение</th><th scope="col">Площадь, м²</th><th scope="col" className="metric-height">Высота, м</th><th scope="col">Объём, м³</th></tr></thead>
     <tbody>{report.rooms.filter(r=>r.floor===floor.floor).map(room=><tr key={room.id}>
      <th scope="row">{roomLabel(room)}{room.ceilingHeightM!==null&&<small className="metric-mobile-height">Потолок {formatMetric(room.ceilingHeightM)} м</small>}{room.stairOpeningAreaM2>0&&<small>Без проёма {formatMetric(room.stairOpeningAreaM2)} м²</small>}</th>
      <td>{formatMetric(room.areaM2)}</td><td className="metric-height">{room.ceilingHeightM===null?'—':formatMetric(room.ceilingHeightM)}</td><td>{room.volumeM3===null?'—':formatMetric(room.volumeM3)}</td>
     </tr>)}</tbody>
     <tfoot><tr><th scope="row">Закрытые помещения</th><td>{formatMetric(floor.enclosedAreaM2)}</td><td className="metric-height">—</td><td>{formatMetric(floor.enclosedVolumeM3)}</td></tr></tfoot>
    </table>
   </div>
  </section>)}
  <details className="metric-method"><summary>Как считаются значения</summary>
   <p>Площадь — внутри стен по полу. На втором этаже лестничный проём вычтен из площади коридора. Перегородки и наружные стены в площадь комнат не входят.</p>
   <p>Объём — пространство до отделанного потолка, без вычитания мебели и ступеней. Нижняя часть лестничного пространства относится к первому этажу до отметки пола второго этажа; воздух над проёмом — ко второму. Балкон не входит в объём закрытых помещений.</p>
   <p>На первом этаже учтены потолки 2,88 м, в ванной 3,00 м, в котельной 2,60 м. На втором этаже используется высота модели 2,70 м, пока не подтверждённая замером.</p>
   <p>Это данные модели, в которой ещё есть непроверенные размеры, а не готовый расчёт вентиляции или теплопотерь. Сохранённые ответы на замеры изменят эти цифры после внесения соответствующих правок в геометрию.</p>
  </details>
 </div>;
}
