const {test}=require('node:test'),assert=require('node:assert/strict');
test('CSV preserves quoted notes, escaped quotes, BOM and settlement identity',async()=>{
 const {csvRecords}=await import('../src/lib/csv.js');const rows=csvRecords('\uFEFFmonth,category,amount,reference,note,commitmentId\r\n2026-01, Supplies ,0, REF-1 ,"First, line\nHe said ""yes""", po-1 \r\n');assert.equal(rows[0].amount,'0');assert.equal(rows[0].category,'Supplies');assert.equal(rows[0].reference,'REF-1');assert.equal(rows[0].note,'First, line\nHe said "yes"');assert.equal(rows[0].commitmentId,'po-1');
});
test('CSV rejects ambiguous headers, truncated or extra fields and malformed quotes',async()=>{
 const {csvRecords}=await import('../src/lib/csv.js');const header='month,category,amount,reference\n';for(const text of ['',header,'month,category,amount,reference,amount\n2026-01,Other,1,r,2',header+'2026-01,Other,1',header+'2026-01,Other,1,r,extra',header+'2026-01,Other,1,"r"oops',header+'2026-01,Other,1,r"bad',header+'2026-01,Other,1,"r'])assert.throws(()=>csvRecords(text));
});
