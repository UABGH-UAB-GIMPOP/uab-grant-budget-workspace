import E from './engine.js';
import {effectiveRate} from './rates.js';
export function rateBasis(project,month){
 if(!E.months(project.grant.start,project.grant.end).includes(month))throw Error('Choose a month within the project period.');
 const make=(kind,label,fallback,person)=>{
  const changed=(project.rateChanges||[]).filter(r=>r.kind===kind&&(!['fringe','appointmentFte'].includes(kind)||r.personId===person?.id)&&r.month<=month).sort((a,b)=>a.month.localeCompare(b.month)).at(-1);
  return {kind,label,personId:person?.id??'',person:person?.name??'All personnel',month,value:effectiveRate(project,kind,month,fallback,person?.id),unit:kind==='salaryCap'?'USD, full-time 12-month rate':kind==='appointmentFte'?'Fraction (1 = 100%)':'Percent',effectiveMonth:changed?.month??null,source:changed?.source??'',basis:changed?'Effective-dated change':kind==='appointmentFte'&&person?.appointmentFte===undefined?'Assumed 100% appointment':'Base setting',changeId:changed?.id??''};
 };
 return [make('indirect','F&A rate',project.grant.indirect),make('salaryCap','Annual salary cap',project.grant.salaryCap||0),...project.people.flatMap(person=>[make('fringe','Fringe rate',person.fringe,person),make('appointmentFte','Appointment FTE',person.appointmentFte??1,person)])];
}
