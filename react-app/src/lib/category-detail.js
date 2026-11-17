import E from './engine.js';
export function categoryDetail(project,category){
 if(!E.CATS.includes(category)&&category!==E.SUB)throw Error('Choose a direct-cost category.');
 const rows=category===E.SUB?project.subPays.map(row=>({id:row.id,month:row.month,amount:row.amount,reference:row.inv||'',note:row.note||'',name:project.subawards.find(a=>String(a.id)===String(row.sub))?.name||'Unknown awardee'})):project.ledger.filter(row=>row.cat===category).map(row=>({...row,name:project.people.find(p=>p.id===row.personId)?.name||''}));
 const accepted=[],future=[],outside=[];
 for(const row of rows){if(row.month<project.grant.start||row.month>project.grant.end)outside.push(row);else if(project.grant.mode==='proposal'||row.month>project.grant.asOf)future.push(row);else accepted.push(row)}
 const sort=rows=>rows.sort((a,b)=>b.month.localeCompare(a.month)||String(a.id).localeCompare(String(b.id)));
 return {accepted:sort(accepted),future:sort(future),outside:sort(outside),total:E.usd(accepted.reduce((n,r)=>n+E.cents(r.amount),0))};
}
