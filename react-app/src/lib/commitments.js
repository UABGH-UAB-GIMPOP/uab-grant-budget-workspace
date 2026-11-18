import {cents} from './money.js';
const validMonth=m=>typeof m==='string'&&/^\d{4}-(0[1-9]|1[0-2])$/.test(m);
export function settlementAllocations(entry){
 if(entry.commitmentAllocations===undefined)return entry.commitmentId===undefined?[]:[{commitmentId:entry.commitmentId,amount:entry.commitmentAmount??entry.amount}];
 const rows=entry.commitmentAllocations;
 if(entry.commitmentId!==undefined||entry.commitmentAmount!==undefined)throw Error('Use a single linked commitment or split allocations, not both.');if(!Array.isArray(rows)||!rows.length||rows.length>100)throw Error('Enter between 1 and 100 split allocations.');
 const seen=new Set();let total=0;const transaction=cents(entry.amount);
 for(const row of rows){if(!row||typeof row!=='object'||Array.isArray(row)||Object.keys(row).some(k=>!['commitmentId','amount'].includes(k))||typeof row.commitmentId!=='string'||!row.commitmentId.trim())throw Error('Choose a commitment for every allocation.');if(seen.has(row.commitmentId))throw Error('Each commitment can appear only once per transaction.');if(typeof row.amount!=='number'||!Number.isFinite(row.amount)||row.amount===0)throw Error('Allocation amounts must be nonzero numbers.');const amount=cents(row.amount);if(amount/100!==row.amount)throw Error('Allocation amounts must use no more than two decimal places.');if(Math.sign(amount)!==Math.sign(transaction))throw Error('Allocation amounts must match the transaction sign.');seen.add(row.commitmentId);total+=Math.abs(amount);if(!Number.isSafeInteger(total)||total>Math.abs(transaction))throw Error('Split allocations exceed the transaction amount.');}
 return rows.map(row=>({commitmentId:row.commitmentId,amount:row.amount}));
}
export function validateCommitments(p){
 const errors=[],fail=message=>errors.push({level:'error',message});
 if(p.commitments===undefined){if(p.ledger.some(e=>e.commitmentId!==undefined||e.commitmentAmount!==undefined||e.commitmentAllocations!==undefined))fail('Settlement references a missing commitment.');return errors;}
 if(!Array.isArray(p.commitments))return [{level:'error',message:'Commitments must be a list.'}];
 const ids=new Set(),linked=new Set();
 for(const c of p.commitments){
  if(!c||typeof c.id!=='string'||!c.id||ids.has(c.id)){fail('Commitments need unique IDs.');continue}ids.add(c.id);
  if(!['Supplies','Travel','Other','Equipment','Patient care','Tuition','Participant support','Consultants'].includes(c.category)||typeof c.name!=='string'||!c.name.trim()||typeof c.source!=='string'||!c.source.trim()||!Number.isFinite(c.amount)||c.amount<0||!Number.isFinite(c.cancelled)||c.cancelled<0||c.cancelled>c.amount||!validMonth(c.month)||c.month<p.grant.start||c.month>p.grant.end)fail('Commitment needs a name, source, supported category, project month and nonnegative authorized/cancelled amounts.');
  if(c.revisions!==undefined){
   const validMoney=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&cents(v)/100===v;
   if(!Array.isArray(c.revisions)||!c.revisions.length||c.revisions.length>1000)fail('Invalid commitment revision history.');
   else {for(const [i,r] of c.revisions.entries())if(!r||!validMoney(r.from)||!validMoney(r.to)||r.from===r.to||typeof r.at!=='string'||!Number.isFinite(Date.parse(r.at))||['source','previousSource','reason'].some(k=>typeof r[k]!=='string'||!r[k].trim()||r[k].length>1000)||(i>0&&(r.from!==c.revisions[i-1].to||r.previousSource!==c.revisions[i-1].source)))fail('Invalid commitment revision history.');const last=c.revisions.at(-1);if(last?.to!==c.amount||last?.source!==c.source)fail('Commitment revision history must match its current amount and source.');}
  }
  if(c.schedule!==undefined){const seen=new Set();if(!Array.isArray(c.schedule)||c.schedule.length===0||c.schedule.length>120||c.schedule.some(x=>!x||typeof x.id!=='string'||!x.id||seen.has(x.id)||(seen.add(x.id),false)||!validMonth(x.month)||x.month<p.grant.start||x.month>p.grant.end||typeof x.amount!=='number'||!Number.isFinite(x.amount)||x.amount<=0)||c.schedule.reduce((n,x)=>n+cents(x.amount),0)!==cents(c.amount))fail('Payment schedule must have unique rows within the project and total the authorized amount.');}
  if(c.link){const key=c.link.type+':'+c.link.id,list=c.link.type==='supply'?p.supplies:c.link.type==='cost'?p.costs:undefined,row=list?.find(r=>String(r.id)===String(c.link.id));if(c.link.id===undefined||c.link.id===null||c.link.id===''||!row||linked.has(key)||(c.link.type==='supply'?'Supplies':row.cat)!==c.category)fail('Each modeled cost can link to one commitment in the same category.');linked.add(key)}
 }
 for(const e of p.ledger){if(e.commitmentAllocations!==undefined){try{for(const allocation of settlementAllocations(e)){const c=p.commitments.find(c=>c?.id===allocation.commitmentId);if(!c||e.cat!==c.category)fail('Settlement must reference a commitment in the same category.')}}catch(error){fail(error.message)}continue;}if(e.commitmentAmount!==undefined){const a=e.commitmentAmount;if(e.commitmentId===undefined||!Number.isFinite(a)||Math.abs(cents(a))>Math.abs(cents(e.amount))||(a!==0&&Math.sign(a)!==Math.sign(e.amount)))fail('Allocated settlement must have a commitment, match the transaction sign and not exceed its amount.')}if(e.commitmentId!==undefined){const c=p.commitments.find(c=>c?.id===e.commitmentId);if(!c||e.cat!==c.category)fail('Settlement must reference a commitment in the same category.')}}
 return errors;
}
export function commitmentState(p,c,cut){
 const paid=p.ledger.filter(e=>e.month>=p.grant.start&&e.month<=p.grant.end&&e.month<=cut).reduce((t,e)=>t+settlementAllocations(e).filter(a=>a.commitmentId===c.id).reduce((n,a)=>n+cents(a.amount),0),0);
 const net=cents(c.amount)-cents(c.cancelled),open=Math.max(0,net-paid);
 return {paid:paid/100,open:open/100,overpaid:Math.max(0,paid-net)/100};
}
export function scheduledPayments(c,state,future,cut){
 const schedule=(c.schedule??[{id:'single',month:c.month,amount:c.amount}]).map(x=>({...x,cents:cents(x.amount)})).sort((a,b)=>a.month.localeCompare(b.month)||a.id.localeCompare(b.id));
 let cancelled=cents(c.cancelled);for(let i=schedule.length-1;i>=0;i--){const amount=Math.min(cancelled,schedule[i].cents);schedule[i].cents-=amount;cancelled-=amount;}
 let paid=cents(state.paid);const rows=[];for(const item of schedule){const outstanding=Math.max(0,item.cents-paid);paid=Math.max(0,paid-item.cents);if(outstanding)rows.push({id:item.id,scheduledMonth:item.month,month:item.month>cut?item.month:future[0]??null,amount:outstanding/100});}
 return rows;
}
export function commitmentForecast(p,months,cut){
 const future=months.filter(m=>m>cut),rows=[],issues=[];
 for(const c of p.commitments||[]){const state=commitmentState(p,c,cut),payments=scheduledPayments(c,state,future,cut),month=payments.find(x=>x.month)?.month;
  if(state.overpaid)issues.push({level:'warning',message:`${c.name}: payments exceed the uncancelled commitment by $${state.overpaid.toFixed(2)}.`});
  if(payments.some(x=>x.scheduledMonth<=cut))issues.push({level:'warning',message:month?`${c.name}: unpaid scheduled payments moved to the next forecast month; confirm timing.`:`${c.name}: $${state.open.toFixed(2)} remains unpaid after the project period.`});
  rows.push({...c,...state,forecastMonth:month,payments});
 }
 return {rows,issues};

}
