import React,{useState,useRef} from 'react';
import {Search} from 'lucide-react';
import {Button} from './ui/button';
import {Input} from './ui/input';
import {Dialog,DialogContent,DialogHeader,DialogTitle} from './ui/dialog';
export function ProjectSearch({projects,onOpen,disabled=false}){
 const trigger=useRef<HTMLButtonElement>(null),navigating=useRef(false);
 const [open,setOpen]=useState(false),[query,setQuery]=useState('');const matches=projects.filter(p=>[p.title,p.owner,p.sponsor].some(value=>String(value??'').toLowerCase().includes(query.trim().toLowerCase())));
 return <><Button ref={trigger} className="workspace-search-trigger" variant="outline" disabled={disabled} onClick={()=>{navigating.current=false;setQuery('');setOpen(true)}}><Search aria-hidden="true" size={16}/>Find a project</Button><Dialog open={open} onOpenChange={setOpen}><DialogContent aria-describedby={undefined} onEscapeKeyDown={e=>e.stopPropagation()} onCloseAutoFocus={e=>{e.preventDefault();if(!navigating.current)trigger.current?.focus()}}><DialogHeader><DialogTitle>Find a project</DialogTitle></DialogHeader><Input aria-label="Search all projects" placeholder="Title, owner or sponsor" value={query} onChange={e=>setQuery(e.target.value)}/><p role="status">{matches.length} matching {matches.length===1?'project':'projects'}</p><ul className="workspace-search-results">{matches.map(p=><li key={p.id}><Button variant="ghost" onClick={()=>{navigating.current=true;setOpen(false);onOpen(p.id)}}><span>{p.title}<small>{[p.owner,p.sponsor].filter(Boolean).join(' · ')}</small></span></Button></li>)}</ul>{!matches.length&&<p>No projects match your search.</p>}</DialogContent></Dialog></>;
}
