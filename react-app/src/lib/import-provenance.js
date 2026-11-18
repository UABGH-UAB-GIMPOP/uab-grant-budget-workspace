import {csvRecords} from './csv.js';
import {validateWorkbookSource} from './workbook-source.js';
const normalized=raw=>({month:raw.month,cat:raw.category,amount:Number(raw.amount),reference:raw.reference,note:raw.note||'',personId:raw.personId||undefined,commitmentId:raw.commitmentId||undefined,...(raw.commitmentAmount?.trim()?{commitmentAmount:Number(raw.commitmentAmount)}:{})});
const recordMatches=(record,raw)=>{const expected=normalized(raw);return record&&typeof record==='object'&&!Array.isArray(record)&&Object.keys(record).every(k=>Object.hasOwn(expected,k))&&Object.keys(expected).every(k=>record[k]===expected[k]);};
const text=v=>typeof v==='string'&&v.trim()===v&&v.length>0&&v.length<=200;
export function referenceIdentity(entry){const p=entry.importSource;return p?JSON.stringify([p.projectId,p.sourceSystem,entry.reference]):JSON.stringify(['legacy',entry.reference]);}
export function validateImportProvenance(project){
 const issues=[],fail=()=>issues.push({level:'error',message:'Invalid import provenance or batch metadata.'});
 if(project.id!==undefined&&!text(project.id))fail();
 const batches=project.importBatches??[];if(!Array.isArray(batches)){fail();return issues;}
 const ids=new Set();
 for(const b of batches){if(!b||!text(b.batchId)||ids.has(b.batchId)||!text(b.projectId)||b.projectId!==project.id||!text(b.sourceSystem)||b.mappingVersion!=='canonical-csv-v1'||!/^[a-f0-9]{64}$/.test(b.fileHash)||typeof b.originalCsv!=='string'||new TextEncoder().encode(b.originalCsv).length>2000000||!b.counts||!['add','skip','conflict'].every(k=>Number.isSafeInteger(b.counts[k])&&b.counts[k]>=0)||b.counts.conflict!==0)fail();if(b)ids.add(b.batchId);}
 for(const b of batches){
  try{validateWorkbookSource(b?.workbookSource,b?.originalCsv)}catch{fail();}
  if(!b||b.exclusions===undefined&&b.decisions===undefined&&b.counts?.excluded===undefined)continue;
  try{
   const raw=csvRecords(b.originalCsv),excluded=new Map();
   if(!Array.isArray(b.exclusions)||!Array.isArray(b.decisions)||b.decisions.length!==raw.length||b.counts.excluded!==b.exclusions.length)throw Error();
   for(const x of b.exclusions){if(!x||Object.keys(x).some(k=>!['rowNumber','reason'].includes(k))||!Number.isSafeInteger(x.rowNumber)||x.rowNumber<2||x.rowNumber>raw.length+1||excluded.has(x.rowNumber)||typeof x.reason!=='string'||!x.reason.trim()||x.reason!==x.reason.trim()||x.reason.length>500)throw Error();excluded.set(x.rowNumber,x.reason);}
   const counts={add:0,skip:0,conflict:0,excluded:0};
   for(const [i,d] of b.decisions.entries()){
    if(!d||d.rowNumber!==i+2||!['add','skip','conflict'].includes(d.status)||typeof d.reason!=='string'||!recordMatches(d.record,raw[i])||JSON.stringify(d.sourceRecord)!==JSON.stringify(raw[i]))throw Error();
    const reason=excluded.get(d.rowNumber),decision=reason?'excluded':d.status;
    if(d.decision!==decision||reason&&(d.status==='skip'||d.exclusionReason!==reason)||!reason&&d.exclusionReason!==undefined)throw Error();counts[decision]++;
   }
   if(Object.keys(counts).some(k=>counts[k]!==b.counts[k])||counts.conflict!==0||counts.add===0)throw Error();
   const imported=new Map();for(const entry of project.ledger||[]){if(entry.importSource?.batchId===b.batchId){const row=entry.importSource.rowNumber;imported.set(row,(imported.get(row)||0)+1)}}
   for(const decision of b.decisions)if(decision.decision==='add'&&imported.get(decision.rowNumber)!==1)throw Error();
   for(const entry of project.ledger||[]){if(entry.importSource?.batchId!==b.batchId)continue;const rowNumber=entry.importSource.rowNumber,decision=b.decisions[rowNumber-2];if(excluded.has(rowNumber)||!decision||decision.decision!=='add'||JSON.stringify(entry.importSource.sourceRecord)!==JSON.stringify(decision.sourceRecord))throw Error();}
  }catch{fail();}
 }
 // Every added source row must retain one tagged original, including legacy batches.
 const positions=new Map();
 for(const entry of project.ledger||[]){const provenance=entry.importSource;if(provenance===undefined)continue;const batchId=provenance?.batchId;let rows=positions.get(batchId);if(!rows){rows=new Set();positions.set(batchId,rows);}if(rows.has(provenance?.rowNumber)||entry.reversalOf!==undefined)fail();rows.add(provenance?.rowNumber);}
 for(const batch of batches)if(batch&&(positions.get(batch.batchId)?.size??0)!==batch.counts?.add)fail();
 const parsedBatches=new Map();
 for(const e of project.ledger||[]){const p=e.importSource;if(p===undefined)continue;const b=batches.find(b=>b?.batchId===p?.batchId);if(!p||!b||p.projectId!==project.id||p.projectId!==b.projectId||p.sourceSystem!==b.sourceSystem||p.mappingVersion!==b.mappingVersion||p.fileHash!==b.fileHash||!Number.isSafeInteger(p.rowNumber)||p.rowNumber<2||!p.sourceRecord||typeof p.sourceRecord!=='object'||Array.isArray(p.sourceRecord)||Object.values(p.sourceRecord).some(v=>typeof v!=='string')){fail();continue;}
  try{
   if(!parsedBatches.has(b.batchId))parsedBatches.set(b.batchId,csvRecords(b.originalCsv));
   const source=parsedBatches.get(b.batchId)[p.rowNumber-2];
   if(!source||JSON.stringify(source)!==JSON.stringify(p.sourceRecord))throw Error();
   const expected=normalized(source);
   for(const key of ['month','cat','reference'])if(typeof e[key]!=='string'||e[key]!==expected[key])throw Error();
   if(e.note===undefined||e.note===null){if(expected.note!=='')throw Error();}else if(typeof e.note!=='string'||e.note!==expected.note)throw Error();
   if(String(e.personId??'')!==String(expected.personId??''))throw Error();
   if(!['number','string'].includes(typeof e.amount)||(typeof e.amount==='string'&&!e.amount.trim())||!Number.isFinite(Number(e.amount))||Number(e.amount)!==expected.amount)throw Error();
   const changed=e.commitmentAllocations!==undefined||String(e.commitmentId??'')!==String(expected.commitmentId??'')||(e.commitmentAmount==null?null:Number(e.commitmentAmount))!==(expected.commitmentAmount??null);
   if(changed&&(typeof e.settlementReason!=='string'||!e.settlementReason.trim()))throw Error();
  }catch{fail();}
 }
 return issues;
}
