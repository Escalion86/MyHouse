// Compare at the same millimetre precision shown in the UI (0.1 cm).
export function measurementStatus(record){
 if(record.unresolved||!Number.isFinite(record.distance)||!Number.isFinite(record.actualDistance))return 'unresolved';
 return Math.round(record.distance*1000)===Math.round(record.actualDistance*1000)?'correct':'incorrect';
}
