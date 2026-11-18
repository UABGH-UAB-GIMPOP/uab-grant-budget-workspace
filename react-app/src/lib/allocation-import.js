import {allocationPeriods,previewLegacyPeriods,periodAllocationTotals,validateBudgetPeriods} from './budget-periods.js';
import {exactCsvMoney} from './csv-money.js';
import {cents} from './money.js';
import E from './engine.js';
const clone=x=>JSON.parse(JSON.stringify(x));
const text=(value,name,max=200)=>{if(typeof value!=='string'||!value.trim()||value.length>max)throw Error(`Enter ${name}.`);return value.trim();};
export function allocationCellIdentity(raw){
 const value=text(raw,'a source cell').toUpperCase();let row,column;
 const rc=/^R(0*[1-9]\d*)C(0*[1-9]\d*)$/.exec(value),a1=/^\$?([A-Z]{1,3})\$?(0*[1-9]\d*)$/.exec(value);
 if(rc){row=Number(rc[1]);column=Number(rc[2]);}
 else if(a1){row=Number(a1[2]);column=[...a1[1]].reduce((n,c)=>n*26+c.charCodeAt(0)-64,0);}
 else throw Error('Source cells must be absolute A1 or R1C1 coordinates.');
 if(!Number.isSafeInteger(row)||!Number.isSafeInteger(column)||row>1048576||column>16384)throw Error('Source cell is outside worksheet bounds.');
 return `R${row}C${column}`;
}
// Adapter contract: workbook/CSV mapping must supply original decimal text and explicit
// destination IDs. This does not infer sponsor rules, dates, omitted zeros or approvals.
export function previewAllocationImport(project,rows,source){
 if(project.activeScenarioId!==undefined)throw Error('Return to the working budget before importing allocations.');
 text(project.id,'a stable project ID');
 const origin={fileName:text(source?.fileName,'the source filename'),sheet:text(source?.sheet,'the source sheet'),digest:text(source?.digest,'the source digest')};
 const periods=project.budgetPeriods===undefined?previewLegacyPeriods(project).periods:allocationPeriods(project),categories=Object.keys(periods[0].allocations),expected=periods.length*categories.length;
 if(!Array.isArray(rows)||rows.length!==expected)throw Error(`Map all ${expected} period/category cells, including explicit zeros.`);
 const targets=new Map(periods.map(p=>[p.id,p])),seen=new Set(),cells=new Set(),evidence=[];
 for(const row of rows){
  const periodId=text(row?.periodId,'a destination period ID'),category=text(row?.category,'a destination category'),cell=text(row?.cell,'a source cell');
  const period=targets.get(periodId);if(!period||!categories.includes(category))throw Error('Unknown allocation destination.');
  const key=JSON.stringify([periodId,category]);if(seen.has(key))throw Error('Each allocation destination must appear exactly once.');
  const cellIdentity=allocationCellIdentity(cell);
  if(cells.has(cellIdentity))throw Error('Each source amount cell must map to exactly one destination.');
  const amount=exactCsvMoney(row.amount);if(amount<0)throw Error('Budget allocations cannot be negative.');
  seen.add(key);cells.add(cellIdentity);period.allocations[category]=amount;
  evidence.push({periodId,category,cell,cellIdentity,rawCell:row.cell,rawAmount:row.amount,amount});
 }
 const candidate={...project,budgetPeriods:periods},errors=validateBudgetPeriods(candidate);if(errors.length)throw Error(errors[0].message);
 const before=allocationPeriods(project),totals=periodAllocationTotals(periods);
 const totalCents=periods.reduce((sum,p)=>sum+Object.values(p.allocations).reduce((n,v)=>n+BigInt(cents(v)),0n),0n);
 if(totalCents>BigInt(Number.MAX_SAFE_INTEGER)||BigInt(cents(Number(totalCents)/100))!==totalCents)throw Error('Combined allocations exceed supported precision.');
 // F&A and downstream aggregates must also remain calculable before acceptance.
 E.calculate(candidate);
 return {version:1,projectId:project.id,source:origin,rows:clone(rows),snapshot:JSON.stringify(project),periods,before,totals,evidence};
}
export function applyAllocationImport(project,review){
 if(!review||review.version!==1||review.snapshot!==JSON.stringify(project))throw Error('Budget changed since preview. Review the allocation mapping again.');
 const current=previewAllocationImport(project,review.rows,review.source);
 if(JSON.stringify(current)!==JSON.stringify(review))throw Error('Allocation preview changed. Review the mapping again.');
 return {project:{...clone(project),budgetPeriods:clone(current.periods)},receipt:{version:1,projectId:project.id,source:clone(current.source),before:clone(current.before),after:clone(current.periods),evidence:clone(current.evidence)}};
}
