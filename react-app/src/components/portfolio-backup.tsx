import React,{useState,useRef,useEffect} from 'react';
import {Button} from './ui/button';
import {Dialog,DialogContent,DialogHeader,DialogTitle} from './ui/dialog';
import {Download,Upload} from 'lucide-react';
import {portfolioBackup,previewPortfolioRestore,BACKUP_LIMIT} from '../lib/portfolio-backup';
function download(text){const url=URL.createObjectURL(new Blob([text],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='grant-portfolio-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
export function PortfolioBackup({portfolio,revision,onRestore,onBusy}){
 const [open,setOpen]=useState(false),[busy,setBusy]=useState(false),[preview,setPreview]=useState(null),[error,setError]=useState('');
 const token=useRef(0),input=useRef<HTMLInputElement>(null),expected=useRef(null);
 const cancel=()=>{token.current++;setOpen(false);setBusy(false);setPreview(null);setError('')};
 useEffect(()=>{onBusy?.(open);return ()=>onBusy?.(false)},[open,onBusy]);
 useEffect(()=>()=>{token.current++},[]);
 const backup=()=>{try{download(portfolioBackup(portfolio));setError('')}catch(e){setError(e.message)}};
 async function read(file){if(!file)return;const own=++token.current;expected.current=revision;setOpen(true);setBusy(true);setError('');setPreview(null);try{if(file.size>BACKUP_LIMIT)throw Error('Portfolio backup exceeds 50 MB.');const text=await file.text();if(own!==token.current)return;setPreview(previewPortfolioRestore(text))}catch(e){if(own===token.current)setError(e.message)}finally{if(own===token.current)setBusy(false)}}
 return <><div className="portfolio-backup-actions"><Button variant="outline" disabled={!portfolio} onClick={backup}><Download size={16}/>Back up all grants</Button><Button variant="outline" onClick={()=>input.current?.click()}><Upload size={16}/>Restore backup</Button></div>{error&&!open&&<p role="alert">{error}</p>}<input ref={input} type="file" accept=".json,application/json" aria-label="Portfolio backup file" hidden onChange={e=>{const file=e.target.files?.[0];e.target.value='';read(file)}}/>
 <Dialog open={open} onOpenChange={value=>{if(!value)cancel()}}><DialogContent aria-describedby={undefined}><DialogHeader><DialogTitle>Restore portfolio</DialogTitle></DialogHeader>{busy&&<p role="status">Checking backup…</p>}{error&&<p role="alert">{error}</p>}{preview&&<><p>{preview.projectCount} {preview.projectCount===1?'project':'projects'}: {preview.awardCount} active {preview.awardCount===1?'award':'awards'}, {preview.proposalCount} {preview.proposalCount===1?'proposal':'proposals'}, {preview.archivedCount} archived.</p><p>This replaces all grants saved in this browser. It does not merge them. Back up the current portfolio first if you need to keep it.</p>{portfolio&&<Button variant="outline" onClick={backup}>Download current portfolio</Button>}<Button onClick={()=>{try{onRestore(preview.portfolio,expected.current);cancel()}catch(e){setError(e.message)}}}>Replace portfolio with backup</Button></>}<Button variant="outline" onClick={cancel}>Cancel</Button></DialogContent></Dialog></>;
}
