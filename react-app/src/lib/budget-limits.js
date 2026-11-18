import E from './engine.js';
import {scenarioSource} from './scenarios.js';
const fields=['id','label','measure','start','end','amount','source'];
const month=value=>typeof value==='string'&&/^\d{4}-(0[1-9]|1[0-2])$/.test(value);
const text=(value,max)=>typeof value==='string'&&value.trim()===value&&value.length>0&&value.length<=max;
// Entered planning ceilings only; direct includes the full subaward direct-cost line.
// This does not implement sponsor-specific exclusions or establish an approved budget.
export function validateBudgetLimits(project,{scopeGrant}={}){
 if(project?.budgetLimits===undefined)return [];
 const errors=[],fail=message=>errors.push({level:'error',message});
 if(!Array.isArray(project.budgetLimits)||project.budgetLimits.length>500)return [{level:'error',message:'Budget limits must be a list of at most 500 entered rules.'}];
 let bounds=scopeGrant===undefined?project.grant:scopeGrant;
 try{if(scopeGrant===undefined){const source=scenarioSource(project);if(source)bounds=(source.sourceProject||source.project).grant}}catch(e){return [{level:'error',message:e.message}]}
 if(!month(bounds?.start)||!month(bounds?.end)||bounds.start>bounds.end)return [{level:'error',message:'Budget limit scope requires valid ordered start and end months.'}];
 const ids=new Set();
 for(const rule of project.budgetLimits){
  let currency=false;try{currency=typeof rule?.amount==='number'&&Number.isFinite(rule.amount)&&rule.amount>=0&&E.usd(E.cents(rule.amount))===rule.amount}catch{}
  if(!rule||typeof rule!=='object'||Array.isArray(rule)||Object.keys(rule).some(k=>!fields.includes(k))||!text(rule.id,200)||ids.has(rule.id)||!text(rule.label,200)||!text(rule.source,1000)||!['direct','total'].includes(rule.measure)||!month(rule.start)||!month(rule.end)||rule.start>rule.end||!month(bounds?.start)||!month(bounds?.end)||rule.start<bounds.start||rule.end>bounds.end||!currency)fail('Each budget limit needs a unique ID, label, source, direct/total measure, project-contained month range and nonnegative cent-precision amount.');
  if(rule)ids.add(rule.id);
 }
 return errors;
}
// calculation is an internal Engine.calculate(currentProject) result, never imported data.
// Callers must supply a fresh result; matching months alone cannot detect stale financial inputs.
export function calculateBudgetLimits(project,{scopeGrant,calculation}={}){
 const errors=validateBudgetLimits(project,{scopeGrant});if(errors.length)throw Error(errors.map(e=>e.message).join(' '));
 if(!project.budgetLimits?.length)return [];
 const c=calculation===undefined?E.calculate(project):calculation;
 const expectedMonths=E.months(project.grant.start,project.grant.end);
 if(!Array.isArray(c?.months)||c.months.length!==expectedMonths.length||c.months.some((m,i)=>m!==expectedMonths[i]))throw Error('Budget limit calculation month span does not match the current project.');
 const invalid=c.issues.filter(e=>e.level==='error');if(invalid.length)throw Error(invalid.map(e=>e.message).join(' '));
 const add=(a,b)=>{const value=a+b;if(!Number.isSafeInteger(value))throw Error('Budget limit calculation exceeds supported precision.');return value};
 return project.budgetLimits.map(rule=>{
  const months=c.months.filter(m=>m>=rule.start&&m<=rule.end);
  const sum=kind=>months.reduce((total,m)=>{const direct=[...E.CATS,E.SUB].reduce((n,cat)=>add(n,E.cents(c[kind][cat][m])),0);return add(total,add(direct,rule.measure==='total'?E.cents(c.fa[kind==='plan'?'plan':'proj'][m]):0))},0);
  const planned=sum('plan'),projected=sum('proj'),limit=E.cents(rule.amount);
  return {...rule,scopeTruncated:months[0]!==rule.start||months.at(-1)!==rule.end,evaluatedStart:months[0]??null,evaluatedEnd:months.at(-1)??null,plan:E.usd(planned),projected:E.usd(projected),planRemaining:E.usd(add(limit,-planned)),projectedRemaining:E.usd(add(limit,-projected)),planOverEnteredLimit:planned>limit,projectedOverEnteredLimit:projected>limit,forecastIncomplete:c.forecastIncomplete};
 });
}
