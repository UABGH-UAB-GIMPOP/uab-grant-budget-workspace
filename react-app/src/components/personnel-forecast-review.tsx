import React from 'react';
import {personnelForecast} from '../lib/personnel-forecast.js';
const cash=value=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(value);
const month=value=>value.slice(5,7)+'/'+value.slice(0,4);
export function PersonnelForecastReview({project,calculation}){
 const rows=personnelForecast(project,calculation);
 return <section aria-label="Personnel forecast components"><h3>What is included in personnel forecasts?</h3><p className="muted">Modeled months only; posted payroll is not split into salary and fringe here. Fringe is calculated on charged salary. Above-cap salary is excluded from charged cost, not classified as committed cost share or assigned to a funding source.</p>{!rows.length?<p>No personnel entered.</p>:!rows[0].months?<p>No future project months remain.</p>:<><p>{project.grant.mode==='proposal'?'Proposal model':'Future forecast'}: {month(rows[0].start)}–{month(rows[0].end)} · {rows[0].months} months. Amounts use the entered appointment, effort and effective rates.</p><div className="forecast-driver-list">{rows.map(r=><article key={r.id}><h4>{r.name}</h4><dl>{[['Salary before cap',r.salary],['Charged salary',r.charged],['Fringe on charged salary',r.fringe],['Charged cost',r.cost],['Salary above cap',r.excess]].map(([label,value])=><div key={String(label)}><dt>{label}</dt><dd>{cash(value)}</dd></div>)}</dl></article>)}</div></>}</section>;
}
