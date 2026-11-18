import {exactCsvMoney} from './csv-money.js';
import {validateCommitments} from './commitments.js';
export function reviseCommitment(project,id,{amount,source,reason,schedule,at}){
 if(project.activeScenarioId)throw Error('Return to the source budget to revise a commitment.');
 const original=project.commitments?.find(c=>c.id===id);if(!original)throw Error('Commitment no longer exists.');
 const value=exactCsvMoney(String(amount));if(value<0||value===original.amount)throw Error('Enter a different nonnegative authorized amount.');
 if(typeof source!=='string'||!source.trim()||source.trim().length>1000||typeof reason!=='string'||!reason.trim()||reason.trim().length>1000||!Number.isFinite(Date.parse(at)))throw Error('Enter a source reference and reason for this revision.');
 if(original.schedule&&schedule===undefined)throw Error('Explicitly revise the payment schedule to match the new authorized amount.');
 if(Array.isArray(schedule))for(const item of schedule)exactCsvMoney(String(item.amount));
 const next=structuredClone(project),row=next.commitments.find(c=>c.id===id);
 row.amount=value;row.source=source.trim();if(schedule===null)delete row.schedule;else if(schedule!==undefined)row.schedule=structuredClone(schedule);
 row.revisions=[...(row.revisions||[]),{at,from:original.amount,to:value,previousSource:original.source,source:source.trim(),reason:reason.trim()}];
 const errors=validateCommitments(next);if(errors.length)throw Error(errors.map(e=>e.message).join(' '));return next;
}
