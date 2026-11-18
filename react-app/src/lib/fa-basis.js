import E from './engine.js';
import {effectiveRate} from './rates.js';
// Inspect the authoritative engine outputs, never recompute monthly rounding.
export function faBasis(project,calculation=E.calculate(project)){
 return calculation.months.map(month=>{
  const closed=E.mi(month)<=calculation.asOf,posted=closed&&project.postedFa?.[month]!=null;
  return {month,eligibleCategories:project.grant.base==='TDC'?[...E.CATS]:E.CATS.filter(c=>(project.grant.eligible||['Personnel','Supplies','Travel','Other','Consultants']).includes(c)),base:project.grant.base,rate:effectiveRate(project,'indirect',month,project.grant.indirect),closed,status:posted?'Posted actual':closed?'Estimated actual':'Future estimate',eligibleBase:calculation.base.proj[month],estimatedActual:closed?calculation.faEstimatedActual[month]:null,postedActual:posted?project.postedFa[month]:null,applied:calculation.fa.proj[month],difference:posted?E.usd(E.cents(project.postedFa[month])-E.cents(calculation.faEstimatedActual[month])):null};
 });
}
