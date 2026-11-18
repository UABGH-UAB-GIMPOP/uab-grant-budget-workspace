import React from 'react';
import {ArrowUpRight} from 'lucide-react';
import {projectHash} from '../lib/project-route';
export function ProjectLink({id,title,archived=false,onOpen}:{id:string;title:string;archived?:boolean;onOpen:(id:string)=>void}){
 if(archived)return <span className="category-link archived-project">{title}</span>;
 return <a data-project-id={id} data-project-focus={"project:"+id} className="category-link project-link" href={projectHash(id)} onClick={e=>{if(e.button===0&&!e.metaKey&&!e.ctrlKey&&!e.shiftKey&&!e.altKey){e.preventDefault();onOpen(id)}}}>{title}<ArrowUpRight size={16} aria-hidden="true"/></a>;
}
