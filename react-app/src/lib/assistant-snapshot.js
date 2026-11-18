// The AI receives calculation inputs only. Names, notes, document links, source
// text, identifiers, audit history and arbitrary imported fields are excluded.
const fields = {
  grant:['start','end','asOf','mode','indirect','base','salaryCap','ruleStatus','eligible','reconciled','source','ruleSource'],
  person:['salary','effort','fringe','appointment','appointmentFte','start','end','years','eff','raiseDate','raisePct'],
  ledger:['cat','month','amount','commitmentId','commitmentAmount'],
  supply:['qty','unit','month'], cost:['cat','month','amount'],
  subaward:['start','end','total','subj'], subPay:['sub','month','amount'],
  commitment:['category','amount','cancelled','month'], schedule:['month','amount'],
  rate:['kind','month','value','personId'],
};
const cats=['Personnel','Supplies','Travel','Other','Equipment','Patient care','Tuition','Participant support','Consultants','Consortium/Contractual (Subawards)'];
const obj=x=>x&&typeof x==='object'&&!Array.isArray(x);
function pick(value,allowed,strict){
 if(!obj(value))throw Error('Malformed budget snapshot');
 if(strict&&Object.keys(value).some(k=>!allowed.includes(k)))throw Error('Unexpected budget snapshot field');
 return Object.fromEntries(allowed.filter(k=>Object.hasOwn(value,k)).map(k=>[k,value[k]]));
}
function records(rows,allowed,strict,transform=x=>x){
 if(!Array.isArray(rows)||rows.length>10000)throw Error('Malformed budget snapshot');
 return rows.map((x,i)=>transform(pick(x,allowed,strict),x,i));
}
/** @param {unknown} input @param {{strict?:boolean,projectId?:string}} [options] */
export function sanitizeAssistantSnapshot(input,{strict=false,projectId}={}){
 if(!obj(input))throw Error('Malformed budget snapshot');
 const allowedRoot=['id','grant','planned','scenario','assume','people','ledger','supplies','subawards','subPays','costs','postedFa','rateChanges','budgetPeriods','commitments','importBatches','audit','statements'];
 const p=pick(input,allowedRoot,strict);
 if(!obj(p.grant)||!obj(p.planned)||!obj(p.scenario)||!obj(p.assume))throw Error('Malformed budget snapshot');
 const id=projectId??p.id;
 if(typeof id!=='string'||! /^[A-Za-z0-9_-]{1,200}$/.test(id))throw Error('Invalid project identifier');
 const peopleIds=new Map((p.people||[]).map((x,i)=>[String(x?.id),`person-${i+1}`]));
 const subIds=new Map((p.subawards||[]).map((x,i)=>[String(x?.id),`subaward-${i+1}`]));
 const commitIds=new Map((p.commitments||[]).map((x,i)=>[String(x?.id),`commitment-${i+1}`]));
 const costIds=new Map(),supplyIds=new Map((p.supplies||[]).map((x,i)=>[String(x?.id),`supply-${i+1}`]));
 const grant=pick(p.grant,fields.grant,strict);grant.source='Saved synthetic budget';grant.ruleSource='Saved award assumptions';
 if(grant.eligible!==undefined&&(!Array.isArray(grant.eligible)||grant.eligible.length>cats.length||new Set(grant.eligible).size!==grant.eligible.length||grant.eligible.some(c=>!cats.includes(c))))throw Error('Invalid eligible categories');
 const planned={};for(const [k,v] of Object.entries(p.planned)){if(!cats.includes(k)||!Array.isArray(v)||v.length>120||v.some(n=>typeof n!=='number'||!Number.isFinite(n)||n<0))throw Error('Invalid planned allocation');planned[k]=v;}
 const people=records(p.people||[],[...fields.person,'changes','id','name'],strict,(r,raw,i)=>{
  r.id=`person-${i+1}`;r.name=`Personnel ${i+1}`;
  if(r.years!==undefined&&(!Array.isArray(r.years)||r.years.length>120||r.years.some(v=>typeof v!=='boolean')))throw Error('Invalid personnel years');
  if(r.eff!==undefined){if(!obj(r.eff)||Object.keys(r.eff).length>120||Object.entries(r.eff).some(([m,v])=>!/^(\d{4})-(0[1-9]|1[0-2])$/.test(m)||typeof v!=='number'||!Number.isFinite(v)||v<0||v>100))throw Error('Invalid personnel effort');}
  if(r.changes)r.changes=records(r.changes,['month','salary','percent','repeat','source'],strict,(c)=>{if(c.repeat)c.repeat=pick(c.repeat,['everyMonths','through'],strict);c.source='Saved salary assumption';return c;});
  return r;
 });
 const supplies=records(p.supplies||[],['qty','unit','month','id','classification','eligibilityReview','eligibilitySource','eligibilityNote'],strict,(r,raw,i)=>{r.id=`supply-${i+1}`;for(const field of ['classification','eligibilityReview','eligibilitySource','eligibilityNote'])delete r[field];return r;});
 const costs=records(p.costs||[],['cat','month','amount','id'],strict,(r,raw,i)=>{r.id=`cost-${i+1}`;costIds.set(String(raw.id),r.id);return r;});
 const commitments=records(p.commitments||[],[...fields.commitment,'id','name','source','schedule','revisions','link'],strict,(r,raw,i)=>{
  r.id=`commitment-${i+1}`;r.name=`Commitment ${i+1}`;r.source='Saved budget assumption';
  if(r.schedule)r.schedule=records(r.schedule,['month','amount','id'],strict,(row,_raw,j)=>({...row,id:`payment-${i+1}-${j+1}`}));
  if(r.revisions)r.revisions=records(r.revisions,['from','to','at','source','previousSource','reason'],strict,(row,j)=>({...row,source:'Saved budget assumption',previousSource:'Saved budget assumption',reason:'Saved budget assumption'}));
  if(r.link){const l=pick(r.link,['type','id'],strict);l.id=l.type==='supply'?supplyIds.get(String(raw.link.id)):costIds.get(String(raw.link.id));if(!l.id)throw Error('Invalid modeled cost link');r.link=l;}
  return r;
 });
 const ledger=records(p.ledger||[],[...fields.ledger,'id','personId','commitmentAllocations'],strict,(r,raw,i)=>{
  r.id=`ledger-${i+1}`;
  if(r.personId!=null){r.personId=peopleIds.get(String(raw.personId));if(!r.personId)throw Error('Invalid personnel reference');}
  if(r.commitmentId!=null){r.commitmentId=commitIds.get(String(raw.commitmentId));if(!r.commitmentId)throw Error('Invalid commitment reference');}
  if(raw.commitmentAllocations){r.commitmentAllocations=records(raw.commitmentAllocations,['commitmentId','amount'],strict,a=>{const id=commitIds.get(String(a.commitmentId));if(!id)throw Error('Invalid commitment reference');return {...a,commitmentId:id};});delete r.commitmentId;delete r.commitmentAmount;}
  return r;
 });
 const subawards=records(p.subawards||[],[...fields.subaward,'id','name'],strict,(r,raw,i)=>{r.id=`subaward-${i+1}`;r.name=`Subaward ${i+1}`;return r;});
 const subPays=records(p.subPays||[],[...fields.subPay,'id'],strict,(r,raw,i)=>{r.id=`subpayment-${i+1}`;r.sub=subIds.get(String(raw.sub));if(!r.sub)throw Error('Invalid subaward reference');return r;});
 const rateChanges=records(p.rateChanges||[],[...fields.rate,'id','source'],strict,(r,raw,i)=>{r.id=`rate-${i+1}`;if(r.personId!=null){r.personId=peopleIds.get(String(raw.personId));if(!r.personId)throw Error('Invalid personnel reference');}r.source='Saved rate assumption';return r;});
 let budgetPeriods;
 if(p.budgetPeriods!==undefined)budgetPeriods=records(p.budgetPeriods,['start','end','allocations','id'],strict,(r,raw,i)=>{if(!obj(r.allocations)||Object.keys(r.allocations).some(k=>!cats.includes(k))||Object.values(r.allocations).some(v=>typeof v!=='number'||!Number.isFinite(v)||v<0))throw Error('Invalid budget period allocations');return {...r,id:`period-${i+1}`};});
 let postedFa;
 if(p.postedFa!==undefined){if(!obj(p.postedFa)||Object.keys(p.postedFa).length>120||Object.values(p.postedFa).some(v=>typeof v!=='number'||!Number.isFinite(v)))throw Error('Invalid posted F&A');postedFa=p.postedFa;}
 const scenario=pick(p.scenario,['qty','cost'],strict),assume=pick(p.assume,['Travel','Other'],strict);
 if(['qty','cost'].some(k=>scenario[k]!==undefined&&(typeof scenario[k]!=='number'||!Number.isFinite(scenario[k])))||['Travel','Other'].some(k=>assume[k]!==undefined&&assume[k]!==null&&(typeof assume[k]!=='number'||!Number.isFinite(assume[k]))))throw Error('Invalid scenario assumptions');
 if(strict&&['importBatches','audit','statements'].some(k=>p[k]!==undefined&&(!Array.isArray(p[k])||p[k].length)))throw Error('Unexpected budget snapshot metadata');
 const result={id,grant,planned,scenario,assume,people,ledger,supplies,subawards,subPays,costs,commitments,rateChanges,importBatches:[],audit:[],statements:[]};
 if(postedFa!==undefined)result.postedFa=postedFa;if(budgetPeriods!==undefined)result.budgetPeriods=budgetPeriods;
 // Check model inputs before transmission and again at the Worker boundary.
 return result;
}
export async function assistantSnapshotRevision(project){
 const bytes=new TextEncoder().encode(JSON.stringify(project));
 return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(b=>b.toString(16).padStart(2,'0')).join('');
}
