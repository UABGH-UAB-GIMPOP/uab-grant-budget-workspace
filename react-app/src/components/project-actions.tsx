import React from 'react';
import {MoreHorizontal,Archive,ArchiveRestore,Pencil} from 'lucide-react';
import {Button} from './ui/button';
import {DropdownMenu,DropdownMenuTrigger,DropdownMenuContent,DropdownMenuItem,DropdownMenuLabel,DropdownMenuSeparator} from './ui/dropdown-menu';
export function ProjectActions({row,onEditMetadata,onArchive}){
 return <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" aria-label={`Actions for ${row.title}`}><MoreHorizontal aria-hidden="true" size={18}/><span>Actions</span></Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="project-actions-menu"><DropdownMenuLabel>{row.title}</DropdownMenuLabel><DropdownMenuSeparator/>{onEditMetadata&&!row.archived&&<DropdownMenuItem onSelect={()=>onEditMetadata(row.id)}><Pencil aria-hidden="true"/>Edit owner and sponsor</DropdownMenuItem>}<DropdownMenuItem onSelect={()=>onArchive(row.id,!row.archived)}>{row.archived?<ArchiveRestore aria-hidden="true"/>:<Archive aria-hidden="true"/>}{row.archived?'Restore project':'Archive project'}</DropdownMenuItem></DropdownMenuContent></DropdownMenu>;
}
