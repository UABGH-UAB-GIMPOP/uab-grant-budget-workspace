import E from './engine.js';
export function personnelSummary(project, person, months) {
 const asOf=E.mi(project.grant.asOf),proposal=project.grant.mode==='proposal';
 let planned=0,actual=0,forecast=0,excess=0,effort=0;
 const monthly=months.map(month=>{
   const model=E.person(project,person,month);
   const posted=proposal?0:project.ledger.filter(row=>row.cat==='Personnel'&&String(row.personId)===String(person.id)&&row.month===month&&E.mi(month)<=asOf).reduce((sum,row)=>sum+E.cents(row.amount),0);
   const projected=proposal||E.mi(month)>asOf?E.cents(model.cost):posted;
   planned+=E.cents(model.cost);actual+=posted;forecast+=projected;excess+=E.cents(model.excess);effort+=model.effort;
   return {month,actual:E.usd(posted),forecast:E.usd(projected),effort:model.effort};
 });
 return {planned:E.usd(planned),actual:E.usd(actual),forecast:E.usd(forecast),excess:E.usd(excess),averageEffort:months.length?effort/months.length:0,personMonths:effort/100,monthly};
}
export function unassignedPayroll(project,months){
 const known=new Set(project.people.map(p=>String(p.id)));
 const rows=project.grant.mode==='proposal'?[]:project.ledger.filter(r=>r.cat==='Personnel'&&!known.has(String(r.personId))&&months.includes(r.month)&&r.month<=project.grant.asOf);
 return {rows,total:E.usd(rows.reduce((t,r)=>t+E.cents(r.amount),0))};
}
