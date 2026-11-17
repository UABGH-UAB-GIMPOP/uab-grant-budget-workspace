export const CADENCES=['Once','Monthly','Quarterly','Annually'];
export function validDate(value){return typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;}
export function safeEvidence(value){if(value===''||value===undefined)return true;try{const u=new URL(value);return ['https:','http:'].includes(u.protocol)&&!u.username&&!u.password;}catch{return false;}}
export function nextMilestoneDate(due,cadence,anchorDay){
 if(!validDate(due)||!CADENCES.includes(cadence))throw Error('Choose a valid due date and cadence.');
 if(cadence==='Once')return null;
 const d=new Date(due+'T12:00:00Z'),step={Monthly:1,Quarterly:3,Annually:12}[cadence],day=anchorDay??d.getUTCDate();
 if(!Number.isInteger(day)||day<1||day>31)throw Error('Invalid recurring day.');
 const next=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+step,1,12));
 const last=new Date(Date.UTC(next.getUTCFullYear(),next.getUTCMonth()+1,0)).getUTCDate();next.setUTCDate(Math.min(day,last));
 const result=next.toISOString().slice(0,10);if(!validDate(result))throw Error('Recurring date is outside the supported range.');return result;
}
export function completeMilestone(items,id,done,newId,at=new Date().toISOString()){
 const result=JSON.parse(JSON.stringify(items)),m=result.find(x=>x.id===id);if(!m)throw Error('Milestone no longer exists.');
 if(typeof done!=='boolean'||!Number.isFinite(Date.parse(at)))throw Error('Invalid completion.');
 if(m.done&&done)return result;m.done=done;if(!done){delete m.completedAt;return result;}m.completedAt=at;
 const cadence=m.cadence??'Once';if(cadence==='Once'||result.some(x=>x.previousId===m.id))return result;
 if(!newId||result.some(x=>x.id===newId))throw Error('A unique milestone ID is required.');
 const anchorDay=m.anchorDay??Number(m.due.slice(8)),due=nextMilestoneDate(m.due,cadence,anchorDay);
 result.push({id:newId,title:m.title,owner:m.owner,due,done:false,cadence,evidence:'',seriesId:m.seriesId??m.id,previousId:m.id,anchorDay});return result;
}
export function validateMilestones(items){
 if(items===undefined)return [];if(!Array.isArray(items))return [{level:'error',message:'Milestones must be a list.'}];
 const issues=[],ids=new Set();for(const m of items){
 if(!m||typeof m.id!=='string'||!m.id||ids.has(m.id)||typeof m.title!=='string'||!m.title.trim()||typeof m.owner!=='string'||typeof m.done!=='boolean'||!validDate(m.due)||!CADENCES.includes(m.cadence??'Once')||!safeEvidence(m.evidence)||(m.completedAt!==undefined&&(typeof m.completedAt!=='string'||!Number.isFinite(Date.parse(m.completedAt))))||(m.anchorDay!==undefined&&(!Number.isInteger(m.anchorDay)||m.anchorDay<1||m.anchorDay>31))||['seriesId','previousId'].some(k=>m[k]!==undefined&&(typeof m[k]!=='string'||!m[k])))issues.push({level:'error',message:'Milestones need a title, valid date, cadence and an http(s) evidence link if provided.'});
 if(m)ids.add(m.id);
 }
 const byId=new Map(items.filter(Boolean).map(m=>[m.id,m]));
 const previous=new Set();for(const m of items){if(m?.previousId){if(previous.has(m.previousId)||m.previousId===m.id)issues.push({level:'error',message:'A milestone can have only one next occurrence.'});previous.add(m.previousId);const parent=byId.get(m.previousId);if(!parent||m.due<=parent.due||m.seriesId!==(parent.seriesId??parent.id))issues.push({level:'error',message:'Recurring milestones must follow an earlier occurrence in the same series. Keep referenced occurrences in the history.'});}}
 return issues;
}
