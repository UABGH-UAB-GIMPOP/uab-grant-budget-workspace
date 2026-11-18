import {inspectWorkbookTask} from './workbook-task.js';
import {mapWorkbookSheet} from './workbook-mapping.js';
import {worksheetCsv,workbookSource,validateWorkbookSource} from './workbook-source.js';
import {prepareImport,applyReviewedImport} from './import-preview.js';
export async function prepareWorkbookImport(project,bytes,options,{inspect=inspectWorkbookTask,signal=null}={}){
 if(!(bytes instanceof Uint8Array)||!bytes.length||bytes.length>10*1024*1024)throw Error('Choose an XLSX file no larger than 10 MiB.');
 const config=structuredClone(options),snapshot=bytes.slice(),book=await inspect(snapshot,{signal});if(signal?.aborted)throw Object.assign(Error('Workbook import cancelled.'),{name:'AbortError'});
 const mapping=mapWorkbookSheet(book,config.mapping),csv=worksheetCsv(mapping),fileHash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',snapshot)),n=>n.toString(16).padStart(2,'0')).join('');
 if(signal?.aborted)throw Object.assign(Error('Workbook import cancelled.'),{name:'AbortError'});
 const source=workbookSource(mapping,{fileName:config.fileName,fileHash,byteLength:snapshot.length});validateWorkbookSource(source,csv);
 const review=await prepareImport(project,csv,config);if(signal?.aborted)throw Object.assign(Error('Workbook import cancelled.'),{name:'AbortError'});return {review,source,csv};
}
export async function applyReviewedWorkbookImport(project,bytes,options,preview,validateProject,exclusions=[],runtime={}){
 const config=structuredClone(options),decisions=structuredClone(exclusions);
 const current=await prepareWorkbookImport(project,bytes,config,runtime);
 if(!preview||JSON.stringify(current)!==JSON.stringify(preview))throw Error('Workbook preview changed; review the file and mapping again.');
 const next=await applyReviewedImport(project,current.csv,config,current.review,validateProject,decisions);
 if(runtime.signal?.aborted)throw Object.assign(Error('Workbook import cancelled.'),{name:'AbortError'});
 const batch=next.importBatches.find(batch=>batch.batchId===current.review.metadata.batchId);batch.workbookSource=current.source;
 const errors=validateProject(next).filter(issue=>issue.level==='error');if(errors.length)throw Error(errors.map(issue=>issue.message).join(' '));return next;
}
