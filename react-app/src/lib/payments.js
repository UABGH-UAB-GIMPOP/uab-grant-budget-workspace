import E from './engine.js';
export function paymentLedger(project, filter='all') {
 const balances=new Map();
 return project.subPays.map((payment,index)=>({payment,index})).sort((a,b)=>a.payment.month.localeCompare(b.payment.month)||a.index-b.index).map(({payment,index})=>{
  const id=String(payment.sub),balance=(balances.get(id)||0)+E.cents(payment.amount);balances.set(id,balance);
  return {payment,index,cumulative:E.usd(balance),name:project.subawards.find(x=>String(x.id)===id)?.name||'Unknown awardee'};
 }).filter(({payment})=>filter==='all'||String(payment.sub)===String(filter));
}
