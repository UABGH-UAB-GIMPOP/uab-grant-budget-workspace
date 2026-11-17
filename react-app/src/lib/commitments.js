import {cents} from './money.js';
const validMonth=m=>typeof m==='string'&&/^\d{4}-(0[1-9]|1[0-2])$/.test(m);
export function validateCommitments(p){
 const errors=[],fail=message=>errors.push({level:'error',message});
 if(p.commitments===undefined){if(p.ledger.some(e=>e.commitmentId!==undefined||e.commitmentAmount!==undefined))fail('Settlement references a missing commitment.');return errors;}
 if(!Array.isArray(p.commitments))return [{level:'error',message:'Commitments must be a list.'}];
 const ids=new Set(),linked=new Set();
 for(const c of p.commitments){
  if(!c||typeof c.id!=='string'||!c.id||ids.has(c.id)){fail('Commitments need unique IDs.');continue}ids.add(c.id);
  if(!['Supplies','Travel','Other','Equipment','Patient care','Tuition','Participant support','Consultants'].includes(c.category)||typeof c.name!=='string'||!c.name.trim()||typeof c.source!=='string'||!c.source.trim()||!Number.isFinite(c.amount)||c.amount<0||!Number.isFinite(c.cancelled)||c.cancelled<0||c.cancelled>c.amount||!validMonth(c.month)||c.month<p.grant.start||c.month>p.grant.end)fail('Commitment needs a name, source, supported category, project month and nonnegative authorized/cancelled amounts.');
  if(c.link){const key=c.link.type+':'+c.link.id,list=c.link.type==='supply'?p.supplies:c.link.type==='cost'?p.costs:undefined,row=list?.find(r=>String(r.id)===String(c.link.id));if(c.link.id===undefined||c.link.id===null||c.link.id===''||!row||linked.has(key)||(c.link.type==='supply'?'Supplies':row.cat)!==c.category)fail('Each modeled cost can link to one commitment in the same category.');linked.add(key)}
 }
 for(const e of p.ledger){if(e.commitmentAmount!==undefined){const a=e.commitmentAmount;if(e.commitmentId===undefined||!Number.isFinite(a)||Math.abs(cents(a))>Math.abs(cents(e.amount))||(a!==0&&Math.sign(a)!==Math.sign(e.amount)))fail('Allocated settlement must have a commitment, match the transaction sign and not exceed its amount.')}if(e.commitmentId!==undefined){const c=p.commitments.find(c=>c?.id===e.commitmentId);if(!c||e.cat!==c.category)fail('Settlement must reference a commitment in the same category.')}}
 return errors;
}
export function commitmentState(p,c,cut){
 const paid=p.ledger.filter(e=>e.commitmentId===c.id&&e.month>=p.grant.start&&e.month<=p.grant.end&&e.month<=cut).reduce((t,e)=>t+cents(e.commitmentAmount??e.amount),0);
 const net=cents(c.amount)-cents(c.cancelled),open=Math.max(0,net-paid);
 return {paid:paid/100,open:open/100,overpaid:Math.max(0,paid-net)/100};
}
export function commitmentForecast(p,months,cut){
 const future=months.filter(m=>m>cut),rows=[],issues=[];
 for(const c of p.commitments||[]){const state=commitmentState(p,c,cut),month=c.month>cut?c.month:future[0];
  if(state.overpaid)issues.push({level:'warning',message:`${c.name}: payments exceed the uncancelled commitment by $${state.overpaid.toFixed(2)}.`});
  if(state.open&&c.month<=cut)issues.push({level:'warning',message:month?`${c.name}: unpaid commitment moved to the next forecast month; confirm timing.`:`${c.name}: $${state.open.toFixed(2)} remains unpaid after the project period.`});
  rows.push({...c,...state,forecastMonth:month});
 }
 return {rows,issues};
}
