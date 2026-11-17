import {loadPortfolio,savePortfolio,updatePortfolioProject} from './portfolio.js';
import {encodeStoredArchive,decodeStoredArchive,normalizeArchive} from './archive.js';
import {validateProject} from './validate-project.js';

// A project-scoped storage interface for the existing award editor. Portfolio
// revisions are checked even when another tab changed a different project.
export function projectStorage(storage,portfolioKey,projectKey,id,onSaved=(_portfolio)=>{}){
 const initial=loadPortfolio(storage,portfolioKey);
 if(initial.recovery)throw Error(initial.message);
 let expected=initial.raw;
 function read(){
  const result=loadPortfolio(storage,portfolioKey);
  if(result.recovery)throw Error(result.message);
  const item=result.portfolio.projects.find(p=>p.id===id&&!p.archived);
  if(!item)throw Error('This project is unavailable or archived.');
  return {result,item};
 }
 read();
 return {
  getItem(key){if(key!==projectKey)return storage.getItem(key);return encodeStoredArchive(read().item.archive)},
  setItem(key,raw){
   if(key!==projectKey){storage.setItem(key,raw);return;}
   const {result}=read();
   if(result.raw!==expected)throw Error('The portfolio changed in another tab. Download your draft, then reload before saving.');
   const archive=normalizeArchive(decodeStoredArchive(raw),validateProject);
   const next=updatePortfolioProject(result.portfolio,id,archive);
   const saved=savePortfolio(storage,portfolioKey,next,expected);
   expected=saved.raw;onSaved(saved.portfolio);
  },
  removeItem(key){if(key===projectKey)throw Error('Archive the project from the portfolio instead.');storage.removeItem(key)}
 };
}
