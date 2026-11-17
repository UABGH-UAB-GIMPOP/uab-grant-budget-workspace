export function ensureCostIds(project){
 const copy=JSON.parse(JSON.stringify(project));
 for(const name of ['supplies','costs']){if(!Array.isArray(copy?.[name]))continue;const used=new Set(copy[name].filter(Boolean).map(r=>String(r.id)));copy[name].forEach((row,i)=>{if(!row||row.id!==undefined&&row.id!==null&&row.id!=='')return;let id=`migrated-${name}-${i}`,n=0;while(used.has(id))id=`migrated-${name}-${i}-${++n}`;row.id=id;used.add(id)})}
 return copy;
}
