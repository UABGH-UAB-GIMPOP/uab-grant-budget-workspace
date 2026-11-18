import {inspectWorkbookTask} from './workbook-task.js';
import {previewAllocationImport,applyAllocationImport,allocationCellIdentity} from './allocation-import.js';
const clone=x=>structuredClone(x);
const check=signal=>{if(signal?.aborted)throw Object.assign(Error('Allocation import cancelled.'),{name:'AbortError'});};
export function mapWorkbookAllocations(book,mapping){
 if(book?.format!=='xlsx'||!Array.isArray(book.sheets))throw Error('Inspect a values-only workbook first.');
 const {sheetName,headerRow,columns}=mapping||{},sheets=book.sheets.filter(s=>s.name===sheetName);
 if(sheets.length!==1||!Number.isSafeInteger(headerRow)||headerRow<1||headerRow>10000)throw Error('Choose one worksheet and a valid header row.');
 const fields=['periodId','category','amount'];
 if(!columns||Object.keys(columns).length!==3||fields.some(f=>!Number.isSafeInteger(columns[f])||columns[f]<1||columns[f]>100)||new Set(Object.values(columns)).size!==3)throw Error('Map Period ID, Category and Amount to distinct columns.');
 const grouped=new Map(),seen=new Set();
 for(const cell of sheets[0].cells){
  const identity=allocationCellIdentity(cell.address);
  if(identity!==`R${cell.row}C${cell.column}`||seen.has(identity))throw Error('Invalid or repeated source coordinates.');seen.add(identity);
  if(cell.row<=headerRow)continue;
  const row=grouped.get(cell.row)||[];row.push(clone(cell));grouped.set(cell.row,row);
 }
 const sourceRows=[...grouped].sort(([a],[b])=>a-b).map(([worksheetRow,cells])=>({worksheetRow,cells}));
 if(!sourceRows.length||sourceRows.length>1200)throw Error('Choose a worksheet with 1–1200 allocation rows.');
 const rows=sourceRows.map(({worksheetRow,cells})=>{
  const pick=f=>cells.find(c=>c.column===columns[f]),period=pick('periodId'),category=pick('category'),amount=pick('amount');
  if(typeof period?.value!=='string'||typeof category?.value!=='string')throw Error(`Row ${worksheetRow}: Period ID and Category must be explicit text.`);
  if(!amount||!['s','n'].includes(amount.type)||!['string','number'].includes(typeof amount.value))throw Error(`Row ${worksheetRow}: Amount is required.`);
  return {periodId:period.value,category:category.value,cell:amount.address,amount:String(amount.value)};
 });
 return {version:1,sheetName,headerRow,columns:clone(columns),sourceRows,rows};
}
export async function prepareWorkbookAllocationImport(project,bytes,options,{inspect=inspectWorkbookTask,signal=null}={}){
 check(signal);
 if(!(bytes instanceof Uint8Array)||!bytes.length||bytes.length>10*1024*1024)throw Error('Choose an XLSX file no larger than 10 MiB.');
 const input=bytes.slice(),config=clone(options),original=clone(project);
 if(typeof config?.fileName!=='string'||!config.fileName.toLowerCase().endsWith('.xlsx')||/[\\/\x00-\x1f\x7f]/.test(config.fileName))throw Error('Use an XLSX filename without path characters.');
 const book=await inspect(input,{signal});check(signal);const mapping=mapWorkbookAllocations(book,config.mapping);
 const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',input)),n=>n.toString(16).padStart(2,'0')).join('');check(signal);
 const review=previewAllocationImport(original,mapping.rows,{fileName:config.fileName,sheet:mapping.sheetName,digest});
 return {review,workbookSource:{kind:'xlsx-allocations',fileName:config.fileName,fileHash:digest,byteLength:input.length,dateSystem:book.dateSystem,mapping}};
}
export async function applyReviewedWorkbookAllocations(project,bytes,options,preview,validateProject,runtime={}){
 const current=await prepareWorkbookAllocationImport(project,bytes,options,runtime);check(runtime.signal);
 if(!preview||JSON.stringify(current)!==JSON.stringify(preview))throw Error('Allocation workbook preview changed. Review the file and mapping again.');
 const result=applyAllocationImport(project,current.review);
 const errors=validateProject(result.project).filter(i=>i.level==='error');if(errors.length)throw Error(errors.map(i=>i.message).join(' '));check(runtime.signal);
 return {...result,receipt:{...result.receipt,workbookSource:clone(current.workbookSource)}};
}
