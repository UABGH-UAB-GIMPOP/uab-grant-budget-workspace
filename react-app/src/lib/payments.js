import E from './engine.js';
export function paymentLedger(project, filter='all') {
 const balances=new Map();
 return project.subPays.map((payment,index)=>({payment,index})).sort((a,b)=>a.payment.month.localeCompare(b.payment.month)||a.index-b.index).map(({payment,index})=>{
  const id=String(payment.sub),balance=(balances.get(id)||0)+E.cents(payment.amount);balances.set(id,balance);
  return {payment,index,cumulative:E.usd(balance),name:project.subawards.find(x=>String(x.id)===id)?.name||'Unknown awardee'};
 }).filter(({payment})=>filter==='all'||String(payment.sub)===String(filter));
}

// Review candidates only: repeated references may be installments or credits.
// Never collapse payments or change actuals based on this signal.
export function repeatedSubawardInvoices(project) {
 const groups=new Map();
 for(const [index,payment] of project.subPays.entries()){
  const reference=String(payment.inv??'').trim().replace(/\s+/g,' ').toLowerCase();
  if(!reference)continue;
  const subawardId=String(payment.sub),key=JSON.stringify([subawardId,reference]);
  if(!groups.has(key))groups.set(key,{key,subawardId,reference,name:project.subawards.find(x=>String(x.id)===subawardId)?.name||'Unknown awardee',payments:[]});
  groups.get(key).payments.push({id:payment.id,index,month:payment.month,reference:String(payment.inv),amount:payment.amount,note:payment.note||''});
 }
 return [...groups.values()].filter(group=>group.payments.length>1).map(group=>({...group,total: E.usd(group.payments.reduce((sum,p)=>sum+E.cents(p.amount),0))}));
}
