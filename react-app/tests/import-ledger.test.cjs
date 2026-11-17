const {test}=require('node:test'),assert=require('node:assert/strict');
test('CSV replay skips identical references and preserves original input',async()=>{
 const {previewLedgerCsv}=await import('../src/lib/import-ledger.js');const p={grant:{reconciled:true},ledger:[]},text='month,category,amount,reference,note\n2026-01,Other,10,r1,Note\n2026-02,Other,20,r2,Next';const first=previewLedgerCsv(p,text);assert.equal(first.added,2);assert.equal(p.ledger.length,0);const second=previewLedgerCsv(first.project,text);assert.equal(second.added,0);assert.deepEqual(second.skipped,['r1','r2']);assert.equal(second.project.ledger.length,2);
});
test('conflicting duplicates reject the full batch without mutation',async()=>{
 const {previewLedgerCsv}=await import('../src/lib/import-ledger.js');const p={grant:{},ledger:[]};assert.throws(()=>previewLedgerCsv(p,'month,category,amount,reference\n2026-01,Other,10,r1\n2026-01,Other,11,r1'),/conflicts/);assert.equal(p.ledger.length,0);
});

test('CSV money requires decimal notation and rejects JS numeric syntax',async()=>{
 const {previewLedgerCsv}=await import('../src/lib/import-ledger.js');const p={grant:{},ledger:[]};
 for(const amount of ['0x10','0b11','1e3','Infinity','NaN'])assert.throws(()=>previewLedgerCsv(p,`month,category,amount,reference\n2026-01,Other,${amount},r1`),/numeric/);
 for(const [amount,expected] of [['0',0],['-12.50',-12.5],['+12.50',12.5],['.25',.25]])assert.equal(previewLedgerCsv(p,`month,category,amount,reference\n2026-01,Other,${amount},r1`).project.ledger[0].amount,expected);
});
test('large existing ledgers allocate import IDs without argument spreading',async()=>{
 const {previewLedgerCsv}=await import('../src/lib/import-ledger.js');const p={grant:{},ledger:Array.from({length:150000},(_,i)=>({id:i+1}))};const result=previewLedgerCsv(p,'month,category,amount,reference\n2026-01,Other,10,new');assert.equal(result.project.ledger.at(-1).id,150001);assert.equal(p.ledger.length,150000);
});
test('CSV preserves partial commitment allocation and detects changed allocations',async()=>{
 const {previewLedgerCsv}=await import('../src/lib/import-ledger.js');const p={grant:{},ledger:[]},text='month,category,amount,reference,commitmentId,commitmentAmount\n2026-01,Equipment,500,INV,PO,200';const first=previewLedgerCsv(p,text);assert.equal(first.project.ledger[0].commitmentAmount,200);assert.equal(previewLedgerCsv(first.project,text).skipped.length,1);assert.throws(()=>previewLedgerCsv(first.project,text.replace(',200',',201')),/conflicts/);assert.throws(()=>previewLedgerCsv(p,text.replace(',200',',0x10')),/numeric/);
});
