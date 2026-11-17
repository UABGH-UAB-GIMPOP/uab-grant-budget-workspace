import {PortfolioBackup} from './portfolio-backup';
import {projectHash,resolveProjectHash} from '../lib/project-route';
import React,{useState,useMemo,useEffect} from 'react';
import {PortfolioView} from './portfolio-view';
import {Button} from './ui/button';
import {Input} from './ui/input';
import {Dialog,DialogContent,DialogHeader,DialogTitle} from './ui/dialog';
import {loadPortfolio,savePortfolio,addPortfolioProject,archiveProject,updatePortfolioMetadata,FUNDERS} from '../lib/portfolio';
import {projectStorage} from '../lib/portfolio-storage';
import {browserStorage,decodeStoredArchive,normalizeArchive} from '../lib/archive';
import {validateProject} from '../lib/validate-project';
import {newProject} from '../lib/new-project';
const KEY='uab-grant-portfolio-v1',LEGACY='uab-grant-react-v1';
export function WorkspaceShell({renderAward,fresh}){
 const [backupBusy,setBackupBusy]=useState(false);
 const [recovered,setRecovered]=useState(false);
 const [childBusy,setChildBusy]=useState(false);
 const [metadataId,setMetadataId]=useState<string|null>(null);
 const [filters,setFilters]=useState({query:'',year:'all',archived:false});
 const [storage]=useState(()=>browserStorage(()=>localStorage));
 const [initial]=useState(()=>loadPortfolio(storage,KEY));
 const [portfolio,setPortfolio]=useState(initial.portfolio),[revision,setRevision]=useState(initial.raw);
 const [route]=useState(()=>resolveProjectHash(window.location.hash,initial.portfolio));
 const [active,setActiveState]=useState<string|null>(route.id),[creating,setCreating]=useState(false),[error,setError]=useState(initial.message||route.error||'');
 const setActive=(id:string|null)=>{window.history.replaceState(null,'',projectHash(id));setActiveState(id);setError('')};
 useEffect(()=>{const changed=()=>{if(childBusy||creating||metadataId||backupBusy){window.history.replaceState(null,'',projectHash(active));setError('Save or cancel your current changes before opening another project.');return}const next=resolveProjectHash(window.location.hash,portfolio);setError(next.error||'');setActiveState(next.id)};window.addEventListener('hashchange',changed);return ()=>window.removeEventListener('hashchange',changed)},[active,childBusy,portfolio,creating,metadataId,backupBusy]);
 const save=(next,expected=revision)=>{const result=savePortfolio(storage,KEY,next,expected);setRecovered(true);setPortfolio(result.portfolio);setRevision(result.raw);setError('');return result.portfolio};
 const awardStorage=useMemo(()=>{if(!active)return null;try{return projectStorage(storage,KEY,LEGACY,active,p=>{setPortfolio(p);setRevision(storage.getItem(KEY))})}catch(e){return {getItem(){throw e},setItem(){throw e}}}},[active,storage]);
 const initialize=()=>{try{const raw=storage.getItem(LEGACY);const archive=raw===null?{project:fresh()}:decodeStoredArchive(raw);const valid=normalizeArchive(archive,validateProject);save(addPortfolioProject(portfolio,valid,{id:valid.project.id||crypto.randomUUID()}));}catch(e){setError(e.message)}};
 if(active)return renderAward({key:active,projectId:active,onBusy:setChildBusy,navigationNotice:error,storageOverride:awardStorage,onExit:()=>setActive(null)});
 return <><div className="demo">Public demo · Fake data only · Not an official ledger · Do not import real data</div><main className="portfolio-shell"><PortfolioBackup portfolio={portfolio} revision={revision} onBusy={setBackupBusy} onRestore={(next,expected)=>{save(next,expected);setFilters({query:'',year:'all',archived:false})}}/>{error&&<div className="error" role="alert">{error}</div>}{initial.recovery&&!recovered?<><h1>Saved portfolio needs attention</h1><p>Your saved data has not been replaced. Download it before attempting recovery.</p><Button onClick={()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([initial.raw??''],{type:'text/plain'}));a.download='portfolio-recovery.txt';a.click();URL.revokeObjectURL(a.href)}}>Download saved data</Button></>:revision===null?<><h1>Your grant workspace</h1><p>Bring your saved budget into the portfolio. The original saved copy will be retained.</p><Button onClick={initialize}>Open portfolio</Button></>:<PortfolioView onEditMetadata={setMetadataId} filters={filters} onFilters={setFilters} portfolio={portfolio} onOpen={setActive} onCreate={()=>setCreating(true)} onArchive={(id,value)=>{try{save(archiveProject(portfolio,id,value))}catch(e){setError(e.message)}}}/>}</main>
 <Dialog open={!!metadataId} onOpenChange={open=>{if(!open)setMetadataId(null)}}><DialogContent aria-describedby={undefined}><DialogHeader><DialogTitle>Project details</DialogTitle></DialogHeader>{metadataId&&(()=>{const item=portfolio.projects.find(p=>p.id===metadataId);return <form className="form" onSubmit={e=>{e.preventDefault();try{const f=new FormData(e.currentTarget);save(updatePortfolioMetadata(portfolio,metadataId,{owner:String(f.get('owner')),sponsor:String(f.get('sponsor')),funderType:String(f.get('funder'))}));setMetadataId(null)}catch(err){setError(err.message)}}}><p>{item.archive.project.grant.title}</p><label>Owner<Input name="owner" defaultValue={item.owner} maxLength={200}/></label><label>Sponsor<Input name="sponsor" defaultValue={item.sponsor} maxLength={300}/></label><label>Funder type<select name="funder" defaultValue={item.funderType}>{FUNDERS.map(f=><option key={f}>{f}</option>)}</select></label>{error&&<p role="alert">{error}</p>}<Button type="submit">Save details</Button><Button type="button" variant="outline" onClick={()=>setMetadataId(null)}>Cancel</Button></form>})()}</DialogContent></Dialog>
 <Dialog open={creating} onOpenChange={setCreating}><DialogContent aria-describedby={undefined}><DialogHeader><DialogTitle>New project</DialogTitle></DialogHeader><form className="form" onSubmit={e=>{e.preventDefault();try{const f=new FormData(e.currentTarget),archive=newProject({title:String(f.get('title')),start:String(f.get('start')),end:String(f.get('end'))});const id=crypto.randomUUID();save(addPortfolioProject(portfolio,archive,{id,owner:String(f.get('owner')),sponsor:String(f.get('sponsor')),funderType:String(f.get('funder'))}));setCreating(false);setActive(id)}catch(err){setError(err.message)}}}>
 <label>Project title<Input name="title" required maxLength={300}/></label><label>Owner<Input name="owner" maxLength={200}/></label><label>Sponsor<Input name="sponsor" maxLength={300}/></label><label>Funder type<select name="funder" defaultValue="Unknown">{FUNDERS.map(f=><option key={f}>{f}</option>)}</select></label><label>Start month<Input name="start" type="month" required/></label><label>End month<Input name="end" type="month" required/></label><p>Starts as a proposal with no costs. Confirm sponsor rates and rules in Setup.</p>{error&&<p role="alert">{error}</p>}<Button type="submit">Create project</Button></form></DialogContent></Dialog></>;
}
