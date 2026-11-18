import {settlementAllocations} from './commitments.js';
export function reverseEntry(project,id,reason,month,newId){
 const original=project.ledger.find(r=>String(r.id)===String(id));
 if(!original)throw Error('Transaction not found.');
 if(!reason.trim())throw Error('Enter a correction reason.');
 if(original.reversalOf!==undefined||project.ledger.some(r=>String(r.reversalOf)===String(id)))throw Error('Transaction has already been reversed or is a reversal.');
 if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)||month<project.grant.start||month>project.grant.end)throw Error('Choose a month within the project period.');
 if(project.ledger.some(r=>String(r.id)===String(newId)))throw Error('Duplicate transaction ID.');
 const allocations=settlementAllocations(original);
 const {importSource,...originalFields}=original;
 return {...originalFields,id:newId,month,amount:-Number(original.amount),...(original.commitmentAmount!==undefined?{commitmentAmount:-original.commitmentAmount}:{}),...(original.commitmentAllocations!==undefined?{commitmentAllocations:allocations.map(a=>({...a,amount:-a.amount}))}:{}),reference:'REV-'+newId,reversalOf:original.id,note:reason.trim()};
}
export function validateReversals(project){
 const errors=[],seen=new Set();
 for(const row of project.ledger){if(row.reversalOf===undefined)continue;const id=String(row.reversalOf),original=project.ledger.find(x=>String(x.id)===id);
  let splitMatches=true;try{const key=rows=>JSON.stringify(rows.sort((a,b)=>a.commitmentId.localeCompare(b.commitmentId)));if(row.commitmentAllocations!==undefined||original?.commitmentAllocations!==undefined)splitMatches=key(settlementAllocations(row))===key(settlementAllocations(original).map(a=>({...a,amount:-a.amount})));}catch{splitMatches=false;}
  if(!splitMatches||!original||original.reversalOf!==undefined||seen.has(id)||String(row.id)===id||Number(row.amount)!==-Number(original.amount)||row.cat!==original.cat||row.commitmentId!==original.commitmentId||(row.commitmentAmount??-Number(original.amount))!==-(original.commitmentAmount??Number(original.amount))||String(row.personId??'')!==String(original.personId??'')||typeof row.note!=='string'||!row.note.trim())errors.push({level:'error',message:'Reversal must uniquely offset an existing original transaction and include a reason.'});
  seen.add(id);
 }
 return errors;
}
