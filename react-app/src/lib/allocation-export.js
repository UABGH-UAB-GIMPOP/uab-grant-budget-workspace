/** Historical allocation receipts, not current balances or sponsor approval. */
export function allocationReceiptSheets(project){
 const receipts=project.allocationImports||[];
 if(!receipts.length)return [];
 return [
  {name:'Allocation imports',rows:[['Receipt ID','Saved at (UTC)','Project ID','Source file','Worksheet','File SHA-256','File bytes','Header row','Period ID column','Category column','Amount column','Allocation cells','Evidence status'],...receipts.map(r=>{const w=r.workbookSource,m=w.mapping;return [r.id,r.at,r.projectId,w.fileName,m.sheetName,w.fileHash,w.byteLength,m.headerRow,m.columns.periodId,m.columns.category,m.columns.amount,r.evidence.length,'Locally retained historical evidence; not sponsor approval or authenticated audit'];})]},
  {name:'Allocation import changes',rows:[['Receipt ID','Source cell','Canonical cell','Period ID','Period start','Period end','Category','Before import (USD)','After import (USD)','Mapped source amount text','Scope'],...receipts.flatMap(r=>r.evidence.map(e=>{const before=r.before.find(p=>p.id===e.periodId),after=r.after.find(p=>p.id===e.periodId);return [r.id,e.rawCell,e.cellIdentity,e.periodId,after.start,after.end,e.category,before.allocations[e.category],after.allocations[e.category],String(e.rawAmount),'Historical import amounts, not current allocations'];}))]}
 ];
}
