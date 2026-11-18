const {test}=require('node:test'),assert=require('node:assert/strict');
test('invalid semantic CSV rows block apply and explicit exclusions retain original source and valid credit rows',async()=>{
 const E=(await import('../src/lib/engine.js')).default,{prepareImport,applyReviewedImport,reviewSelection}=await import('../src/lib/import-preview.js'),{validateProject}=await import('../src/lib/validate-project.js');
 const p=E.demo();p.id='synthetic-quarantine';const before=JSON.stringify(p),options={projectId:p.id,sourceSystem:'QA',batchId:'qa-invalid'};
 const text='month,category,amount,reference\n2026-99,Other,12,bad-month\n2025-12,Other,12,outside\n2026-01,Unmapped,12,bad-category\n2026-01,Other,1.001,precision\n2026-01,Other,9007199254740992,huge\n2026-01,Other,-7.25,credit\n2026-01,Other,0,zero';
 const review=await prepareImport(p,text,options);assert.deepEqual(review.counts,{add:2,skip:0,conflict:5});assert.ok(review.rows.slice(0,5).every(r=>r.reason.startsWith('Invalid row:')));
 await assert.rejects(applyReviewedImport(p,text,options,review,validateProject),/conflicts/);
 const exclusions=review.rows.slice(0,5).map(r=>({rowNumber:r.rowNumber,reason:'Return invalid source row for correction'}));assert.equal(reviewSelection(review,exclusions).canApply,true);
 const next=await applyReviewedImport(p,text,options,review,validateProject,exclusions);assert.deepEqual(next.ledger.slice(-2).map(r=>r.amount),[-7.25,0]);assert.equal(next.importBatches.at(-1).originalCsv,text);assert.equal(next.importBatches.at(-1).decisions.filter(r=>r.decision==='excluded').length,5);assert.equal(JSON.stringify(p),before);assert.deepEqual(validateProject(next).filter(x=>x.level==='error'),[]);
 const replay=await prepareImport(next,text,{...options,batchId:'qa-replay'});assert.deepEqual(replay.counts,{add:0,skip:2,conflict:5});
 const tampered=structuredClone(review);tampered.rows[0].status='add';await assert.rejects(applyReviewedImport(p,text,options,tampered,validateProject,exclusions),/Preview changed/);
});
test('invalid row does not claim a reference before a valid row; malformed CSV stays rejected',async()=>{
 const {prepareImport}=await import('../src/lib/import-preview.js');const p={id:'qa',ledger:[],grant:{start:'2026-01',end:'2026-12'}},options={projectId:'qa',sourceSystem:'QA',batchId:'qa'};
 const r=await prepareImport(p,'month,category,amount,reference\n2026-99,Other,1,same\n2026-01,Other,1,same',options);assert.deepEqual(r.rows.map(x=>x.status),['conflict','add']);
 await assert.rejects(prepareImport(p,'month,category,amount,reference\n2026-01,Other,nope,r',options),/numeric/);await assert.rejects(prepareImport(p,'month,category,amount,reference\n"unclosed',options),/Unclosed/);
});
