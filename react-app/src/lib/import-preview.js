// Pure, opt-in canonical CSV contract. No persistence, network, or UI side effects.
import {csvRecords} from './csv.js';
import E from './engine.js';
import {exactCsvMoney} from './csv-money.js';
const copy = value => JSON.parse(JSON.stringify(value));
const fields = ['month','cat','amount','reference','note','personId','commitmentId','commitmentAmount'];
const same = (a,b) => {
 // Settlement annotations may differ from the retained source mapping; financial fields stay live.
 // This comparison does not authenticate metadata. Apply still validates the complete project.
 const source=a.importSource?.sourceRecord,annotated=typeof a.settlementReason==='string'&&a.settlementReason.trim()&&source;
 const original=annotated?{...a,commitmentId:source.commitmentId||undefined,commitmentAmount:source.commitmentAmount?.trim()?Number(source.commitmentAmount):undefined}:a;
 return fields.every(k => String(original[k] ?? '') === String(b[k] ?? ''));
};
const digest = async text => Array.from(new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))),b=>b.toString(16).padStart(2,'0')).join('');
function scope(value) {
 const {projectId,sourceSystem,batchId} = value || {};
 for(const [key,v] of Object.entries({projectId,sourceSystem,batchId})) if(typeof v!=='string'||!v.trim()||v!==v.trim()||v.length>200) throw Error(`Explicit ${key} is required (1–200 characters).`);
 return {projectId,sourceSystem,batchId,mappingVersion:'canonical-csv-v1'};
}
export async function prepareImport(project,text,options) {
 const metadata=scope(options);
 if(typeof text!=='string'||new TextEncoder().encode(text).length>2000000) throw Error('CSV must be text no larger than 2 MB.');
 if(!Array.isArray(project.ledger)) throw Error('Project ledger required.');
 if(project.id!=null&&project.id!==metadata.projectId) throw Error('Project identity mismatch.');
 const parsed=csvRecords(text);
 if(parsed.length>10000) throw Error('CSV exceeds 10,000 rows.');
 const fileHash=await digest(text),baseHash=await digest(JSON.stringify(project));
 const batches=project.importBatches||[];
 if(batches.some(b=>b.batchId===metadata.batchId)) throw Error('Batch ID already exists; use a new review batch.');
 const warnings=batches.some(b=>b.fileHash===fileHash)?['This exact file was imported before; review every row.']:[];
 const existing=new Map(),legacy=new Map();
 for(const entry of project.ledger) {
  if(!entry.reference) continue;
  const provenance=entry.importSource;
  const target=provenance?.projectId===metadata.projectId&&provenance?.sourceSystem===metadata.sourceSystem?existing:!provenance?legacy:null;
  if(target) target.set(entry.reference,[...(target.get(entry.reference)||[]),entry]);
 }
 const rows=parsed.map((raw,index)=>{
  const issues=[];
  try{exactCsvMoney(raw.amount)}catch(e){issues.push(e.message)}
  if(raw.commitmentAmount?.trim())try{exactCsvMoney(raw.commitmentAmount)}catch(e){issues.push('Commitment allocation: '+e.message)}
  const row={month:raw.month,cat:raw.category,amount:Number(raw.amount),reference:raw.reference,note:raw.note||'',personId:raw.personId||undefined,commitmentId:raw.commitmentId||undefined,...(raw.commitmentAmount?.trim()?{commitmentAmount:Number(raw.commitmentAmount)}:{})};
  if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(row.month))issues.push('Use a valid month (YYYY-MM).');
  else if(project.grant?.start&&project.grant?.end&&(row.month<project.grant.start||row.month>project.grant.end))issues.push('Month is outside this project period.');
  if(!E.CATS.includes(row.cat))issues.push('Category is not mapped to a supported ledger category.');
  if(issues.length)return {rowNumber:index+2,status:'conflict',reason:'Invalid row: '+issues.join(' '),record:row,sourceRecord:raw};
  const matches=existing.get(row.reference)||[],unscoped=legacy.get(row.reference)||[];
  let status='add',reason='New source transaction';
  if(unscoped.length){status='conflict';reason='Existing reference has no source identity; resolve provenance first';}
  else if(matches.length>1){status='conflict';reason='Multiple existing records share this source reference';}
  else if(matches.length){status=same(matches[0],row)?'skip':'conflict';reason=status==='skip'?'Identical source transaction':'Source reference has different values';}
  if(!matches.length) existing.set(row.reference,[row]);
  return {rowNumber:index+2,status,reason,record:row,sourceRecord:raw};
 });
 return {metadata,fileHash,baseHash,warnings,rows,canApply:!rows.some(r=>r.status==='conflict'),counts:{add:rows.filter(r=>r.status==='add').length,skip:rows.filter(r=>r.status==='skip').length,conflict:rows.filter(r=>r.status==='conflict').length}};
}
export function reviewSelection(review,exclusions=[]) {
 if(!review||!Array.isArray(review.rows)||!Array.isArray(exclusions))throw Error('Invalid row exclusions.');
 const selected=new Set();
 for(const decision of exclusions){const row=review.rows.find(r=>r.rowNumber===decision?.rowNumber);if(!decision||Object.keys(decision).some(k=>!['rowNumber','reason'].includes(k))||!Number.isSafeInteger(decision.rowNumber)||!row||!['add','conflict'].includes(row.status)||selected.has(decision.rowNumber)||typeof decision.reason!=='string'||!decision.reason.trim()||decision.reason.trim().length>500)throw Error('Each exclusion needs a unique add/conflict row and a reason (1–500 characters).');selected.add(decision.rowNumber);}
 const counts={add:0,skip:0,conflict:0,excluded:selected.size};
 for(const row of review.rows)if(!selected.has(row.rowNumber))counts[row.status]++;
 return {counts,canApply:counts.conflict===0&&counts.add>0};
}
export async function applyReviewedImport(project,text,options,review,validateProject,exclusions=[]) {
 // Recompute from original text, not caller-editable preview rows. Fail closed on stale edits.
 const current=await prepareImport(project,text,options);
 if(!review||JSON.stringify(current)!==JSON.stringify(review)) throw Error('Preview changed; review the import again.');
 const selection=reviewSelection(current,exclusions);
 if(selection.counts.conflict)throw Error('Resolve or explicitly exclude all conflicts before applying; nothing was changed.');
 if(!selection.counts.add)throw Error('No new rows selected; nothing was changed.');
 const excluded=new Map(exclusions.map(x=>[x.rowNumber,x.reason.trim()]));
 if(typeof validateProject!=='function') throw Error('Project validator required.');
 const next=copy(project);let id=next.ledger.reduce((n,e)=>Math.max(n,Number(e.id)||0),0);
 if(!Number.isSafeInteger(id)||id>Number.MAX_SAFE_INTEGER-selection.counts.add) throw Error('Ledger IDs exceed safe range.');
 for(const row of current.rows.filter(r=>r.status==='add'&&!excluded.has(r.rowNumber))) next.ledger.push({...row.record,id:++id,importSource:{...current.metadata,fileHash:current.fileHash,rowNumber:row.rowNumber,sourceRecord:copy(row.sourceRecord)}});
 next.importBatches=[...(next.importBatches||[]),{...current.metadata,fileHash:current.fileHash,counts:selection.counts,exclusions:[...excluded].map(([rowNumber,reason])=>({rowNumber,reason})),decisions:current.rows.map(row=>({...copy(row),decision:excluded.has(row.rowNumber)?'excluded':row.status,...(excluded.has(row.rowNumber)?{exclusionReason:excluded.get(row.rowNumber)}:{})})),originalCsv:text}];
 if(selection.counts.add) next.grant.reconciled=false;
 const errors=validateProject(next).filter(x=>x.level==='error');if(errors.length) throw Error(errors.map(x=>x.message).join(' '));
 return next;
}
