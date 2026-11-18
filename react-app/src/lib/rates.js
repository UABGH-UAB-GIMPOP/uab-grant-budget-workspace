export function effectiveRate(project,kind,month,fallback,personId){
 const rows=(project.rateChanges||[]).filter(r=>r.kind===kind&&(!['fringe','appointmentFte'].includes(kind)||r.personId===personId)&&r.month<=month).sort((a,b)=>a.month.localeCompare(b.month));
 return rows.length?rows.at(-1).value:Number(fallback);
}
export function validateRates(project){
 if(project.rateChanges===undefined)return [];
 if(!Array.isArray(project.rateChanges))return [{level:'error',message:'Rate changes must be a list.'}];
 const issues=[],ids=new Set(),scopes=new Set();
 for(const r of project.rateChanges){
  const scope=r&&[r.kind,r.personId||'',r.month].join('|');
  if(!r||typeof r.id!=='string'||!r.id||ids.has(r.id)||scopes.has(scope)||!['fringe','salaryCap','indirect','appointmentFte'].includes(r.kind)||typeof r.month!=='string'||!/^\d{4}-(0[1-9]|1[0-2])$/.test(r.month)||!Number.isFinite(r.value)||r.value<0||r.value>(r.kind==='appointmentFte'?1:r.kind==='fringe'?200:r.kind==='indirect'?100:10000000)||(r.kind==='appointmentFte'&&r.value<=0)||typeof r.source!=='string'||!r.source.trim()||(['fringe','appointmentFte'].includes(r.kind)&&!project.people.some(p=>p.id===r.personId))||(!['fringe','appointmentFte'].includes(r.kind)&&r.personId))issues.push({level:'error',message:'Rate changes require a unique effective month, valid rate, source and applicable person.'});
  if(r){ids.add(r.id);scopes.add(scope)}
 }
 return issues;
}
