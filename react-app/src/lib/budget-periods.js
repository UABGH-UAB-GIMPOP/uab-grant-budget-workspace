import {cents} from './money.js';
// Month-grain budget allocation periods. Personnel year switches remain grant-year based.
const categories=['Personnel','Supplies','Travel','Other','Equipment','Patient care','Tuition','Participant support','Consultants','Consortium/Contractual (Subawards)'];
const index=value=>{if(typeof value!=='string'||!/^\d{4}-(0[1-9]|1[0-2])$/.test(value))throw Error('Budget periods require YYYY-MM dates.');const [y,m]=value.split('-').map(Number);return y*12+m-1;};
const label=value=>String(Math.floor(value/12)).padStart(4,'0')+'-'+String(value%12+1).padStart(2,'0');
const clone=value=>JSON.parse(JSON.stringify(value));
export function validateBudgetPeriods(project){
 if(project.budgetPeriods===undefined)return [];
 try {
  const start=index(project.grant.start),end=index(project.grant.end),periods=project.budgetPeriods;
  if(end<start||end-start>=120)throw Error('Project length must be 1–120 months.');
  if(!Array.isArray(periods)||!periods.length||periods.length>120)throw Error('Explicit budget periods must be a nonempty list.');
  let cursor=start;const ids=new Set();
  for(const p of periods){
   if(!p||typeof p.id!=='string'||!p.id.trim()||p.id.length>200||ids.has(p.id))throw Error('Budget period IDs must be stable, nonempty and unique.');
   ids.add(p.id);const a=index(p.start),b=index(p.end);
   if(a!==cursor||b<a||b>end)throw Error('Budget periods must be ordered, nonoverlapping and cover the project without gaps.');
   if(!p.allocations||typeof p.allocations!=='object'||Array.isArray(p.allocations))throw Error('Each period needs explicit category allocations.');
   if(Object.keys(p.allocations).some(c=>!categories.includes(c)))throw Error('Unknown budget-period category.');
   for(const c of categories)if(typeof p.allocations[c]!=='number'||!Number.isFinite(p.allocations[c])||p.allocations[c]<0||p.allocations[c]>Number.MAX_SAFE_INTEGER/100)throw Error('Every category needs an explicit finite nonnegative allocation, including zero.');
   cursor=b+1;
  }
  if(cursor!==end+1)throw Error('Budget periods must cover the complete project.');
  return [];
 }catch(e){return [{level:'error',message:e.message}];}
}
export function allocationPeriods(project){
 const errors=validateBudgetPeriods(project);if(errors.length)throw Error(errors[0].message);
 if(project.budgetPeriods!==undefined)return clone(project.budgetPeriods);
 const start=index(project.grant.start),end=index(project.grant.end);
 if(end<start||end-start>=120)throw Error('Project length must be 1–120 months.');
 return Array.from({length:Math.ceil((end-start+1)/12)},(_,i)=>({id:`legacy-year-${i+1}`,start:label(start+i*12),end:label(Math.min(start+i*12+11,end)),allocations:Object.fromEntries(categories.map(c=>[c,Number(project.planned[c]?.[i]||0)]))}));
}
export function previewLegacyPeriods(project){
 if(project.budgetPeriods!==undefined)throw Error('Project already has explicit periods.');
 const count=Math.ceil((index(project.grant.end)-index(project.grant.start)+1)/12);
 // Never silently discard allocations outside the existing project window.
 for(const amounts of Object.values(project.planned||{}))if(!Array.isArray(amounts)||amounts.length>count)throw Error('Legacy allocations require manual mapping; no migration applied.');
 const periods=allocationPeriods(project),errors=validateBudgetPeriods({...project,budgetPeriods:periods});
 if(errors.length)throw Error(errors[0].message);
 return {periods,originalPlanned:clone(project.planned),basis:{start:project.grant.start,end:project.grant.end},message:'Preview only. Legacy annual arrays remain preserved; explicit periods become the allocation authority only after confirmation.'};
}
export function applyLegacyPeriods(project,review){
 const current=previewLegacyPeriods(project);
 if(JSON.stringify(current)!==JSON.stringify(review))throw Error('Period mapping changed; review again.');
 return {...clone(project),budgetPeriods:clone(current.periods)};
}
export function splitBudgetPeriod(periods,id){
 const next=clone(periods),i=next.findIndex(p=>p.id===id);if(i<0)throw Error('Budget period not found.');const p=next[i],a=index(p.start),b=index(p.end),length=b-a+1;if(length<2)throw Error('A one-month period cannot be split.');const left=Math.floor(length/2),first={},second={};
 for(const [cat,amount] of Object.entries(p.allocations)){const total=cents(amount),part=Math.floor(total/length)*left+Math.min(total%length,left);first[cat]=part/100;second[cat]=(total-part)/100;}
 let suffix=1,newId=id+'-split-'+suffix;while(next.some(p=>p.id===newId))newId=id+'-split-'+(++suffix);
 next.splice(i,1,{...p,end:label(a+left-1),allocations:first},{id:newId,start:label(a+left),end:p.end,allocations:second});return next;
}
export function mergeBudgetPeriod(periods,id){
 const next=clone(periods),i=next.findIndex(p=>p.id===id);if(i<0||i===next.length-1)throw Error('Choose a period with a following period.');const a=next[i],b=next[i+1];if(index(b.start)!==index(a.end)+1)throw Error('Only adjacent periods can merge.');next.splice(i,2,{...a,end:b.end,allocations:Object.fromEntries(categories.map(c=>[c,(cents(a.allocations[c])+cents(b.allocations[c]))/100]))});return next;
}
export function movePeriodBoundary(periods,id,end){
 const next=clone(periods),i=next.findIndex(p=>p.id===id);if(i<0||i===next.length-1)throw Error('The final boundary is the project end.');const boundary=index(end);if(boundary<index(next[i].start)||boundary>=index(next[i+1].end))throw Error('Both neighboring periods must contain at least one month.');next[i].end=end;next[i+1].start=label(boundary+1);return next;
}

export function periodAllocationTotals(periods){
 return Object.fromEntries(categories.map(c=>[c,periods.reduce((total,p)=>{const next=total+cents(p.allocations[c]);if(!Number.isSafeInteger(next))throw Error("Allocation total exceeds supported precision.");return next;},0)/100]));
}
