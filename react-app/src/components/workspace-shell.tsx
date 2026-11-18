import {DISPLAY_KEY} from '../lib/display-preferences';
import {returnToSource} from '../lib/scenarios';
import {Breadcrumb,BreadcrumbList,BreadcrumbItem,BreadcrumbPage,BreadcrumbSeparator,BreadcrumbLink} from './ui/breadcrumb';
import {WorkspaceSettings} from './workspace-settings';
import {PortfolioDocuments} from './portfolio-documents';
import {recordReplacement} from '../lib/history';
import {PortfolioReports} from './portfolio-reports';
import {PortfolioTasks} from './portfolio-tasks';
import {PortfolioTransactions} from './portfolio-transactions';
import {ProjectSearch} from './project-search';
import {FormSelect} from './form-select';
import {WorkspaceNavigation} from './workspace-navigation';
import {PortfolioBackup} from './portfolio-backup';
import {projectHash,resolveProjectHash} from '../lib/project-route';
import React,{useState,useMemo,useEffect,useRef,useLayoutEffect} from 'react';
import {PortfolioView} from './portfolio-view';
import {Button} from './ui/button';
import {Input} from './ui/input';
import {Dialog,DialogContent,DialogHeader,DialogTitle} from './ui/dialog';
import {loadPortfolio,savePortfolio,addPortfolioProject,archiveProject,updatePortfolioMetadata,reportingProject,updatePortfolioProject,FUNDERS} from '../lib/portfolio';
import {projectStorage} from '../lib/portfolio-storage';
import {browserStorage,decodeStoredArchive,normalizeArchive} from '../lib/archive';
import {validateProject} from '../lib/validate-project';
import {newProject} from '../lib/new-project';
import {BudgetAssistant} from './budget-assistant';
const KEY='uab-grant-portfolio-v1',LEGACY='uab-grant-react-v1';
export function WorkspaceShell({renderAward,fresh}){
 const [workspaceView,setWorkspaceView]=useState('overview'),[navigationRequest,setNavigationRequest]=useState(0);
 const [assistantOpen,setAssistantOpen]=useState(false);
 const closeAssistantForNavigation=()=>{const mobile=typeof window.matchMedia==='function'?window.matchMedia('(max-width: 520px)').matches:window.innerWidth<=520;if(!mobile)return;window.dispatchEvent(new Event('budget-assistant:navigate'));setAssistantOpen(false)};
 const [awardTarget,setAwardTarget]=useState<{projectId:string,personId?:any,transaction?:any}|null>(null),[reportState,setReportState]=useState({tab:'financial',query:'',status:'all',effort:{year:new Date().getFullYear(),query:'',scope:'all',page:0,unlinkedPage:0,expandedKeys:[],expandedMonths:[]}});
 const openWorkspace=view=>{closeAssistantForNavigation();setWorkspaceView(view);setActive(null);setNavigationRequest(n=>n+1)};
 const openOverview=()=>openWorkspace('overview');
 const openAwards=()=>openWorkspace('awards');
 const openForecasts=()=>openWorkspace('forecasts');
 const openSettings=()=>openWorkspace('settings');
 const openDocuments=()=>openWorkspace('documents');
 const openReports=()=>openWorkspace('reports');
 const openTasks=()=>openWorkspace('tasks');
 const openTransactions=()=>openWorkspace('transactions');
 const [transactionState,setTransactionState]=useState({query:'',project:'',page:0});
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
 const portfolioScroll=useRef(0),previousRoute=useRef(active),previousWorkspace=useRef(workspaceView),previousRequest=useRef(navigationRequest),originFocus=useRef<string|null>(null);
 useLayoutEffect(()=>{
  const previous=previousRoute.current,workspaceChanged=previousWorkspace.current!==workspaceView,requested=previousRequest.current!==navigationRequest;
  if(previous===active&&!workspaceChanged&&!requested)return;
  previousRoute.current=active;previousWorkspace.current=workspaceView;previousRequest.current=navigationRequest;
  window.scrollTo?.({top:active||workspaceChanged||requested?0:portfolioScroll.current,behavior:'instant' as ScrollBehavior});
  const frame=window.requestAnimationFrame(()=>{
   let target:HTMLElement|null=null;
   if(!active&&!workspaceChanged&&!requested&&previous){
    const candidates=[...document.querySelectorAll<HTMLElement>('[data-project-focus]')].filter(el=>el.getClientRects().length>0);
    target=candidates.find(el=>el.getAttribute('data-project-focus')===originFocus.current)??candidates.find(el=>el.getAttribute('data-project-id')===previous)??null;
   }
   if(active&&awardTarget?.projectId===active&&awardTarget.personId!==undefined){target=[...document.querySelectorAll<HTMLElement>('.workspace [data-person-id]')].find(row=>row.getAttribute('data-person-id')===String(awardTarget.personId))??null;if(target){target.tabIndex=-1;target.scrollIntoView?.({block:'center'})}}
   target??=document.querySelector<HTMLElement>(active?'.workspace h1':'.portfolio-shell h1');
   if(target?.isConnected){if(target.tagName==='H1')target.tabIndex=-1;target.focus({preventScroll:true})}
  });
  return()=>window.cancelAnimationFrame(frame);
 },[active,workspaceView,navigationRequest,awardTarget]);
 const openPerson=(projectId,personId)=>{setAwardTarget({projectId,personId});setActive(projectId)};
 const openTransaction=(projectId,transaction)=>{setAwardTarget({projectId,transaction});setActive(projectId)};
 const setActive=(id:string|null)=>{closeAssistantForNavigation();if(active===null&&id!==null){portfolioScroll.current=window.scrollY;originFocus.current=document.activeElement?.getAttribute('data-project-focus')??null}window.history.replaceState(null,'',projectHash(id));if(id&&id===active)setNavigationRequest(n=>n+1);if(id===null)setAwardTarget(null);setActiveState(id);setError('')};
 useEffect(()=>{const changed=()=>{if(childBusy||creating||metadataId||backupBusy){window.history.replaceState(null,'',projectHash(active));setError('Save or cancel your current changes before opening another project.');return}const next=resolveProjectHash(window.location.hash,portfolio);if(next.id!==active)closeAssistantForNavigation();if(active===null&&next.id!==null)portfolioScroll.current=window.scrollY;setError(next.error||'');setActiveState(next.id)};window.addEventListener('hashchange',changed);return ()=>window.removeEventListener('hashchange',changed)},[active,childBusy,portfolio,creating,metadataId,backupBusy]);
 const save=(next,expected=revision)=>{const result=savePortfolio(storage,KEY,next,expected);setRecovered(true);setPortfolio(result.portfolio);setRevision(result.raw);setError('');return result.portfolio};
 const sourceReadOnly=!!(active&&awardTarget?.projectId===active&&portfolio?.projects.find(p=>p.id===active)?.archive.project.activeScenarioId);
 const openWorkingBudget=()=>{closeAssistantForNavigation();setAwardTarget(null);setNavigationRequest(n=>n+1)};
 const awardStorage=useMemo(()=>{if(!active)return null;try{if(sourceReadOnly){const item=portfolio.projects.find(p=>p.id===active),raw=JSON.stringify(returnToSource(item.archive.project));return {getItem:key=>key===LEGACY?raw:storage.getItem(key),setItem:(key,value)=>{if(key!==DISPLAY_KEY)throw Error('The source view is read-only. Open the saved scenario to edit.');storage.setItem(key,value)}}}return projectStorage(storage,KEY,LEGACY,active,p=>{setPortfolio(p);setRevision(storage.getItem(KEY))})}catch(e){return {getItem(){throw e},setItem(){throw e}}}},[active,storage,sourceReadOnly,awardTarget]);
 const initialize=()=>{try{const raw=storage.getItem(LEGACY);const archive=raw===null?{project:fresh()}:decodeStoredArchive(raw);const valid=normalizeArchive(archive,validateProject);save(addPortfolioProject(portfolio,valid,{id:valid.project.id||crypto.randomUUID()}));}catch(e){setError(e.message)}};
 const searchable=(portfolio?.projects??[]).filter(p=>!p.archived).map(p=>({id:p.id,title:reportingProject(p).grant.title,owner:p.owner,sponsor:p.sponsor}));
 const activeItem=active?portfolio?.projects.find(p=>p.id===active&&!p.archived):null;
 const assistant=<BudgetAssistant project={activeItem?.archive.project??null} projectId={activeItem?.id??null} saved={!!activeItem} editing={childBusy||backupBusy||creating||!!metadataId||sourceReadOnly} savedRevision={revision} open={assistantOpen} onOpenChange={setAssistantOpen}/>;
 const content=active?renderAward({key:active+':'+(sourceReadOnly?'source':'working'),projectId:active,readOnlyReason:sourceReadOnly?(awardTarget?.transaction?'Viewing source transactions. The saved scenario is unchanged.':'Viewing source personnel. The saved scenario is unchanged.'):'',onOpenWorkingBudget:sourceReadOnly?openWorkingBudget:undefined,initialView:awardTarget?.projectId===active?(awardTarget.transaction?(awardTarget.transaction.kind==='Ledger'?'Ledger':'Subawards'):'Personnel'):undefined,initialTransaction:awardTarget?.projectId===active?awardTarget.transaction:undefined,onOverview:openOverview,returnLabel:({overview:'Overview',awards:'Awards',forecasts:'Forecasts',transactions:'Transactions',tasks:'Tasks & deadlines',reports:'Reports',documents:'Documents',settings:'Settings'})[workspaceView],onBusy:setChildBusy,onAssistant:()=>setAssistantOpen(true),onAssistantNavigate:closeAssistantForNavigation,navigationNotice:error,searchableProjects:searchable,onTransactions:openTransactions,onTasks:openTasks,onReports:openReports,onDocuments:openDocuments,onSettings:openSettings,onAwards:openAwards,onForecasts:openForecasts,onOpenProject:setActive,storageOverride:awardStorage,onExit:()=>setActive(null)}):null;
 const portfolioContent=<><div className="demo">Public demo · Fake data only · Not an official ledger · Do not import real data</div><div className="portfolio-layout"><WorkspaceNavigation onAwards={openAwards} onForecasts={openForecasts} onSettings={openSettings} onDocuments={openDocuments} onReports={openReports} onTasks={openTasks} workspaceView={workspaceView} onTransactions={openTransactions} search={<ProjectSearch projects={searchable} onOpen={setActive} disabled={childBusy||backupBusy||creating||!!metadataId}/>} disabled={childBusy||backupBusy||creating||!!metadataId} onGrants={openOverview}/><main className="portfolio-shell">{error&&<div className="error" role="alert">{error}</div>}{['transactions','tasks','reports','documents','settings'].includes(workspaceView)&&<Breadcrumb><BreadcrumbList><BreadcrumbItem><BreadcrumbLink asChild><button disabled={childBusy||backupBusy||creating||!!metadataId} onClick={openOverview}>Workspace</button></BreadcrumbLink></BreadcrumbItem><BreadcrumbSeparator/><BreadcrumbItem><BreadcrumbPage>{{transactions:'Transactions',tasks:'Tasks & deadlines',reports:'Reports',documents:'Documents',settings:'Settings'}[workspaceView]}</BreadcrumbPage></BreadcrumbItem></BreadcrumbList></Breadcrumb>}{initial.recovery&&!recovered?<><h1>Saved portfolio needs attention</h1><p>Your saved data has not been replaced. Download it before attempting recovery.</p><Button onClick={()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([initial.raw??''],{type:'text/plain'}));a.download='portfolio-recovery.txt';a.click();URL.revokeObjectURL(a.href)}}>Download saved data</Button></>:revision===null?<><h1>Your grant workspace</h1><p>Bring your saved budget into the portfolio. The original saved copy will be retained.</p><Button onClick={initialize}>Open portfolio</Button></>:workspaceView==='transactions'?<PortfolioTransactions portfolio={portfolio} onOpen={setActive} state={transactionState} onStateChange={setTransactionState} onOpenTransaction={openTransaction}/>:workspaceView==='settings'?<WorkspaceSettings storage={storage} onBusy={setChildBusy}/>:workspaceView==='documents'?<PortfolioDocuments portfolio={portfolio} onOpen={setActive} onBusy={setChildBusy} onSaveProject={(id,project)=>{const item=portfolio.projects.find(p=>p.id===id&&!p.archived);if(!item||item.archive.project.activeScenarioId)throw Error('Open the source budget before changing document links.');const archive=recordReplacement(item.archive,{...item.archive,project},'Update document links',new Date().toISOString());save(updatePortfolioProject(portfolio,id,archive))}}/>:workspaceView==='reports'?<PortfolioReports portfolio={portfolio} onOpen={setActive} onOpenPerson={openPerson} state={reportState} onStateChange={setReportState}/>:workspaceView==='tasks'?<PortfolioTasks portfolio={portfolio} onOpen={setActive}/>:<PortfolioView mode={workspaceView} onEditMetadata={setMetadataId} filters={filters} onFilters={setFilters} portfolio={portfolio} onOpen={setActive} onCreate={()=>setCreating(true)} onArchive={(id,value)=>{try{save(archiveProject(portfolio,id,value))}catch(e){setError(e.message)}}}/>}<details className="workspace-recovery-tools"><summary>Backup &amp; recovery</summary><PortfolioBackup disabled={childBusy||creating||!!metadataId} portfolio={portfolio} revision={revision} onBusy={setBackupBusy} onRestore={(next,expected)=>{save(next,expected);setFilters({query:'',year:'all',archived:false});setTransactionState({query:'',project:'',page:0})}}/></details></main></div>
 <Dialog open={!!metadataId} onOpenChange={open=>{if(!open)setMetadataId(null)}}><DialogContent aria-describedby={undefined}><DialogHeader><DialogTitle>Project details</DialogTitle></DialogHeader>{metadataId&&(()=>{const item=portfolio.projects.find(p=>p.id===metadataId);return <form className="form project-metadata-form" onSubmit={e=>{e.preventDefault();try{const f=new FormData(e.currentTarget);save(updatePortfolioMetadata(portfolio,metadataId,{owner:String(f.get('owner')),sponsor:String(f.get('sponsor')),funderType:String(f.get('funder'))}));setMetadataId(null)}catch(err){setError(err.message)}}}><p>{item.archive.project.grant.title}</p><label>Owner<Input name="owner" defaultValue={item.owner} maxLength={200}/></label><label>Sponsor<Input name="sponsor" defaultValue={item.sponsor} maxLength={300}/></label><label>Funder type<FormSelect name="funder" label="Funder type" defaultValue={item.funderType}>{FUNDERS.map(f=><option key={f}>{f}</option>)}</FormSelect></label>{error&&<p role="alert">{error}</p>}<Button type="submit">Save details</Button><Button type="button" variant="outline" onClick={()=>setMetadataId(null)}>Cancel</Button></form>})()}</DialogContent></Dialog>
 <Dialog open={creating} onOpenChange={setCreating}><DialogContent aria-describedby={undefined}><DialogHeader><DialogTitle>New project</DialogTitle></DialogHeader><form className="form" onSubmit={e=>{e.preventDefault();try{const f=new FormData(e.currentTarget),archive=newProject({title:String(f.get('title')),start:String(f.get('start')),end:String(f.get('end'))});const id=crypto.randomUUID();save(addPortfolioProject(portfolio,archive,{id,owner:String(f.get('owner')),sponsor:String(f.get('sponsor')),funderType:String(f.get('funder'))}));setCreating(false);setActive(id)}catch(err){setError(err.message)}}}>
 <label>Project title<Input name="title" required maxLength={300}/></label><label>Owner<Input name="owner" maxLength={200}/></label><label>Sponsor<Input name="sponsor" maxLength={300}/></label><label>Funder type<FormSelect name="funder" label="Funder type" defaultValue="Unknown">{FUNDERS.map(f=><option key={f}>{f}</option>)}</FormSelect></label><label>Start month<Input name="start" type="month" required/></label><label>End month<Input name="end" type="month" required/></label><p>Starts as a proposal with no costs. Confirm sponsor rates and rules in Setup.</p>{error&&<p role="alert">{error}</p>}<Button type="submit">Create project</Button></form></DialogContent></Dialog></>;
 return <div className="workspace-root">{content??portfolioContent}{assistant}</div>;
}
