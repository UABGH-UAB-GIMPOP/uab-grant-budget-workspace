const copy=x=>x===undefined?null:JSON.parse(JSON.stringify(x));
export function describeChanges(before,after){
 const changes=[];
 for(const key of new Set([...Object.keys(before),...Object.keys(after)])){
  if(['audit','savedScenarios'].includes(key))continue;
  if(JSON.stringify(before[key])===JSON.stringify(after[key]))continue;
  if(Array.isArray(before[key])&&Array.isArray(after[key])&&[...before[key],...after[key]].every(x=>x&&x.id!==undefined)){
   const old=new Map(before[key].map(x=>[String(x.id),x])),next=new Map(after[key].map(x=>[String(x.id),x]));
   for(const id of new Set([...old.keys(),...next.keys()]))if(JSON.stringify(old.get(id))!==JSON.stringify(next.get(id)))changes.push({field:key,id,before:copy(old.get(id)),after:copy(next.get(id))});
  }else changes.push({field:key,before:copy(before[key]),after:copy(after[key])});
 }
 return changes;
}

export function recordReplacement(current,incoming,action,at){
 const next=copy(incoming),seen=new Set(),history=[];
 for(const entry of [...(current.project.audit||[]),...(incoming.project.audit||[])]){const key=JSON.stringify(entry);if(!seen.has(key)){seen.add(key);history.push(copy(entry))}}
 const changes=describeChanges(current.project,incoming.project);
 changes.push(...describeChanges(current.baseline,incoming.baseline).map(c=>({...c,field:'baseline.'+c.field})));
 if(current.scenario!==incoming.scenario)changes.push({field:'scenario',before:current.scenario,after:incoming.scenario});
 history.push({at,action,scenario:incoming.scenario,actor:'Local browser',changes});
 next.project.audit=history;return next;
}
