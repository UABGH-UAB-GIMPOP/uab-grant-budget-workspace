import {mapWorkbookAllocations} from './workbook-allocation-import.js';
import {allocationCellIdentity} from './allocation-import.js';
import {exactCsvMoney} from './csv-money.js';
import {validateBudgetPeriods,periodAllocationTotals} from './budget-periods.js';
const clone=x=>structuredClone(x);
export function validateAllocationImports(project){
 if(project.allocationImports===undefined)return [];
 try{
  if(!Array.isArray(project.allocationImports)||project.allocationImports.length>100)throw Error('Keep at most 100 allocation import receipts per project.');
  const ids=new Set();
  for(const r of project.allocationImports){
   if(!r||typeof r.id!=='string'||!r.id.trim()||r.id.length>200||ids.has(r.id)||typeof r.at!=='string'||!Number.isFinite(Date.parse(r.at))||r.version!==1||r.projectId!==project.id)throw Error('Invalid allocation receipt identity.');ids.add(r.id);
   const w=r.workbookSource,m=w?.mapping;
   if(w?.kind!=='xlsx-allocations'||typeof w.fileName!=='string'||w.fileName.length>200||!w.fileName.toLowerCase().endsWith('.xlsx')||/[\\/\x00-\x1f\x7f]/.test(w.fileName)||typeof m?.sheetName!=='string'||m.sheetName.length>31||!/^[a-f0-9]{64}$/.test(w.fileHash)||!Number.isSafeInteger(w.byteLength)||w.byteLength<1||w.byteLength>10*1024*1024||!['1900','1904'].includes(w.dateSystem)||r.source?.digest!==w.fileHash||r.source?.fileName!==w.fileName||r.source?.sheet!==m?.sheetName||!Array.isArray(m?.sourceRows))throw Error('Invalid allocation workbook provenance.');
   let previous=m.headerRow,count=0;for(const row of m.sourceRows){if(!Number.isSafeInteger(row.worksheetRow)||row.worksheetRow<=previous||!Array.isArray(row.cells)||row.cells.some(c=>!c||c.row!==row.worksheetRow||!['s','n','b','z'].includes(c.type)||(c.type==='n'?(typeof c.value!=='number'||!Number.isFinite(c.value)):c.type==='b'?typeof c.value!=='boolean':typeof c.value!=='string')))throw Error('Invalid allocation source rows.');previous=row.worksheetRow;count+=row.cells.length;if(count>250000)throw Error('Allocation source is too large.');}
   const mapped=mapWorkbookAllocations({format:'xlsx',dateSystem:w.dateSystem,sheets:[{name:m.sheetName,cells:m.sourceRows.flatMap(x=>x.cells)}]},m);
   if(JSON.stringify(mapped)!==JSON.stringify(m))throw Error('Allocation source mapping changed.');
   const scope={start:r.before?.[0]?.start,end:r.before?.at(-1)?.end};
   for(const periods of [r.before,r.after]){const errors=validateBudgetPeriods({grant:scope,budgetPeriods:periods});if(errors.length)throw Error(errors[0].message);periodAllocationTotals(periods);}
   const expected=clone(r.before),seen=new Set(),evidence=[];
   for(const row of mapped.rows){const periodId=row.periodId.trim(),category=row.category.trim(),p=expected.find(p=>p.id===periodId),key=JSON.stringify([periodId,category]);if(!p||!Object.hasOwn(p.allocations,category)||seen.has(key))throw Error('Invalid allocation receipt mapping.');seen.add(key);const amount=exactCsvMoney(row.amount);if(amount<0)throw Error('Negative allocation receipt.');p.allocations[category]=amount;evidence.push({periodId,category,cell:row.cell.trim(),cellIdentity:allocationCellIdentity(row.cell),rawCell:row.cell,rawAmount:row.amount,amount});}
   if(seen.size!==expected.reduce((n,p)=>n+Object.keys(p.allocations).length,0)||JSON.stringify(expected)!==JSON.stringify(r.after)||JSON.stringify(evidence)!==JSON.stringify(r.evidence))throw Error('Allocation receipt amounts or evidence changed.');
  }
  return [];
 }catch(error){return [{level:'error',message:error.message}];}
}
export function retainAllocationReceipt(result,id,at){
 const project={...clone(result.project),allocationImports:[...(result.project.allocationImports||[]),{...clone(result.receipt),id,at}]};
 const errors=validateAllocationImports(project);if(errors.length)throw Error(errors[0].message);return project;
}
