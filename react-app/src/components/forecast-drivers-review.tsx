import React from 'react';
import E from '../lib/engine.js';
import {forecastDrivers} from '../lib/forecast-drivers.js';
import {Button} from './ui/button';
const cash=value=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(value);
export function ForecastDriversReview({calculation,onCategory}){
 const d=forecastDrivers(calculation);
 return <section aria-label="Forecast drivers" className="forecast-drivers"><h3>What drives the projected balance?</h3><p>Category budget headroom {cash(d.headroom)} − category overruns {cash(d.overruns)} = projected remaining {cash(d.remaining)}.</p><p className="muted">Headroom in one category does not authorize moving funds to another. These are planning estimates, not a spending approval.</p>{d.incomplete&&<p className="notice">Forecast incomplete: unpaid obligations outside the project period are excluded. Review their payment dates before relying on this balance.</p>}<div className="forecast-driver-list">{d.rows.map(r=><article key={r.category}><h4>{r.category}</h4><p><strong>{cash(Math.abs(r.overrun))} {r.overrun>0?'over budget':r.overrun<0?'remaining':'difference'}</strong></p><dl><div><dt>Actual to date</dt><dd>{cash(r.actual)}</dd></div><div><dt>Future forecast</dt><dd>{cash(r.future)}</dd></div><div><dt>Total forecast</dt><dd>{cash(r.forecast)}</dd></div><div><dt>Category budget</dt><dd>{cash(r.budget)}</dd></div></dl>{r.category==='Indirect (IDC)'?<p className="muted">F&amp;A reflects the selected rates, base and any posted amounts.</p>:<Button variant="ghost" onClick={()=>onCategory(r.category==='Direct Consortium/Contractual'?E.SUB:r.category)}>View {r.category} transactions</Button>}</article>)}</div></section>;
}
