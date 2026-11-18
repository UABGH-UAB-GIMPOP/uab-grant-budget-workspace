import React,{useState} from 'react';
import {Button} from './ui/button';
import {Input} from './ui/input';
import {cents} from '../lib/money';
import {exactCsvMoney} from '../lib/csv-money';
export function PaymentScheduleEditor({commitment,onApply,onCancel}){
 const [error,setError]=useState('');
 const [rows,setRows]=useState(()=>(commitment.schedule??[{id:crypto.randomUUID(),month:commitment.month,amount:commitment.amount}]).map(x=>({...x,amount:String(x.amount)})));
 const update=(id,key,value)=>setRows(old=>old.map(x=>x.id===id?{...x,[key]:value}:x));
 const parsed=rows.map(x=>{try{return cents(exactCsvMoney(x.amount))}catch{return null}}),total=parsed.reduce((n,x)=>n+(x??0),0),invalid=parsed.some(x=>x===null)||!Number.isSafeInteger(total),authorized=cents(commitment.amount);
 return <form onSubmit={e=>{e.preventDefault();const data=new FormData(e.currentTarget);try{setError('');onApply(rows.map(x=>({...x,month:String(data.get('month-'+x.id)),amount:exactCsvMoney(String(data.get('amount-'+x.id)))})))}catch(e){setError(e.message)}}}>
 {error&&<p role="alert">{error}</p>}
 <p>{commitment.name} · Authorized ${commitment.amount.toLocaleString('en-US',{minimumFractionDigits:2})}</p>
 <p className="muted">Payments settle the earliest installments first. Cancellations reduce the latest installments. Overdue balances move to the next forecast month.</p>
 <div className="schedule-rows">{rows.map((row,i)=><div className="schedule-row" key={row.id}><label>Payment {i+1}<Input name={'month-'+row.id} aria-label={'Payment '+(i+1)+' month'} type="month" required value={row.month} onChange={e=>update(row.id,'month',e.target.value)} onBlur={e=>update(row.id,'month',e.currentTarget.value)}/></label><label>Amount<Input name={'amount-'+row.id} aria-label={'Payment '+(i+1)+' amount'} type="number" step="0.01" min="0.01" required value={row.amount} onChange={e=>update(row.id,'amount',e.target.value)} onBlur={e=>update(row.id,'amount',e.currentTarget.value)}/></label><Button type="button" variant="ghost" onClick={()=>setRows(old=>old.filter(x=>x.id!==row.id))} aria-label={'Remove payment '+(i+1)}>Remove</Button></div>)}</div>
 <Button type="button" variant="outline" disabled={rows.length>=120} onClick={()=>setRows(old=>[...old,{id:crypto.randomUUID(),month:commitment.month,amount:''}])}>Add payment</Button>
 {invalid&&<p role="alert">Enter valid cent-precision amounts for every payment.</p>}
 <p role="status">Scheduled ${(total/100).toLocaleString('en-US',{minimumFractionDigits:2})} · Remaining to allocate ${((authorized-total)/100).toLocaleString('en-US',{minimumFractionDigits:2})}</p>
 <div className="actions"><Button type="submit" disabled={invalid||total!==authorized||!rows.length}>Apply schedule</Button><Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>{commitment.schedule&&<Button type="button" variant="ghost" onClick={()=>onApply(undefined)}>Use one payment</Button>}</div>
 </form>;
}
