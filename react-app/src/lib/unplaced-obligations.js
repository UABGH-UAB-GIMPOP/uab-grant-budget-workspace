import {cents} from './money.js';
export function unplacedObligations(project,calculation){
 const rows=calculation.commitments.rows.filter(r=>r.open>0&&!r.forecastMonth).map(r=>({id:r.id,name:r.name,category:r.category,amount:r.open,source:r.source}));
 if(calculation.left===0&&project.grant.mode!=='proposal')for(const award of project.subawards){
  const paid=project.subPays.filter(p=>String(p.sub)===String(award.id)&&p.month>=project.grant.start&&p.month<=project.grant.end&&p.month<=project.grant.asOf).reduce((sum,p)=>sum+cents(p.amount),0);
  const remaining=Math.max(0,cents(award.total)-paid);if(remaining)rows.push({id:'subaward-'+award.id,name:award.name,category:'Subaward',amount:remaining/100,source:award.pi||''});
 }
 return {rows,total:rows.reduce((sum,r)=>sum+cents(r.amount),0)/100};
}
