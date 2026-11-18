import React,{useState} from 'react';
import E from '../lib/engine';
import {settlementAllocations} from '../lib/commitments';
import {Button} from './ui/button';
import {Input} from './ui/input';
import {OptionalFormSelect} from './optional-form-select';

type Row={key:string,commitmentId:string,amount:string};
export function SettlementAllocationEditor({project,entry,onApply,onCancel}:{project:any,entry:any,onApply:(rows:{commitmentId:string,amount:number}[],reason:string)=>boolean|void,onCancel:()=>void}){
 const [rows,setRows]=useState<Row[]>(()=>settlementAllocations(entry).map((r:any)=>({key:crypto.randomUUID(),commitmentId:r.commitmentId,amount:String(r.amount)}))),[reason,setReason]=useState(''),[error,setError]=useState('');
 const eligible=(project.commitments||[]).filter((c:any)=>c.category===entry.cat);
 const update=(key:string,value:string)=>setRows(old=>old.map(r=>r.key===key?{...r,amount:value}:r));
 const money=(value:number)=>value.toLocaleString('en-US',{style:'currency',currency:'USD'});
 let allocated=0,remaining:number|null=null;try{allocated=rows.reduce((n,r)=>n+E.cents(r.amount===''?0:Number(r.amount)),0);remaining=E.usd(E.cents(entry.amount)-allocated)}catch{}
 return <form className="form settlement-allocation-editor" onSubmit={event=>{event.preventDefault();try{
  if(!reason.trim())throw Error('Enter a reason for this allocation.');if(reason.trim().length>1000)throw Error('Keep the allocation reason within 1,000 characters.');
  if(entry.reversalOf!==undefined||project.ledger.some((r:any)=>String(r.reversalOf)===String(entry.id)))throw Error('Linked corrections retain their allocation history.');
  const data=new FormData(event.currentTarget),allocations=rows.map(r=>{const raw=String(data.get('amount-'+r.key)??'').trim();if(!raw)throw Error('Enter an amount for every allocation.');return {commitmentId:String(data.get('commitment-'+r.key)??''),amount:Number(raw)}});
  const next={...entry,settlementReason:reason.trim()};delete next.commitmentId;delete next.commitmentAmount;if(allocations.length)next.commitmentAllocations=allocations;else delete next.commitmentAllocations;
  const candidate={...project,ledger:project.ledger.map((r:any)=>String(r.id)===String(entry.id)?next:r)},errors=E.validate(candidate).filter((r:any)=>r.level==='error');if(errors.length)throw Error(errors.map((r:any)=>r.message).join(' '));
  if(onApply(allocations,reason.trim())===false)throw Error('Allocation was not applied. Your draft is unchanged.');
 }catch(e){setError((e as Error).message)}}}>
 <p className="allocation-context">{entry.reference||'Transaction '+entry.id} · {entry.cat} · {money(Number(entry.amount))}</p>
 <p>The transaction is counted once. Allocations reduce the linked commitments; they do not add expenses.</p>
 <div className="allocation-rows">{rows.map((r,index)=><div className="allocation-row" key={r.key}>
 <label>Commitment<OptionalFormSelect name={'commitment-'+r.key} label={'Allocation '+(index+1)+' commitment'} defaultValue={r.commitmentId}><option value="">Choose a commitment</option>{eligible.map((c:any)=><option key={c.id} value={c.id}>{c.name}</option>)}</OptionalFormSelect></label>
 <label>Amount<Input aria-label={'Allocation '+(index+1)+' amount'} name={'amount-'+r.key} type="number" step="0.01" required value={r.amount} onChange={e=>update(r.key,e.target.value)} onBlur={e=>update(r.key,e.currentTarget.value)}/></label>
 <Button type="button" variant="outline" aria-label={'Remove allocation '+(index+1)} onClick={()=>setRows(old=>old.filter(row=>row.key!==r.key))}>Remove</Button>
 </div>)}</div>
 {!rows.length&&<p>No commitments allocated.</p>}
 <Button type="button" variant="outline" disabled={rows.length>=100||!eligible.length} onClick={()=>setRows(old=>[...old,{key:crypto.randomUUID(),commitmentId:'',amount:''}])}>Add allocation</Button>
 <p role="status">Unallocated portion: {remaining===null?'Enter valid amounts':money(remaining)}</p>
 <label>Reason<Input name="settlementReason" required maxLength={1000} value={reason} onChange={e=>setReason(e.target.value)} onBlur={e=>setReason(e.currentTarget.value)}/></label>
 {error&&<p role="alert">{error}</p>}
 <div className="actions"><Button type="submit">Apply allocation</Button><Button type="button" variant="outline" onClick={onCancel}>Cancel</Button></div>
 </form>
}
