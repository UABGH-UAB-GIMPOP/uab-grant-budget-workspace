/** Format an ISO calendar date or timestamp as an unambiguous US date. */
export function formatDateUS(value){
 if(typeof value!=='string'||!value.trim())return '—';
 const input=value.trim();let day;
 if(/^\d{4}-\d{2}-\d{2}$/.test(input))day=input;
 else{const timestamp=new Date(input);if(!Number.isFinite(timestamp.getTime()))return 'Date unavailable';day=[timestamp.getFullYear(),String(timestamp.getMonth()+1).padStart(2,'0'),String(timestamp.getDate()).padStart(2,'0')].join('-')}
 const parsed=new Date(day+'T00:00:00.000Z');
 if(!Number.isFinite(parsed.getTime())||parsed.toISOString().slice(0,10)!==day)return 'Date unavailable';
 return day.slice(5,7)+'/'+day.slice(8,10)+'/'+day.slice(0,4);
}
