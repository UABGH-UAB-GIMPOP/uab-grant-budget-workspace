const {test}=require('node:test'),assert=require('node:assert/strict');
test('CSV decimal validation preserves source cents before numeric coercion',async()=>{
 const {exactCsvMoney}=await import('../src/lib/csv-money.js');
 for(const raw of ['1.0000000000000001','0.0099999999999999999','-1.0000000000000001','90071992547409.91','-90071992547409.91','90071992547409.92','999999999999999999999999999'])assert.throws(()=>exactCsvMoney(raw),/decimal places|precision|losing cents/,raw);
 for(const [raw,value] of [['1.0000',1],['  +001.20 ',1.2],['-.25',-.25],['0',0],['-0.00',0],['.010000',.01],['90071992547409.90',90071992547409.9],['-90071992547409.90',-90071992547409.9]])assert.equal(exactCsvMoney(raw),value,raw);
 for(const raw of ['1e2','1E-2','1,000','NaN','Infinity','', '.', '0x10'])assert.throws(()=>exactCsvMoney(raw),/plain decimal/);
});
test('adversarial CSV values and allocation amounts are quarantined, never applied',async()=>{
 const E=(await import('../src/lib/engine.js')).default,{prepareImport,applyReviewedImport}=await import('../src/lib/import-preview.js');const p=E.demo();p.id='raw-money';const options={projectId:p.id,sourceSystem:'QA',batchId:'raw'},before=JSON.stringify(p);
 for(const value of ['1.0000000000000001','0.0099999999999999999','90071992547409.91']){
 const text=`month,category,amount,reference\n2026-01,Other,${value},r`;const review=await prepareImport(p,text,options);assert.equal(review.rows[0].status,'conflict');assert.equal(review.rows[0].sourceRecord.amount,value);await assert.rejects(applyReviewedImport(p,text,options,review,()=>[]),/conflicts/);
 }
 const allocation=await prepareImport(p,'month,category,amount,reference,commitmentId,commitmentAmount\n2026-01,Other,2,r,c,1.0000000000000001',options);assert.match(allocation.rows[0].reason,/Commitment allocation/);assert.equal(allocation.rows[0].status,'conflict');
 await assert.rejects(prepareImport(p,'month,category,amount,reference\n2026-01,Other,1e2,r',options),/numeric/);assert.equal(JSON.stringify(p),before);
});
