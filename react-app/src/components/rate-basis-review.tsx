import React,{useState} from 'react';
import E from '../lib/engine.js';
import {rateBasis} from '../lib/rate-basis.js';
import {FilterSelect} from './filter-select';
const month=m=>m.slice(5,7)+'/'+m.slice(0,4);
const value=r=>r.kind==='salaryCap'?(r.value===0?'No cap entered':new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(r.value)):Number((r.value*(r.kind==='appointmentFte'?100:1)).toFixed(4))+'%';
export function RateBasisReview({project}){
 const months=E.months(project.grant.start,project.grant.end),[selected,setSelected]=useState(project.grant.asOf),current=months.includes(selected)?selected:months[0],rows=rateBasis(project,current);
 return <section aria-label="Effective rate inspection"><h3>Rates applied by month</h3><p className="muted">Inspect entered assumptions without editing them. These values do not establish sponsor approval. Historical payroll is not recalculated; posted F&A takes precedence over its estimate.</p><FilterSelect label="Inspect rates for month" value={current} options={months.map(m=>({value:m,label:month(m)}))} onChange={setSelected}/><div className="forecast-basis-grid">{rows.map(r=><article key={r.kind+':'+r.personId}><h4>{r.label}{r.personId!==''?' · '+r.person:''}</h4><p><strong>{value(r)}</strong></p><p>{r.basis}{r.effectiveMonth?' · effective '+month(r.effectiveMonth):''}</p><p className="muted">{r.source?'Source: '+r.source:'No separate rate source recorded.'}</p></article>)}</div></section>;
}
