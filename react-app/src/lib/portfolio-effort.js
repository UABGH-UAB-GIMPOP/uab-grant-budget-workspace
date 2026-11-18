import {validateSharedPersonnelKey} from './personnel-identity.js';
export {validateSharedPersonnelKey} from './personnel-identity.js';
import E from './engine.js';
import {normalizePortfolio,reportingProject} from './portfolio.js';
import {effectiveAppointmentFte,appointmentFteAssumed} from './appointment-fte.js';
export const EFFORT_COVERAGE='Includes linked awards in this portfolio only; effort outside this portfolio is not assessed.';
export const EFFORT_CAVEAT='Monthly approximation: academic and summer assignments, partial months and deferred payroll require separate review.';
// Compare floating fractions at 1e-9; never round contributions before summing.
const tolerance=1e-9;
export function portfolioEffort(value,{year}={}){
 if(!Number.isInteger(year)||year<1900||year>2200)throw Error('Choose a calendar year from 1900 through 2200.');
 const portfolio=normalizePortfolio(value),months=Array.from({length:12},(_,i)=>`${year}-${String(i+1).padStart(2,'0')}`),groups=new Map(),unlinked=[],awards=[];
 for(const item of portfolio.projects){if(item.archived)continue;const project=reportingProject(item);if(project.grant.mode==='proposal'||project.grant.start>`${year}-12`||project.grant.end<`${year}-01`)continue;
  awards.push({projectId:item.id,title:project.grant.title,asOf:project.grant.asOf,source:project.grant.source||''});
  for(const person of project.people){const errors=validateSharedPersonnelKey(person);if(errors.length)throw Error(errors[0].message);
   const link={projectId:item.id,personId:person.id,projectTitle:project.grant.title,personName:person.name,asOf:project.grant.asOf,source:project.grant.source||'',appointmentMonths:Number(person.appointment||12)};
   if(person.sharedPersonKey===undefined){unlinked.push(link);continue;}
   if(!groups.has(person.sharedPersonKey))groups.set(person.sharedPersonKey,[]);
   groups.get(person.sharedPersonKey).push({project,person,link});
  }
 }
 const people=[...groups.entries()].map(([sharedPersonKey,members])=>{
  const counts=new Map();for(const m of members)counts.set(m.link.projectId,(counts.get(m.link.projectId)||0)+1);
  const duplicateProjectIds=[...counts].filter(([,count])=>count>1).map(([id])=>id);
  return {sharedPersonKey,duplicateProjectIds,reviewRequired:duplicateProjectIds.length>0,links:members.map(m=>m.link),months:months.map(month=>{
   const contributions=members.map(({project,person,link})=>{const inProject=month>=project.grant.start&&month<=project.grant.end,effort=inProject?E.effort(project,person,month):0,appointmentFte=effectiveAppointmentFte(project,person,month);return {...link,effort,appointmentFte,assumed:appointmentFteAssumed(project,person,month),researchFte:effort/100*appointmentFte};});
   const positive=contributions.filter(c=>c.researchFte>0),researchFte=contributions.reduce((n,c)=>n+c.researchFte,0),unresolved=positive.some(c=>c.assumed)||positive.some(c=>Math.abs(c.appointmentFte-positive[0].appointmentFte)>tolerance),capacity=positive.length&&!unresolved?positive[0].appointmentFte:null;
   return {month,researchFte,capacity,excess:capacity===null?null:Math.max(0,researchFte-capacity),overCapacity:capacity===null?null:researchFte-capacity>tolerance,status:!positive.length?'No contributing effort':unresolved?'Capacity unresolved':'Capacity evaluated',contributions};
  })};
 });
 return {year,months,people,unlinked,awards,coverage:EFFORT_COVERAGE,caveat:EFFORT_CAVEAT,tolerance};
}
