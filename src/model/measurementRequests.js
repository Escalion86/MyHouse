// Stable IDs keep observations attached to the question when geometry is corrected.
export const measurementRequests = [
 {id:'stair-wall-offset',number:1,floor:2,roomId:'room-8',title:'Уступ стены над лестницей',hint:'Ранее: 6 см, направление не указано.',instruction:'А — вертикаль поверхности стены гостиной со стороны коридора первого этажа. Б — поверхность стены детской/гардеробной со стороны коридора второго этажа. Измерьте горизонтальный уступ между этими вертикалями и укажите направление верхней стены.',direction:true,allowZero:true},
 {id:'stair-opening-gap',number:2,floor:2,roomId:'room-8',title:'Зазор от проёма до стены детской',hint:'Ранее: 6 см. Это отдельный размер от уступа стены.',instruction:'А — поверхность стены детской со стороны коридора. Б — ближайший край лестничного отверстия в полу второго этажа. Измерьте расстояние по полу перпендикулярно стене, без плинтуса.',allowZero:true},
 {id:'hall-width-entrance',number:3,floor:1,roomId:'room-3',title:'Ширина коридора у входа',hint:'Ранее: 370 см.',instruction:'Измерьте расстояние между стеной гостиной (А) и стеной кабинета (Б) рядом с входной дверью. От отделанной поверхности до поверхности, без плинтусов и наличников.'},
 {id:'hall-width-bathroom',number:4,floor:1,roomId:'room-3',title:'Ширина коридора у ванной',hint:'Сумма прежних отрезков: 367 см; у входа — 370 см.',instruction:'Измерьте полное расстояние между стеной гостиной (А) и стеной кабинета (Б) у противоположного конца коридора, рядом с ванной и шкафом. Нужен общий размер, а не сумма участков.'},
 {id:'bathroom-door-opening',number:5,floor:1,roomId:'room-3',title:'Проём двери ванной',hint:'Ранее: 70 см — полотно или проём, неизвестно.',instruction:'А и Б — боковые края проёма в стене для двери ванной. Нужна ширина проёма, не полотна и не наличников. Если края скрыты коробкой и измерить их нельзя, укажите в комментарии, что именно доступно; не разбирайте отделку.'},
 {id:'storey-floor-height',number:6,floor:2,roomId:'room-8',title:'Высота между этажами',hint:'В модели принято: 323 см; перекрытие 23 см не измерено.',instruction:'А — уровень чистового пола первого этажа. Б — уровень чистового пола второго этажа у лестницы. Нужна разница высот по вертикали, не длина лестницы и не высота до потолка.'},
 {id:'living-window-to-hall',number:7,floor:1,roomId:'room-5',title:'Гостиная: от уличных окон до коридора',hint:'Нужно перепроверить прежний размер 376 см.',instruction:'Замер внутри гостиной. А — внутренняя поверхность стены с двумя окнами на улицу, под детской. Б — внутренняя поверхность противоположной стены, за которой коридор и лестница. Измерьте расстояние по прямой перпендикулярно этим стенам: от отделки до отделки, без плинтуса. Не от стекла или подоконника. Синяя линия показывает направление замера.'},
 {id:'child-window-to-hall',number:8,floor:2,roomId:'room-10',title:'Детская: от окна до коридора',hint:'Нужно перепроверить прежний размер 351 см.',instruction:'Замер внутри детской. А — внутренняя поверхность стены с окном на улицу. Б — внутренняя поверхность противоположной стены с дверью в коридор. Измерьте расстояние по прямой перпендикулярно этим стенам: от отделки до отделки, без плинтуса. Не от стекла или подоконника. Синяя линия показывает направление замера.'}
];
export const offsetDirections = {'toward-hall':'Выступает в коридор','toward-child':'Отступает в детскую / гардеробную','flush':'Стены в одной плоскости'};

export function requestAnswer(input,id){
 const task=measurementRequests.find(item=>item.id===id);
 if(!task||!input||typeof input.comment!=='string'||input.comment.length>1000)return null;
 const value=input.actualCm;
 // A comment-only answer supports measurements hidden by existing finishes.
 if(value!==null&&(typeof value!=='number'||!Number.isFinite(value)||value>10000||value<(task.allowZero?0:.1)))return null;
 if(value===null&&!input.comment.trim())return null;
 if(task.direction&&value!==null&&(!Object.hasOwn(offsetDirections,input.direction)||(value===0)!==(input.direction==='flush')))return null;
 return {id,actualCm:value,direction:task.direction&&value!==null?input.direction:null,comment:input.comment.trim(),updatedAt:new Date().toISOString()};
}
