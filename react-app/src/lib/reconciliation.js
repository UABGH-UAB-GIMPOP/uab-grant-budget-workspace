import E from './engine.js';
export const FA_CATEGORY='F&A';
export function statementResult(project,statement){
 if(statement.category===FA_CATEGORY){const months=E.months(statement.start,statement.end),missing=months.filter(m=>typeof project.postedFa?.[m]!=='number'||!Number.isFinite(project.postedFa[m]));if(missing.length)return {actual:null,difference:null,status:statement.complete?'Missing posted F&A':'Partial',missing};const actual=E.usd(months.reduce((n,m)=>n+E.cents(project.postedFa[m]),0)),difference=E.usd(E.cents(statement.total)-E.cents(actual));return {actual,difference,status:statement.complete?(difference===0?'Matched':'Mismatch'):'Partial',missing:[]};}
 const rows=statement.category===E.SUB?project.subPays:project.ledger.filter(r=>r.cat===statement.category);
 const actual=E.usd(rows.filter(r=>r.month>=statement.start&&r.month<=statement.end).reduce((t,r)=>t+E.cents(r.amount),0));
 const difference=E.usd(E.cents(statement.total)-E.cents(actual));
 return {actual,difference,status:statement.complete?(difference===0?'Matched':'Mismatch'):'Partial'};
}
export function validateStatements(project){
 const issues=[],ids=new Set();if(project.statements===undefined)return issues;
 if(!Array.isArray(project.statements))return [{level:'error',message:'Statements must be a list.'}];
 for(const s of project.statements){
 if(!s||typeof s.id!=='string'||!s.id||ids.has(s.id)||typeof s.source!=='string'||!s.source.trim()||![...E.CATS,E.SUB,FA_CATEGORY].includes(s.category)||!/^\d{4}-(0[1-9]|1[0-2])$/.test(s.start)||!/^\d{4}-(0[1-9]|1[0-2])$/.test(s.end)||s.start>s.end||s.start<project.grant.start||s.end>project.grant.end||typeof s.total!=='number'||!Number.isFinite(s.total)||typeof s.complete!=='boolean')issues.push({level:'error',message:'Statement needs a source, valid project period, category, total and completeness status.'});
 if(s)ids.add(s.id);
 }
 return issues;
}

// A matching total is insufficient when periods are missing or double-covered.
export function reconciliationCoverage(project){
 const months=[];let year=Number(project.grant.start.slice(0,4)),month=Number(project.grant.start.slice(5));
 const end=project.grant.asOf<project.grant.end?project.grant.asOf:project.grant.end;
 for(let guard=0;guard<1200;guard++){const key=year+'-'+String(month).padStart(2,'0');if(key>end)break;months.push(key);if(++month===13){month=1;year++}}
 const rows=[...E.CATS,E.SUB,FA_CATEGORY].map(category=>{
  const statements=(project.statements||[]).filter(s=>s.category===category&&s.complete);
  const missing=[],overlapping=[],mismatched=[],missingPosted=[];
  for(const month of months){const covering=statements.filter(s=>s.start<=month&&s.end>=month);
   if(!covering.length)missing.push(month);
   else if(covering.length>1)overlapping.push(month);
   else {const result=statementResult(project,covering[0]);if(result.status==='Missing posted F&A')missingPosted.push(month);else if(result.status!=='Matched')mismatched.push(month);}
  }
  return {category,missing,overlapping,mismatched,missingPosted,status:!months.length?'No actual period':overlapping.length?'Overlapping statements':missingPosted.length?'Missing posted F&A':mismatched.length?'Totals differ':missing.length?'Missing coverage':'Matched'};
 });
 return {months,rows,matched:months.length>0&&rows.every(r=>r.status==='Matched')};
}

export function reconciliationStatus(project){
 if(validateStatements(project).length)return {matched:false,label:'Invalid statement data'};
 if(project.grant.mode==='proposal')return {matched:false,label:'Proposal · no actuals to reconcile'};
 const coverage=reconciliationCoverage(project);
 return {matched:coverage.matched,label:!coverage.months.length?'No actual period':coverage.matched?'Statements matched':'Actuals not reconciled'};
}
