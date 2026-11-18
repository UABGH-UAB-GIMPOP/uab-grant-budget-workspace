import E from './engine.js';
// Decompose existing category totals, excluding the direct-cost subtotal so it
// cannot be counted twice. This explains a forecast, not permission to rebudget.
export function forecastDrivers(calculation){
 const rows=calculation.cats.filter(r=>r.c!=='Total direct costs').map(r=>({category:r.c,budget:r.plan,actual:r.actual,forecast:r.proj,future:E.usd(E.cents(r.proj)-E.cents(r.actual)),overrun:E.usd(E.cents(r.proj)-E.cents(r.plan))}));
 const sum=predicate=>E.usd(rows.filter(predicate).reduce((n,r)=>n+E.cents(Math.abs(r.overrun)),0));
 return {rows:rows.sort((a,b)=>b.overrun-a.overrun||a.category.localeCompare(b.category)),overruns:sum(r=>r.overrun>0),headroom:sum(r=>r.overrun<0),remaining:calculation.total.variance,incomplete:!!calculation.forecastIncomplete};
}
