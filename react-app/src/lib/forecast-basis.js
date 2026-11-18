import E from './engine.js';
import {reconciliationCoverage} from './reconciliation.js';
// Explain the existing engine's monthly base only. Planned costs and commitments
// are additive, and missing statements do not authorize invented actuals.
export function forecastBasis(project,calculation){
 const closed=calculation.months.filter(month=>E.mi(month)<=calculation.asOf);
 const coverage=project.grant.mode==='proposal'?null:reconciliationCoverage(project);
 return ['Travel','Other'].map(category=>{
  const entered=project.assume[category]!=null;
  const recorded=E.usd(closed.reduce((sum,month)=>sum+E.cents(calculation.act[category][month]),0));
  const amount=entered?Number(project.assume[category]):closed.length?E.usd(E.cents(recorded/closed.length)):0;
  const row=coverage?.rows.find(row=>row.category===category);
  return {category,basis:entered?'Entered estimate':closed.length?'Historical average':'No historical average',amount,recorded,months:closed.length,start:closed[0]||null,end:closed.at(-1)||null,futureMonths:calculation.months.length-closed.length,coverage:row?.status||(project.grant.mode==='proposal'?'Proposal: actuals excluded':'No actual period'),missing:row?.missing||[],overlapping:row?.overlapping||[],mismatched:row?.mismatched||[],unverified:!entered&&closed.length>0&&row?.status!=='Matched',noHistory:!entered&&!closed.length,proposal:project.grant.mode==='proposal'};
 });
}
