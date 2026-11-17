import {csvRecords} from './csv.js';
export function previewLedgerCsv(project,text){
 const next=JSON.parse(JSON.stringify(project)),records=csvRecords(text),seen=new Map(next.ledger.filter(e=>e.reference).map(e=>[e.reference,e])),skipped=[];
 let id=next.ledger.reduce((max,e)=>Math.max(max,Number(e.id)||0),0),added=0;
 for(const o of records){const row={month:o.month,cat:o.category,amount:Number(o.amount),reference:o.reference,note:o.note||'',personId:o.personId||undefined,commitmentId:o.commitmentId||undefined,...(o.commitmentAmount?.trim()?{commitmentAmount:Number(o.commitmentAmount)}:{})},old=seen.get(row.reference);
  if(old){const same=['month','cat','amount','note','personId','commitmentId','commitmentAmount'].every(k=>k==='amount'?Number(old[k])===row[k]:String(old[k]??'')===String(row[k]??''));if(!same)throw Error(`Reference ${row.reference} conflicts with an existing or imported entry. No rows were applied.`);skipped.push(row.reference);continue}
  const entry={id:++id,...row};next.ledger.push(entry);seen.set(entry.reference,entry);added++;
 }
 if(added)next.grant.reconciled=false;
 return {project:next,added,skipped};
}
