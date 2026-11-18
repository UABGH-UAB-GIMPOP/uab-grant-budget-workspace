import {mapWorkbookSheet} from './workbook-mapping.js';
import {csvRecords} from './csv.js';
const HEADERS=['month','category','amount','reference','note','personId'];
export function worksheetCsv(mapping){if(!mapping?.canReview||!mapping.rows?.length)throw Error('Resolve worksheet mapping errors before row review.');const quote=value=>'"'+String(value??'').replaceAll('"','""')+'"';return [HEADERS,...mapping.rows.map(row=>HEADERS.map(field=>row.record[field]??''))].map(row=>row.map(quote).join(',')).join('\r\n');}
export function workbookSource(mapping,{fileName,fileHash,byteLength}){
 return {kind:'xlsx',fileName,fileHash,byteLength,mappingVersion:mapping.mappingVersion,sheetName:mapping.sheetName,headerRow:mapping.headerRow,columns:{...mapping.columns},datePolicy:mapping.datePolicy,dateSystem:mapping.dateSystem,rows:mapping.rows.map((row,index)=>({csvRowNumber:index+2,worksheetRow:row.worksheetRow,cells:row.cells.map(cell=>({...cell}))}))};
}
export function validateWorkbookSource(source,csv){
 if(source===undefined)return true;
 const fail=()=>{throw Error('Invalid workbook source provenance.');};
 if(!source||source.kind!=='xlsx'||source.mappingVersion!=='worksheet-transactions-v1'||typeof source.fileName!=='string'||!source.fileName||source.fileName.length>255||/[\\/\x00-\x1f\x7f]/.test(source.fileName)||!source.fileName.toLowerCase().endsWith('.xlsx')||!/^[a-f0-9]{64}$/.test(source.fileHash)||!Number.isSafeInteger(source.byteLength)||source.byteLength<1||source.byteLength>10*1024*1024||typeof source.sheetName!=='string'||!source.sheetName||source.sheetName.length>31||!Array.isArray(source.rows)||!source.rows.length||source.rows.length>10000)fail();
 let count=0,previousRow=source.headerRow;const cells=[];
 for(const [index,row] of source.rows.entries()){
  if(!row||row.csvRowNumber!==index+2||!Number.isSafeInteger(row.worksheetRow)||row.worksheetRow<=previousRow||row.worksheetRow>10000||!Array.isArray(row.cells)||!row.cells.length)fail();previousRow=row.worksheetRow;const seen=new Set();
  for(const cell of row.cells){if(++count>250000||!cell||Object.keys(cell).some(key=>!['address','row','column','type','value','format'].includes(key))||cell.row!==row.worksheetRow||!Number.isSafeInteger(cell.column)||cell.column<1||cell.column>100||seen.has(cell.column)||!['s','n','b','z'].includes(cell.type))fail();seen.add(cell.column);let n=cell.column,address='';while(n){n--;address=String.fromCharCode(65+n%26)+address;n=Math.floor(n/26);}if(cell.address!==address+cell.row)fail();if(cell.type==='n'?(typeof cell.value!=='number'||!Number.isFinite(cell.value)):cell.type==='b'?typeof cell.value!=='boolean':typeof cell.value!=='string')fail();if(typeof cell.value==='string'&&cell.value.length>32767||cell.format!==undefined&&(typeof cell.format!=='string'||cell.format.length>32767))fail();cells.push({...cell});}
 }
 const raw=csvRecords(csv),categories=[...new Set(raw.map(row=>row.category))];const remapped=mapWorkbookSheet({format:'xlsx',dateSystem:source.dateSystem,sheets:[{name:source.sheetName,cells}]},{sheetName:source.sheetName,headerRow:source.headerRow,columns:source.columns,datePolicy:source.datePolicy,categories});
 if(!remapped.canReview||worksheetCsv(remapped)!==csv)fail();return true;
}
