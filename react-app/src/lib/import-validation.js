export function validateCsvRecord(record, row) {
 for(const key of ['month','category','amount','reference']) {
  if(typeof record[key]!=='string'||!record[key].trim()) throw Error(`Row ${row}: ${key} is required.`);
 }
 if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(record.amount.trim())||!Number.isFinite(Number(record.amount))) throw Error(`Row ${row}: amount must be numeric.`);
 if(record.commitmentAmount?.trim()&&(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(record.commitmentAmount.trim())||!Number.isFinite(Number(record.commitmentAmount))))throw Error(`Row ${row}: commitmentAmount must be numeric.`);
}
export function subawardEligibility(grant, award) {
 const total=Number(award.total),subject=Math.min(total,grant.base==='TDC'?total:Number(award.subj));
 return {subject,excluded:total-subject,idc:Math.round(subject*Number(grant.indirect))/100};
}
