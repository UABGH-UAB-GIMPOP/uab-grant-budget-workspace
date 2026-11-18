import React,{useMemo,useState} from 'react';
import {formatDateUS} from '../lib/date-format';
import {reportingProject} from '../lib/portfolio';
import {Input} from './ui/input';
import {Button} from './ui/button';
import {Badge} from './ui/badge';
import {FilterSelect} from './filter-select';
import {ScrollableTable} from './scrollable-table';
import {Table,TableHeader,TableBody,TableRow,TableHead,TableCell} from './ui/table';
const date=formatDateUS;
export function portfolioTaskRows(portfolio){return portfolio.projects.filter(item=>!item.archived).flatMap(item=>{const p=reportingProject(item);return (p.milestones||[]).map(m=>({key:JSON.stringify([item.id,m.id]),id:m.id,projectId:item.id,projectTitle:p.grant.title,title:m.title,owner:m.owner,due:m.due,cadence:m.cadence??'Once',done:m.done}));}).sort((a,b)=>a.due.localeCompare(b.due)||a.projectTitle.localeCompare(b.projectTitle)||a.key.localeCompare(b.key));}
export function PortfolioTasks({portfolio,onOpen}){
 const [query,setQuery]=useState(''),[project,setProject]=useState(''),[status,setStatus]=useState('pending'),[page,setPage]=useState(0);
 const all=useMemo(()=>portfolioTaskRows(portfolio),[portfolio]);
 const rows=useMemo(()=>{const q=query.trim().toLowerCase();return all.filter(r=>(!project||r.projectId===project)&&(status==='all'||(status==='completed'?r.done:!r.done))&&(!q||[r.title,r.owner,r.projectTitle].some(v=>v.toLowerCase().includes(q))))},[all,project,status,query]);
 const last=Math.max(0,Math.ceil(rows.length/25)-1),current=Math.min(page,last);
 return <section aria-label="Portfolio tasks"><h1>Tasks &amp; deadlines</h1><p>Milestones across unarchived projects. Open a project to update its tasks.</p><div className="portfolio-toolbar"><Input aria-label="Search tasks" placeholder="Task, owner or project" value={query} onChange={e=>{setQuery(e.target.value);setPage(0)}}/><FilterSelect label="Project" value={project} onChange={value=>{setProject(value);setPage(0)}} options={[{value:'',label:'All projects'},...portfolio.projects.filter(p=>!p.archived).map(p=>({value:p.id,label:reportingProject(p).grant.title}))]}/><FilterSelect label="Task status" value={status} onChange={value=>{setStatus(value);setPage(0)}} options={[{value:'pending',label:'Pending'},{value:'completed',label:'Completed'},{value:'all',label:'All tasks'}]}/></div><p role="status">{rows.length} matching {rows.length===1?'task':'tasks'}</p>
 {rows.length?<ScrollableTable label="Portfolio milestone records"><Table scrollContainer={false}><TableHeader><TableRow>{['Task','Project','Owner','Due date','Cadence','Status'].map(h=><TableHead key={h}>{h}</TableHead>)}</TableRow></TableHeader><TableBody>{rows.slice(current*25,current*25+25).map(r=><TableRow key={r.key}><TableCell>{r.title}</TableCell><TableCell><Button variant="ghost" data-project-id={r.projectId} data-project-focus={"task:"+r.key} onClick={()=>onOpen(r.projectId)}>{r.projectTitle}</Button></TableCell><TableCell>{r.owner||'Owner not assigned'}</TableCell><TableCell><time dateTime={r.due}>{date(r.due)}</time></TableCell><TableCell>{r.cadence}</TableCell><TableCell><Badge variant="secondary">{r.done?'Completed':'Pending'}</Badge></TableCell></TableRow>)}</TableBody></Table></ScrollableTable>:<p>No tasks match these filters.</p>}
 <div className="pagination"><span>{rows.length?current*25+1:0}–{Math.min(current*25+25,rows.length)} of {rows.length}</span><Button variant="outline" disabled={current===0} onClick={()=>setPage(current-1)}>Previous tasks</Button><Button variant="outline" disabled={current===last} onClick={()=>setPage(current+1)}>Next tasks</Button></div></section>;
}
