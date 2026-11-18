import {cents} from './money.js';
function exactSourceCents(value){const match=String(value).match(/^([+-]?)(?:(\d+)(?:\.(\d{1,2}))?|\.(\d{1,2}))$/);if(!match)throw Error('Amount must be a number with no more than two decimals.');const units=BigInt(match[2]||'0')*100n+BigInt((match[3]||match[4]||'').padEnd(2,'0'));return match[1]==='-'?-units:units;}
function moneyValue(value){if(!['number','string'].includes(typeof value))throw Error('Amount is required.');if(typeof value==='number'&&!Number.isFinite(value))throw Error('Amount must be finite.');const exact=exactSourceCents(value),converted=cents(value),serialized=String(converted/100);if(BigInt(converted)!==exact||exactSourceCents(serialized)!==exact)throw Error('Amount cannot be represented without losing source cents.');return serialized;}
const FIELDS=['month','category','amount','reference','note','personId'];
const REQUIRED=['month','category','amount','reference'];
const fail=message=>{throw Error('Workbook mapping: '+message)};
function monthValue(cell,policy,dateSystem){
 const value=cell?.value;if(value===undefined||value===null||value==='')throw Error('Month is required.');
 if(policy==='excel-serial'){
  if(typeof value!=='number'||!Number.isSafeInteger(value)||value<0||value>2958465)throw Error('Use a whole Excel date serial.');
  if(dateSystem==='1900'&&value===60)throw Error('Excel serial 60 is not a real calendar date.');
  const origin=dateSystem==='1904'?Date.UTC(1904,0,1):Date.UTC(1899,11,31),days=value-(dateSystem==='1900'&&value>60?1:0),date=new Date(origin+days*86400000);
  if(date.getUTCFullYear()<1900||date.getUTCFullYear()>9999)throw Error('Date is outside supported years.');return date.toISOString().slice(0,7);
 }
 if(typeof value!=='string')throw Error('Choose an Excel date policy for numeric dates.');
 if(policy==='month-text'){if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(value)||Number(value.slice(0,4))<1900)throw Error('Use YYYY-MM month text.');return value;}
 const match=policy==='mm-dd-yyyy'?value.match(/^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/(\d{4})$/):value.match(/^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/);
 if(!match)throw Error(policy==='mm-dd-yyyy'?'Use MM/DD/YYYY date text.':'Use YYYY-MM-DD date text.');
 const [year,month,day]=policy==='mm-dd-yyyy'?[+match[3],+match[1],+match[2]]:[+match[1],+match[2],+match[3]],date=new Date(Date.UTC(year,month-1,day));
 if(year<1900||year>9999||date.getUTCFullYear()!==year||date.getUTCMonth()!==month-1||date.getUTCDate()!==day)throw Error('Date is not a real calendar date.');return `${year}-${String(month).padStart(2,'0')}`;
}
export function mapWorkbookSheet(workbook,{sheetName,headerRow,columns,datePolicy='month-text',categories}={}){
 if(workbook?.format!=='xlsx'||!['1900','1904'].includes(workbook.dateSystem)||!Array.isArray(workbook.sheets))fail('inspect the workbook first.');
 if(!['month-text','iso-date','mm-dd-yyyy','excel-serial'].includes(datePolicy))fail('choose an explicit date policy.');
 const matches=workbook.sheets.filter(s=>s.name===sheetName);if(matches.length!==1)fail('choose one worksheet.');
 if(!Number.isSafeInteger(headerRow)||headerRow<1||headerRow>10000)fail('choose a valid header row.');
 if(!columns||typeof columns!=='object'||Array.isArray(columns)||Object.keys(columns).some(k=>!FIELDS.includes(k)))fail('unsupported column mapping.');
 const selected=Object.entries(columns).filter(([,v])=>v!==null&&v!==undefined);if(REQUIRED.some(k=>!selected.some(([field])=>field===k))||selected.some(([,v])=>!Number.isSafeInteger(v)||v<1||v>100)||new Set(selected.map(([,v])=>v)).size!==selected.length)fail('map each required field to a distinct column.');
 if(!Array.isArray(categories)||!categories.length||categories.some(c=>typeof c!=='string'||!c))fail('explicit supported categories are required.');
 const sheet=matches[0],grouped=new Map();for(const cell of sheet.cells){if(cell.row<=headerRow)continue;const row=grouped.get(cell.row)||[];row.push({...cell});grouped.set(cell.row,row);}
 const rows=[...grouped].sort(([a],[b])=>a-b).map(([worksheetRow,cells])=>{
  const byColumn=new Map(cells.map(cell=>[cell.column,cell])),record={},errors=[];
  for(const [field,column] of selected){const cell=byColumn.get(column);try{
   if(field==='month')record.month=monthValue(cell,datePolicy,workbook.dateSystem);
   else if(field==='amount')record.amount=moneyValue(cell?.value);
   else {const v=cell?.value;if(v===undefined||v===null){record[field]='';if(REQUIRED.includes(field))throw Error(field+' is required.');}else if(typeof v!=='string')throw Error(field+' must be text; numeric identifiers are not padded automatically.');else {record[field]=v;if(REQUIRED.includes(field)&&!v.trim())throw Error(field+' is required.');}}
  }catch(error){errors.push({field,column,message:error.message});}}
  if(record.category&&!categories.includes(record.category))errors.push({field:'category',column:columns.category,message:'Choose a supported budget category.'});
  return {worksheetRow,cells,record,errors};
 });
 if(!rows.length)fail('worksheet has no data rows after the selected header.');
 return {mappingVersion:'worksheet-transactions-v1',sheetName,headerRow,columns:{...columns},datePolicy,dateSystem:workbook.dateSystem,rows,canReview:rows.every(row=>!row.errors.length)};
}
