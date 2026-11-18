import {repeatedSubawardInvoices} from './payments.js';
export const invoiceReviewLabels={expected:'Expected repetition',followup:'Needs follow-up'};
export const invoiceSnapshot=group=>JSON.stringify(group.payments);
export function currentInvoiceReview(project,group){
 const latest=(project.invoiceReviews||[]).filter(r=>r.key===group.key).at(-1);
 return latest?{...latest,stale:latest.snapshot!==invoiceSnapshot(group)}:null;
}
export function validateInvoiceReviews(project){
 const rows=project.invoiceReviews;if(rows===undefined)return [];
 const bad=()=>[{level:'error',message:'Invalid invoice review history.'}];
 if(!Array.isArray(rows)||rows.length>10000)return bad();
 for(const r of rows){
  if(!r||!Object.hasOwn(invoiceReviewLabels,r.disposition)||!['key','snapshot','source','reason','at'].every(k=>typeof r[k]==='string')||!r.source.trim()||r.source.length>1000||!r.reason.trim()||r.reason.length>1000||!Number.isFinite(Date.parse(r.at))||r.snapshot.length>1000000)return bad();
  try{const key=JSON.parse(r.key),snapshot=JSON.parse(r.snapshot);if(!Array.isArray(key)||key.length!==2||key.some(x=>typeof x!=='string'||!x)||!Array.isArray(snapshot)||snapshot.length<2||snapshot.some(p=>!p||!['string','number'].includes(typeof p.id)||!Number.isInteger(p.index)||p.index<0||typeof p.month!=='string'||typeof p.reference!=='string'||typeof p.note!=='string'||!Number.isFinite(p.amount)))return bad();}catch{return bad();}
 }
 return [];
}
export function recordInvoiceReview(project,key,{disposition,source,reason,at,expectedSnapshot}){
 if(project.activeScenarioId)throw Error('Return to the source budget to review invoices.');
 const group=repeatedSubawardInvoices(project).find(g=>g.key===key);if(!group)throw Error('These repeated invoices have changed. Review the current payments.');
 if(expectedSnapshot!==invoiceSnapshot(group))throw Error('The payment details changed. Reopen the review before saving.');
 const next=structuredClone(project);next.invoiceReviews=[...(next.invoiceReviews||[]),{key,snapshot:invoiceSnapshot(group),disposition,source:String(source??'').trim(),reason:String(reason??'').trim(),at}];
 const errors=validateInvoiceReviews(next);if(errors.length)throw Error('Choose a review outcome and enter a source reference and reason.');return next;
}
