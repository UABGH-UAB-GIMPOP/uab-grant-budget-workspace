import React,{useMemo,useState} from 'react';
import {reportingProject} from '../lib/portfolio';
import {Input} from './ui/input';
import {Button} from './ui/button';
import {Table,TableHeader,TableBody,TableRow,TableHead,TableCell} from './ui/table';
import {FilterSelect} from './filter-select';
import {ScrollableTable} from './scrollable-table';
const money=value=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(value);
export function portfolioTransactionRows(portfolio){
 return portfolio.projects.filter(item=>!item.archived).flatMap(item=>{
  const p=reportingProject(item),common={projectId:item.id,projectTitle:p.grant.title};
  return [...p.ledger.map((r,index)=>({...common,key:JSON.stringify([item.id,'ledger',r.id,index]),id:r.id,sourceIndex:index,kind:'Ledger',month:r.month,category:r.cat,amount:Number(r.amount),description:r.note||r.person||'',reference:r.reference||'',source:r.importSource?.sourceSystem||'Manual / source not recorded',batch:r.importSource?.batchId||'',sourceRow:r.importSource?.rowNumber??null,reversalOf:r.reversalOf??null})),...p.subPays.map((r,index)=>({...common,key:JSON.stringify([item.id,'payment',r.id,index]),id:r.id,sourceIndex:index,kind:'Subaward payment',month:r.month,category:'Subawards',amount:Number(r.amount),description:[p.subawards.find(s=>String(s.id)===String(r.sub))?.name,r.note].filter(Boolean).join(' · '),reference:r.inv||r.reference||'',source:'Manual / source not recorded',batch:'',sourceRow:null,reversalOf:null}))];
 }).sort((a,b)=>b.month.localeCompare(a.month)||a.projectTitle.localeCompare(b.projectTitle)||a.key.localeCompare(b.key));
}
export function PortfolioTransactions({portfolio,onOpen,state=undefined,onStateChange=undefined,onOpenTransaction=undefined}){
 const [localState,setLocalState]=useState({query:'',project:'',page:0});
 const currentState=state??localState,{query,project,page}=currentState;
 const change=patch=>{const next={...currentState,...patch};if(onStateChange)onStateChange(next);else setLocalState(next)};
 const setPage=page=>change({page});
 const all=useMemo(()=>portfolioTransactionRows(portfolio),[portfolio]);
 const rows=useMemo(()=>{const q=query.trim().toLowerCase();return all.filter(r=>(!project||r.projectId===project)&&(!q||[r.projectTitle,r.description,r.reference,r.category,r.source,r.month].some(v=>v.toLowerCase().includes(q))))},[all,project,query]);
 const last=Math.max(0,Math.ceil(rows.length/25)-1),current=Math.min(page,last),visible=rows.slice(current*25,current*25+25);
 const projects=portfolio.projects.filter(p=>!p.archived).map(p=>({value:p.id,label:reportingProject(p).grant.title}));
 return <section aria-label="Portfolio transactions"><h1>Transactions</h1><p>Ledger entries and subaward payments across unarchived projects, including proposal and out-of-period records.</p><div className="portfolio-toolbar"><Input aria-label="Search transactions" placeholder="Project, description, reference, category or source" value={query} onChange={e=>{change({query:e.target.value,page:0})}}/><FilterSelect label="Project" value={project} options={[{value:'',label:'All projects'},...projects]} onChange={value=>{change({project:value,page:0})}}/></div>
 <p role="status">{rows.length} matching {rows.length===1?'transaction':'transactions'}</p>{rows.length?<ScrollableTable label="Portfolio transaction records"><Table className="portfolio-transaction-table" role="table" scrollContainer={false}><TableHeader role="rowgroup"><TableRow role="row">{['Project','Month','Category','Description / reference','Amount','Source'].map(h=><TableHead role="columnheader" scope="col" key={h}>{h}</TableHead>)}</TableRow></TableHeader><TableBody role="rowgroup">{visible.map(r=><TableRow role="row" key={r.key}><TableCell role="cell" data-label="Project"><Button className="transaction-project-link" variant="ghost" data-project-id={r.projectId} data-project-focus={"transaction:"+r.key} onClick={()=>onOpenTransaction?onOpenTransaction(r.projectId,{kind:r.kind,id:r.id,index:r.sourceIndex}):onOpen(r.projectId)}>{r.projectTitle}</Button></TableCell><TableCell role="cell" data-label="Month">{new Date(r.month+'-02T12:00:00Z').toLocaleDateString('en-US',{month:'short',year:'numeric',timeZone:'UTC'})}</TableCell><TableCell role="cell" data-label="Category">{r.category}<div className="muted">{r.kind}</div></TableCell><TableCell role="cell" data-label="Description / reference">{r.description||'—'}{r.reference&&<div>{r.reference}</div>}{r.reversalOf!==null&&<div>Reversal of transaction {String(r.reversalOf)}</div>}</TableCell><TableCell role="cell" data-label="Amount">{money(r.amount)}</TableCell><TableCell role="cell" data-label="Source">{r.source}{r.batch&&<div className="muted">Batch {r.batch}{r.sourceRow!==null?' · Row '+r.sourceRow:''}</div>}</TableCell></TableRow>)}</TableBody></Table></ScrollableTable>:<p>No transactions match these filters.</p>}
 <div className="pagination"><span>{rows.length?current*25+1:0}–{Math.min(current*25+25,rows.length)} of {rows.length}</span><Button variant="outline" disabled={current===0} onClick={()=>setPage(current-1)}>Previous transactions</Button><Button variant="outline" disabled={current===last} onClick={()=>setPage(current+1)}>Next transactions</Button></div></section>;
}
