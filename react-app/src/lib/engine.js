import {validateSharedPersonnelKey} from './personnel-identity.js';
import {effectiveAppointmentFte,validateAppointmentFte} from './appointment-fte.js';
import {reconciliationStatus} from './reconciliation.js';
import {referenceIdentity,validateImportProvenance} from './import-provenance.js';
import {effectiveRate,validateRates} from './rates.js';
import {allocationPeriods,validateBudgetPeriods} from './budget-periods.js';
import {validateCommitments,commitmentForecast,settlementAllocations} from './commitments.js';
import {validateSupplyPlanning} from './supply-planning.js';
/* Synthetic prototype calculation engine. No network or institutional authorization. */

'use strict';
const CATS=['Personnel','Supplies','Travel','Other','Equipment','Patient care','Tuition','Participant support','Consultants'];
const SUB='Consortium/Contractual (Subawards)';
import {cents} from './money.js';
const safe=x=>{if(!Number.isSafeInteger(x))throw Error('Amount exceeds supported precision.');return x};
const usd=x=>safe(x)/100;
const mi=m=>{if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(m||''))throw Error('Use a valid month (YYYY-MM).');const [y,n]=m.split('-').map(Number);return y*12+n-1};
const month=i=>`${Math.floor(i/12)}-${String(i%12+1).padStart(2,'0')}`;
const months=(a,b)=>{const n=mi(b)-mi(a)+1;if(n<1||n>120)throw Error('Project length must be 1–120 months.');return Array.from({length:n},(_,i)=>month(mi(a)+i))};
const sum=a=>a.reduce((x,y)=>safe(x+y),0);
const spread=(value,n)=>{if(!n)return [];const total=cents(value),q=Math.trunc(total/n),r=total-q*n;return Array.from({length:n},(_,i)=>usd(q+(i<Math.abs(r)?Math.sign(r):0)))};
const active=(s,p,m)=>m>= (p.start||s.grant.start)&&m<=(p.end||s.grant.end)&&(!p.years||p.years[Math.floor((mi(m)-mi(s.grant.start))/12)]!==false);
const effort=(s,p,m)=>active(s,p,m)?Number(p.eff?.[m]??p.effort):0;
function validateSalaryRepeat(event){
 if(event.repeat===undefined)return;
 const r=event.repeat;
 if(!r||typeof r!=='object'||Array.isArray(r)||Object.keys(r).some(k=>!['everyMonths','through'].includes(k))||!Number.isInteger(r.everyMonths)||r.everyMonths<1||r.everyMonths>120||typeof r.through!=='string'||typeof event.month!=='string'||event.salary!=null||typeof event.percent!=='number'||!Number.isFinite(event.percent)||event.percent< -100||event.percent>200||typeof event.source!=='string'||!event.source.trim())throw Error('Invalid recurring salary change.');
 const span=mi(r.through)-mi(event.month);if(span<0||span>119)throw Error('Recurring salary changes must end within 120 months of their first occurrence.');
}
export function salaryEvents(p,through){
 // Same-month compatibility: legacy raise first, then explicit changes in array order.
 const horizon=through===undefined?Infinity:mi(through),events=[];
 for(const [index,event] of [...(p.raiseDate?[{month:p.raiseDate,percent:Number(p.raisePct||0),legacy:true}]:[]),...(p.changes||[])].entries()){
  validateSalaryRepeat(event);
  if(event.repeat===undefined){if(through===undefined||mi(event.month)<=horizon)events.push({...event,sourceMonth:event.month,index});continue;}
  const start=mi(event.month),end=Math.min(mi(event.repeat.through),horizon);
  for(let at=start;at<=end;at+=event.repeat.everyMonths)events.push({...event,sourceMonth:event.month,month:month(at),index});
 }
 return events.sort((a,b)=>a.month.localeCompare(b.month)||a.index-b.index);
}
function salary(p,m){
 let sal=Number(p.salary);
 for(const r of salaryEvents(p,m))if(m>=r.month)sal=r.salary!=null?Number(r.salary):sal*(1+Number(r.percent)/100);
 return sal;
}
function person(s,p,m){const e=effort(s,p,m)/100,appt=Number(p.appointment||12),gross=salary(p,m)/appt*e;const capRate=effectiveRate(s,'salaryCap',m,s.grant.salaryCap||0),cap=capRate>0?capRate/12*effectiveAppointmentFte(s,p,m)*e:Infinity;const charged=Math.min(gross,cap),fr=effectiveRate(s,'fringe',m,p.fringe,p.id)/100;return {salary:usd(cents(gross)),charged:usd(cents(charged)),excess:usd(cents(gross-charged)),fringe:usd(cents(charged*fr)),cost:usd(cents(charged)+cents(charged*fr)),effort:e*100};}
function validateState(s){let amounts=null;if(!s||!s.grant||!s.planned||!s.scenario||!s.assume||![s.people,s.ledger,s.supplies,s.subawards,s.subPays].every(Array.isArray))return {issues:[{level:"error",message:"Incomplete project structure."}],amounts:null};const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
 if(![s.grant,s.planned,s.scenario,s.assume].every(obj)||![s.people,s.ledger,s.supplies,s.subawards,s.subPays,s.costs||[]].every(a=>Array.isArray(a)&&a.every(obj))||!Object.values(s.planned).every(Array.isArray)||s.people.some(p=>(p.changes!=null&&(!Array.isArray(p.changes)||!p.changes.every(obj)))||(p.eff!=null&&!obj(p.eff))||(p.years!=null&&!Array.isArray(p.years)))||(s.postedFa!=null&&!obj(s.postedFa)))return {issues:[{level:'error',message:'Malformed project records.'}],amounts:null};
 const issues=[];let ms=[];try{ms=months(s.grant.start,s.grant.end);mi(s.grant.asOf)}catch(e){return {issues:[{level:'error',message:e.message}],amounts:null}}
 const issue=(message,level='warning')=>issues.push({level,message});
 if(s.grant.asOf>s.grant.end)issue('Known-through is after the project end; actuals remain restricted to the project period.');
 if(!s.grant.source)issue('No source reference is recorded for the reported actuals.');
 try{if(!reconciliationStatus(s).matched&&s.grant.mode!=='proposal'&&s.grant.asOf>=s.grant.start)issue('Reported actuals are not reconciled. A missing historical expense is not proof of zero spending.');}catch(e){issue(e.message,'error')}
 if(!s.grant.ruleSource)issue('F&A profile has no source reference.');
 if(s.grant.ruleStatus!=='confirmed')issue('Rate and threshold profile is an assumption awaiting award-specific review.');
 if(!Number.isFinite(Number(s.grant.salaryCap||0))||Number(s.grant.salaryCap||0)<0)issue("Salary cap must be zero or positive.","error");for(const k of ["Travel","Other"])if(s.assume[k]!=null&&(!Number.isFinite(Number(s.assume[k]))||s.assume[k]<0))issue("Monthly assumptions must be nonnegative numbers.","error");for(const list of [s.people,s.ledger,s.supplies,s.subawards,s.subPays,s.costs||[]]){const seen=new Set();for(const row of list){if(row.id!=null){if(!/^[A-Za-z0-9_-]+$/.test(String(row.id))||seen.has(String(row.id)))issue("Invalid or duplicate record ID.","error");seen.add(String(row.id))}}}for(const [k,v] of Object.entries(s.postedFa||{}))if(typeof v!=='number'||!Number.isFinite(v))issue('Posted F&A must be a finite number; omit months with no posted amount.','error');for(const k of ['qty','cost'])if(!Number.isFinite(Number(s.scenario[k]||0))||Number(s.scenario[k]||0)<-100||Number(s.scenario[k]||0)>1000)issue('Invalid scenario percentage.','error');if(!['award','proposal'].includes(s.grant.mode)||!['MTDC','TDC'].includes(s.grant.base))issue('Unsupported workspace mode or F&A base.','error');
 for(const cat of Object.keys(s.planned))if(![...CATS,SUB].includes(cat))issue('Unknown planned budget category.','error');
 for(const m of Object.keys(s.postedFa||{})){try{mi(m)}catch(e){issue('Invalid posted F&A month.','error')}}
 const ids=new Set();for(const p of s.people){issues.push(...validateSharedPersonnelKey(p),...validateAppointmentFte(p));if(!p.id||ids.has(p.id))issue('Personnel IDs must be unique.','error');ids.add(p.id);for(const [key,lo,hi] of [['salary',0,10000000],['effort',0,100],['fringe',0,200],['raisePct',-100,200]]){const required=['salary','effort','fringe'].includes(key),raw=p[key],v=required?raw:Number(raw||0);if((required&&typeof raw!=='number')||!Number.isFinite(v)||v<lo||v>hi)issue(`${p.name}: invalid ${key}.`,'error')}if(p.appointment!==undefined&&p.appointment!==null&&p.appointment!==''&&(!['number','string'].includes(typeof p.appointment)||![9,10,11,12].includes(Number(p.appointment))))issue(`${p.name}: appointment must be 9, 10, 11 or 12 months.`,'error');for(const [m,e] of Object.entries(p.eff||{}))if(!Number.isFinite(Number(e))||Number(e)<0||Number(e)>100)issue(`${p.name}: effort must be 0–100%.`,'error');if(Number(p.appointment||12)!==12)issue(`${p.name}: verify active academic/summer months; prototype uses monthly proration.`);for(const date of [p.start,p.end,...Object.keys(p.eff||{})].filter(x=>x!=null&&x!=='')){try{mi(date)}catch(e){issue(`${p.name}: invalid assignment or effort month.`,'error')}}
 if(p.start&&p.end&&p.start>p.end)issue(`${p.name}: assignment end precedes start.`,'error');
 for(const r of p.changes||[]){try{validateSalaryRepeat(r)}catch(e){issue(e.message,'error')}try{mi(r.month)}catch(e){issue(`${p.name}: invalid salary-change month.`,'error')}const hasSalary=r.salary!=null,hasPercent=r.percent!=null,raw=hasSalary?r.salary:r.percent,v=Number(raw);if(hasSalary===hasPercent||typeof raw==='boolean'||!['number','string'].includes(typeof raw)||(typeof raw==='string'&&!raw.trim())||!Number.isFinite(v)||(hasSalary?v<0||v>10000000:v< -100||v>200))issue(`${p.name}: invalid salary change.`,'error')}
 if(p.raiseDate){try{mi(p.raiseDate)}catch(e){issue(`${p.name}: invalid raise month.`,'error')}}}
 for(const row of s.supplies){if(row.note!==undefined&&(typeof row.note!=='string'||row.note.length>2000))issue('Supply notes must be text of at most 2,000 characters.','error');for(const message of validateSupplyPlanning(row))issue(message,'error')}
 for(const [kind,rows] of [['Entry',s.ledger],['Subaward payment',s.subPays],['Supply',s.supplies],['Planned cost',s.costs||[]]])for(const e of rows){try{mi(e.month)}catch(x){issue(`${kind}: invalid month.`,'error');continue}if(!ms.includes(e.month))issue(`${kind} ${e.note||e.name||e.id}: outside the project period; excluded from totals.`);const v=kind==='Supply'?Number(e.qty)*Number(e.unit):Number(e.amount);if(!Number.isFinite(v))issue(`${kind}: amount must be finite.`,'error');if(kind==='Supply'&&(Number(e.qty)<0||Number(e.unit)<0))issue('Supply quantity and price cannot be negative.','error');if((kind==='Entry'||kind==='Planned cost')&&!CATS.includes(e.cat))issue(`Unmapped category ${e.cat}; map it before importing.`,'error');if(e.personId&&!ids.has(e.personId))issue('An entry references a missing person.','error')}
 for(const a of s.subawards){if(!Number.isFinite(Number(a.total))||a.total<0||!Number.isFinite(Number(a.subj))||a.subj<0||a.subj>a.total)issue(`${a.name}: eligible base must be between zero and award total.`,'error');try{if(mi(a.end)<mi(a.start))issue(`${a.name}: end precedes start.`,'error')}catch(e){issue(`${a.name}: invalid subaward dates.`,'error')}}
 const refs=new Set();for(const e of s.ledger){if(e.reference){if(refs.has(referenceIdentity(e)))issue(`Duplicate source reference ${e.reference}.`,'error');refs.add(referenceIdentity(e))}}
 for(const e of s.subPays)if(!s.subawards.some(a=>String(a.id)===String(e.sub)))issue('Payment references a missing subaward.','error');
 for(const [cat,vals] of Object.entries(s.planned))for(const v of vals)if(!Number.isFinite(Number(v))||Number(v)<0)issue(`Invalid ${cat} budget allocation.`,'error');
 if(!Number.isFinite(Number(s.grant.indirect))||s.grant.indirect<0||s.grant.indirect>100)issue('F&A rate must be 0–100%.','error');
 const checked=[...issues];
 for(const check of [validateCommitments,validateRates,validateBudgetPeriods,validateImportProvenance])try{checked.push(...check(s))}catch(e){checked.push({level:'error',message:e.message})}
 // Validate modeled monetary precision before draft acceptance; never call calculate here.
 if(!checked.some(x=>x.level==='error'))for(const p of s.people){try{for(const m of ms){const model=person(s,p,m);for(const key of ['salary','charged','excess','fringe','cost'])cents(model[key]);}}catch(e){checked.push({level:'error',message:`${p.name||p.id}: modeled personnel amount exceeds supported precision or is not finite.`});}}
 if(!checked.some(x=>x.level==='error'))try{
  for(const e of [...s.ledger,...s.subPays,...(s.costs||[])])cents(e.amount);
  for(const x of s.supplies){cents(x.unit);cents(Number(x.qty)*Number(x.unit));}
  for(const x of s.subawards){cents(x.total);cents(x.subj);}
  for(const values of Object.values(s.planned))for(const value of values)cents(value);
  for(const value of Object.values(s.postedFa||{}))cents(value);
  if(Array.isArray(s.statements))for(const statement of s.statements)if(statement&&statement.total!==undefined)cents(statement.total);
  for(const value of Object.values(s.assume))if(value!=null)cents(value);
  for(const c of s.commitments||[]){const net=safe(cents(c.amount)-cents(c.cancelled));const paid=sum(s.ledger.filter(e=>e.month>=s.grant.start&&e.month<=s.grant.end&&e.month<=s.grant.asOf).flatMap(e=>settlementAllocations(e).filter(a=>a.commitmentId===c.id).map(a=>cents(a.amount))));safe(net-paid);if(c.schedule)sum(c.schedule.map(r=>cents(r.amount)));}
  amounts=calculateAmounts(s);
 }catch(e){checked.push({level:'error',message:e.message})}
 return {issues:checked,amounts};
}
function calculateAmounts(s){const ms=months(s.grant.start,s.grant.end),ny=Math.ceil(ms.length/12),cut=s.grant.mode==='proposal'?mi(s.grant.start)-1:mi(s.grant.asOf),closed=ms.filter(m=>mi(m)<=cut),future=ms.filter(m=>mi(m)>cut),elapsed=closed.length;
 const periods=allocationPeriods(s);
 const cats=[...CATS,SUB],plan={},act={},proj={},base={plan:{},actual:{},proj:{}};
 for(const c of cats){plan[c]={};act[c]={};proj[c]={};for(const m of ms)plan[c][m]=act[c][m]=proj[c][m]=0;for(const period of periods){const ys=ms.filter(m=>m>=period.start&&m<=period.end);spread(period.allocations[c],ys.length).forEach((v,i)=>plan[c][ys[i]]=v)}}
 const eligible=c=>s.grant.base==='TDC'||(s.grant.eligible||['Personnel','Supplies','Travel','Other','Consultants']).includes(c);
 const add=(o,c,m,v)=>{o[c][m]=usd(cents(o[c][m]||0)+cents(v))};
 for(const e of s.ledger)if(CATS.includes(e.cat)&&closed.includes(e.month))add(act,e.cat,e.month,e.amount);
 for(const e of s.subPays)if(closed.includes(e.month)&&s.subawards.some(a=>String(a.id)===String(e.sub)))add(act,SUB,e.month,e.amount);
 const diagnostics=[];const subBase={plan:{},actual:{},proj:{}};for(const k of Object.keys(subBase))for(const m of ms)subBase[k][m]=0;
 for(const a of s.subawards){const paid=s.subPays.filter(e=>String(e.sub)===String(a.id)&&closed.includes(e.month));let paidC=sum(paid.map(e=>cents(e.amount)));const remaining=Math.max(0,cents(a.total)-paidC);const fm=future.filter(m=>m>=(a.start||s.grant.start)&&m<=(a.end||s.grant.end));if(remaining&&!fm.length){diagnostics.push({level:'warning',message:future.length?`${a.name}: overdue balance placed in the next forecast month; confirm payment timing.`:`${a.name}: forecast incomplete — ${usd(remaining).toFixed(2)} unpaid after the project period.`});if(future.length)fm.push(future[0]);}const allocations=spread(usd(remaining),fm.length);const flows={};for(const e of paid)flows[e.month]=safe((flows[e.month]||0)+cents(e.amount));fm.forEach((m,i)=>{add(proj,SUB,m,allocations[i]);flows[m]=safe((flows[m]||0)+cents(allocations[i]))});let cumulative=0;const threshold=cents(s.grant.base==='TDC'?a.total:a.subj);for(const m of ms){const before=Math.min(threshold,Math.max(0,cumulative));cumulative=safe(cumulative+(flows[m]||0));const increment=Math.min(threshold,Math.max(0,cumulative))-before;subBase.proj[m]+=usd(increment);if(closed.includes(m))subBase.actual[m]+=usd(increment)} }
 for(const m of closed)proj[SUB][m]=act[SUB][m];
 // Plan base consumes the aggregate explicit eligible amount chronologically, not a fraction.
 let plannedSubConsumed=0;const totalSubCap=sum(s.subawards.map(a=>cents(s.grant.base==='TDC'?a.total:a.subj)));for(const m of ms){const before=Math.min(totalSubCap,plannedSubConsumed);plannedSubConsumed=safe(plannedSubConsumed+cents(plan[SUB][m]));subBase.plan[m]=usd(Math.min(totalSubCap,plannedSubConsumed)-before)}
 const commitments=commitmentForecast(s,ms,month(cut));diagnostics.push(...commitments.issues);
 const covered=(type,id)=>(s.commitments||[]).some(c=>c.link?.type===type&&String(c.link.id)===String(id));
 const f=1+Number(s.scenario.qty||0)/100,k=1+Number(s.scenario.cost||0)/100;
 for(const m of ms)for(const c of CATS){let v=0;if(mi(m)<=cut)v=act[c][m];else if(c==='Personnel')v=sum(s.people.map(p=>cents(person(s,p,m).cost)))/100;else if(c==='Supplies')v=sum(s.supplies.filter(x=>x.month===m&&!covered('supply',x.id)).map(x=>cents(Number(x.qty)*f*Number(x.unit)*k)))/100;else if(c==='Travel'||c==='Other'){const av=elapsed?sum(closed.map(mm=>cents(act[c][mm])))/100/elapsed:0;v=s.assume[c]!=null?Number(s.assume[c]):av;}v+=mi(m)>cut?sum((s.costs||[]).filter(x=>x.cat===c&&x.month===m&&!covered('cost',x.id)).map(x=>cents(x.amount)))/100:0;if(mi(m)>cut)v+=sum(commitments.rows.filter(x=>x.category===c).flatMap(x=>x.payments.filter(payment=>payment.month===m).map(payment=>cents(payment.amount))))/100;proj[c][m]=usd(cents(v));}
 const faEstimatedActual={},fa={plan:{},actual:{},proj:{}}, cumulativeBase={plan:0,actual:0,proj:0}, priorFa={plan:0,actual:0,proj:0};let previousRate=null;for(const m of ms){const currentRate=effectiveRate(s,'indirect',m,s.grant.indirect);if(currentRate!==previousRate){for(const key of ['plan','actual','proj']){cumulativeBase[key]=0;priorFa[key]=0}previousRate=currentRate;}for(const [kind,o] of [['plan',plan],['actual',act],['proj',proj]]){base[kind][m]=usd(sum(CATS.filter(eligible).map(c=>cents(o[c][m])))+cents(subBase[kind][m]));cumulativeBase[kind]=safe(cumulativeBase[kind]+cents(base[kind][m]));const nextFa=cents(usd(cumulativeBase[kind])*currentRate/100);fa[kind][m]=usd(nextFa-priorFa[kind]);priorFa[kind]=nextFa;}faEstimatedActual[m]=fa.actual[m];if(closed.includes(m)&&s.postedFa?.[m]!=null){fa.actual[m]=Number(s.postedFa[m]);fa.proj[m]=Number(s.postedFa[m]);}}
 const total=o=>usd(sum(ms.map(m=>cents(o[m]||0))));const rows=cats.map(c=>{const p=total(plan[c]),a=total(act[c]),j=total(proj[c]);return {c:c===SUB?'Direct Consortium/Contractual':c,plan:p,actual:a,proj:j,toDatePlan:usd(sum(closed.map(m=>cents(plan[c][m])))),variance:usd(cents(p)-cents(j))}});
 const aggregate=(label,rs)=>Object.fromEntries([['c',label],...['plan','actual','proj','toDatePlan','variance'].map(k=>[k,usd(sum(rs.map(r=>cents(r[k]||0))))])]);const direct=aggregate('Total direct costs',rows);const idc={c:'Indirect (IDC)',plan:total(fa.plan),actual:total(fa.actual),proj:total(fa.proj),toDatePlan:usd(sum(closed.map(m=>cents(fa.plan[m]))))};idc.variance=usd(cents(idc.plan)-cents(idc.proj));const all=[...rows,direct,idc];const t=aggregate('Total',[direct,idc]);
 for(const c of ['Travel','Other'])if(!elapsed&&s.assume[c]==null)diagnostics.push({level:'warning',message:`${c}: no historical average is available; enter a monthly assumption.`});
 const curve={plan:[],actual:[],projected:[]};let cp=0,ca=0,cj=0;for(const m of ms){cp+=sum(cats.map(c=>cents(plan[c][m])))+cents(fa.plan[m]);ca+=sum(cats.map(c=>cents(act[c][m])))+cents(fa.actual[m]);cj+=sum(cats.map(c=>cents(proj[c][m])))+cents(fa.proj[m]);curve.plan.push(usd(cp));curve.actual.push(mi(m)<=cut?usd(ca):null);curve.projected.push(usd(cj));}
 return {forecastIncomplete:commitments.rows.some(x=>x.open&&!x.forecastMonth)||diagnostics.some(x=>x.message.includes('forecast incomplete')),commitments,months:ms,nY:ny,faEstimatedActual,plan,act,proj,cats:all,direct,idc,total:t,base,fa,curve,burn:elapsed?usd(cents(t.actual/elapsed)):null,elapsed,left:future.length,asOf:cut,rate:Number(s.grant.indirect)/100,issues:diagnostics,capExcess:usd(sum(future.flatMap(m=>s.people.map(p=>cents(person(s,p,m).excess)))))};
}
function validate(s){return validateState(s).issues;}
function calculate(s){const state=validateState(s),errors=state.issues.filter(x=>x.level==='error');if(errors.length)throw Error(errors.map(x=>x.message).join(' '));if(!state.amounts)throw Error('Budget calculation did not produce totals.');return {...state.amounts,issues:[...state.issues,...state.amounts.issues]};}
function demo(){const s={schema:1,grant:{title:'Community Health Study',start:'2026-01',end:'2028-12',asOf:'2026-10',indirect:49,base:'MTDC',salaryCap:228000,mode:'award',source:'Synthetic October statement',ruleSource:'Synthetic test profile; verify award terms',ruleStatus:'assumed',reconciled:false},planned:{},ledger:[],people:[{id:'person-1',name:'Alex Rivera',role:'PI',salary:300000,appointment:12,effort:15,fringe:35.4,raiseDate:'2027-01',raisePct:3},{id:'person-2',name:'Jordan Lee',role:'Coordinator',salary:72000,appointment:12,effort:100,fringe:39.9,raiseDate:'2027-01',raisePct:3},{id:'person-3',name:'Sam Patel',role:'Financial officer',salary:85000,appointment:12,effort:10,fringe:39.9,raiseDate:'2027-01',raisePct:3}],supplies:[{id:'s1',name:'Home blood pressure monitors',qty:120,unit:55,month:'2026-12'},{id:'s2',name:'Digital scales',qty:120,unit:42,month:'2027-01'}],costs:[{id:'c1',name:'Research equipment',cat:'Equipment',amount:12000,month:'2027-03'}],assume:{Travel:500,Other:1200},scenario:{qty:0,cost:0},subawards:[{id:1,name:'Example Community Partner',pi:'Site lead',start:'2026-01',end:'2028-12',total:180000,subj:50000}],subPays:[{id:1,sub:1,month:'2026-06',amount:30000,inv:'DEMO-01',note:'Synthetic payment'}],nextId:100,subNext:10,postedFa:{},audit:[]};
 for(const c of CATS)s.planned[c]=[0,0,0];Object.assign(s.planned,{Personnel:[175000,180000,185000],Supplies:[20000,15000,10000],Travel:[6000,7000,8000],Other:[15000,16000,17000],Equipment:[0,12000,0],[SUB]:[60000,60000,60000]});let id=1;for(const m of months('2026-01','2026-10')){for(const p of s.people)s.ledger.push({id:id++,personId:p.id,person:p.name,cat:'Personnel',month:m,amount:person(s,p,m).cost,note:'Synthetic payroll',reference:`PAY-${p.id}-${m}`});s.ledger.push({id:id++,cat:'Travel',month:m,amount:400,note:'Synthetic travel',reference:`TR-${m}`});s.ledger.push({id:id++,cat:'Other',month:m,amount:1000,note:'Synthetic incentives',reference:`OT-${m}`})}return s;}
const api={CATS,SUB,cents,usd,mi,month,months,spread,effort,person,validate,calculate,demo};


export default api;
