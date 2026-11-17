import {normalizeArchive,encodeStoredArchive,decodeStoredArchive} from './archive.js';
import {validateProject} from './validate-project.js';
import {reconciliationStatus} from './reconciliation.js';
import E from './engine.js';
import {returnToSource} from './scenarios.js';
const clone=x=>JSON.parse(JSON.stringify(x));
const idPattern=/^[A-Za-z0-9_-]{1,120}$/;
const FUNDERS=['Federal','State/local government','Foundation','Industry','Other','Unknown'];
export function normalizePortfolio(value){
 if(!value||value.schema!==1||!Array.isArray(value.projects)||value.projects.length>500)throw Error('Invalid portfolio file.');
 const ids=new Set();const projects=value.projects.map(item=>{
  if(!item||!idPattern.test(item.id)||ids.has(item.id))throw Error('Each project needs a unique stable ID.');ids.add(item.id);
  if(typeof item.archived!=='boolean'||typeof item.owner!=='string'||item.owner.length>200||typeof item.sponsor!=='string'||item.sponsor.length>300||!FUNDERS.includes(item.funderType))throw Error('Invalid project metadata.');
  const archive=normalizeArchive(item.archive,validateProject);
  if(archive.project.id&&archive.project.id!==item.id)throw Error('Project identity does not match the portfolio.');
  // Portfolio identity is external to the archive: preserve scenario baseline snapshots exactly.
  return {id:item.id,archived:item.archived,owner:item.owner,sponsor:item.sponsor,funderType:item.funderType,archive};
 });
 if(value.activeId!==null&&!projects.some(p=>p.id===value.activeId&&!p.archived))throw Error('Active project must exist and be unarchived.');
 return {schema:1,activeId:value.activeId,projects};
}
export function createPortfolio(){return {schema:1,activeId:null,projects:[]}}
export function addPortfolioProject(portfolio,archive,{id,owner='',sponsor='',funderType='Unknown'}){
 const next=normalizePortfolio(portfolio);if(next.projects.some(p=>p.id===id))throw Error('This project is already in the portfolio.');
 next.projects.push({id,owner,sponsor,funderType,archived:false,archive:clone(archive)});next.activeId=id;return normalizePortfolio(next);
}
export function switchProject(portfolio,id){const next=normalizePortfolio(portfolio);if(!next.projects.some(p=>p.id===id&&!p.archived))throw Error('Project is unavailable.');next.activeId=id;return next;}
export function archiveProject(portfolio,id,archived=true){const next=normalizePortfolio(portfolio),item=next.projects.find(p=>p.id===id);if(!item)throw Error('Project is unavailable.');item.archived=archived;if(next.activeId===id&&archived)next.activeId=next.projects.find(p=>!p.archived)?.id??null;return normalizePortfolio(next)}
export function updatePortfolioProject(portfolio,id,archive){const next=normalizePortfolio(portfolio),item=next.projects.find(p=>p.id===id);if(!item||item.archived)throw Error('Project is unavailable.');item.archive=clone(archive);return normalizePortfolio(next)}
export function savePortfolio(storage,key,portfolio,expectedRaw){const next=normalizePortfolio(portfolio),raw=encodeStoredArchive(next);if(storage.getItem(key)!==expectedRaw)throw Error('The portfolio changed in another tab. Reload before saving.');storage.setItem(key,raw);return {portfolio:next,raw};}
export function loadPortfolio(storage,key){let raw=null;try{raw=storage.getItem(key);return {portfolio:raw===null?createPortfolio():normalizePortfolio(decodeStoredArchive(raw)),raw,recovery:false}}catch(error){return {portfolio:null,raw,recovery:true,message:error.message}}}
export function reportingProject(item){return item.archive.project.activeScenarioId?returnToSource(item.archive.project).project:item.archive.project}
export function portfolioSummary(portfolio,{year=null,search='',includeArchived=false}={}){
 if(year!==null&&(!Number.isInteger(year)||year<1900||year>2200))throw Error('Choose a valid calendar year.');
 const p=normalizePortfolio(portfolio),q=search.trim().toLowerCase();
 const rows=p.projects.map(item=>({...item,reportingProject:reportingProject(item)})).filter(item=>(includeArchived||!item.archived)&&(!year||(item.reportingProject.grant.start<=`${year}-12`&&item.reportingProject.grant.end>=`${year}-01`))&&(!q||[item.reportingProject.grant.title,item.owner,item.sponsor].some(v=>v.toLowerCase().includes(q)))).map(item=>{
  const project=item.reportingProject,c=E.calculate(project);return {id:item.id,title:project.grant.title,owner:item.owner,sponsor:item.sponsor,funderType:item.funderType,archived:item.archived,mode:project.grant.mode,start:project.grant.start,end:project.grant.end,asOf:project.grant.asOf,source:project.grant.source||null,status:reconciliationStatus(project).label,budget:c.total.plan,actual:c.total.actual,forecast:c.total.proj,remaining:c.total.variance,forecastIncomplete:c.forecastIncomplete,nextMilestone:(project.milestones||[]).filter(x=>!x.done).sort((a,b)=>a.due.localeCompare(b.due))[0]??null};
 });
 // Proposal amounts stay separate: they are not awarded funding.
 const awarded=rows.filter(r=>r.mode!=='proposal'),proposals=rows.filter(r=>r.mode==='proposal');
 const sum=(items,key)=>E.usd(items.reduce((n,r)=>n+E.cents(r[key]),0));
 return {yearBasis:'Calendar year (project overlap; full project amounts)',rows,awardCount:awarded.length,proposalCount:proposals.length,awardedBudget:sum(awarded,'budget'),proposedBudget:sum(proposals,'budget'),reportedActual:sum(awarded,'actual'),forecast:sum(awarded,'forecast'),forecastIncomplete:awarded.some(r=>r.forecastIncomplete),mixedCutoffs:new Set(awarded.map(r=>r.asOf)).size>1,funderMix:FUNDERS.map(type=>({type,count:awarded.filter(r=>r.funderType===type).length,amount:sum(awarded.filter(r=>r.funderType===type),'budget')})).filter(x=>x.count)};
}
export {FUNDERS};

export function updatePortfolioMetadata(portfolio,id,metadata){
 const next=normalizePortfolio(portfolio),item=next.projects.find(p=>p.id===id&&!p.archived);
 if(!item)throw Error('Project is unavailable or archived.');
 if(Object.keys(metadata).some(k=>!['owner','sponsor','funderType'].includes(k)))throw Error('Unsupported project metadata.');
 for(const key of ['owner','sponsor','funderType'])if(Object.hasOwn(metadata,key))item[key]=typeof metadata[key]==='string'?metadata[key].trim():metadata[key];
 return normalizePortfolio(next);
}
