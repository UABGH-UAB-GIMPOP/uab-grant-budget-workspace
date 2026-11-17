import E from './engine.js';
import {normalizeArchive} from './archive.js';
import {validateProject} from './validate-project.js';
export function newProject({title,start,end}){
 if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(start)||!/^\d{4}-(0[1-9]|1[0-2])$/.test(end)||end<start||E.mi(end)-E.mi(start)>=120)throw Error('Choose a valid project period of up to 10 years.');
 const p=E.demo();p.grant={...p.grant,title:title.trim(),start,end,asOf:start,mode:'proposal',indirect:0,salaryCap:0,source:'',ruleSource:'',ruleStatus:'assumed',reconciled:false};
 for(const k of ['ledger','people','supplies','costs','subawards','subPays','audit'])p[k]=[];
 p.assume={Travel:0,Other:0};p.postedFa={};
 p.planned=Object.fromEntries(Object.keys(p.planned).map(k=>[k,Array.from({length:Math.ceil(E.months(start,end).length/12)},()=>0)]));
 return normalizeArchive({project:p,baseline:p,scenario:'Working budget'},validateProject);
}
