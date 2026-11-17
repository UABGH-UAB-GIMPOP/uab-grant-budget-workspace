const text=v=>typeof v==='string'&&v.trim()===v&&v.length>0&&v.length<=200;
export function referenceIdentity(entry){const p=entry.importSource;return p?JSON.stringify([p.projectId,p.sourceSystem,entry.reference]):JSON.stringify(['legacy',entry.reference]);}
export function validateImportProvenance(project){
 const issues=[],fail=()=>issues.push({level:'error',message:'Invalid import provenance or batch metadata.'});
 if(project.id!==undefined&&!text(project.id))fail();
 const batches=project.importBatches??[];if(!Array.isArray(batches)){fail();return issues;}
 const ids=new Set();
 for(const b of batches){if(!b||!text(b.batchId)||ids.has(b.batchId)||!text(b.projectId)||b.projectId!==project.id||!text(b.sourceSystem)||b.mappingVersion!=='canonical-csv-v1'||!/^[a-f0-9]{64}$/.test(b.fileHash)||typeof b.originalCsv!=='string'||new TextEncoder().encode(b.originalCsv).length>2000000||!b.counts||!['add','skip','conflict'].every(k=>Number.isSafeInteger(b.counts[k])&&b.counts[k]>=0)||b.counts.conflict!==0)fail();if(b)ids.add(b.batchId);}
 for(const e of project.ledger||[]){const p=e.importSource;if(p===undefined)continue;const b=batches.find(b=>b?.batchId===p?.batchId);if(!p||!b||p.projectId!==project.id||p.projectId!==b.projectId||p.sourceSystem!==b.sourceSystem||p.mappingVersion!==b.mappingVersion||p.fileHash!==b.fileHash||!Number.isSafeInteger(p.rowNumber)||p.rowNumber<2||!p.sourceRecord||typeof p.sourceRecord!=='object'||Array.isArray(p.sourceRecord)||Object.values(p.sourceRecord).some(v=>typeof v!=='string'))fail();}
 return issues;
}
