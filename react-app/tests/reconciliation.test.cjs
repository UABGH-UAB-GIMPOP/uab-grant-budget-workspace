const {test}=require('node:test');const assert=require('node:assert/strict');const E=require('../engine.cjs');
test('statement comparison distinguishes partial, matched and changed totals',async()=>{
 const {statementResult}=await import('../src/lib/reconciliation.js');const p=E.demo();p.ledger=[{cat:'Travel',month:'2026-01',amount:100},{cat:'Travel',month:'2026-01',amount:-10},{cat:'Travel',month:'2026-02',amount:999}];const s={category:'Travel',start:'2026-01',end:'2026-01',total:90,complete:false};assert.equal(statementResult(p,s).status,'Partial');s.complete=true;assert.equal(statementResult(p,s).status,'Matched');p.ledger[0].amount=101;assert.equal(statementResult(p,s).status,'Mismatch');assert.equal(statementResult(p,s).difference,-1);
});
test('statement scope rejects invalid periods and categories',async()=>{
 const {validateStatements}=await import('../src/lib/reconciliation.js');const p=E.demo();p.statements=[{id:'x',source:'Statement',category:'Travel',start:'2026-01',end:'2026-02',total:0,complete:true}];assert.equal(validateStatements(p).length,0);p.statements[0].end='2025-12';assert.ok(validateStatements(p).length);
});
test('coverage requires all categories and months and refuses overlapping matched statements',async()=>{
 const {reconciliationCoverage,FA_CATEGORY}=await import('../src/lib/reconciliation.js');const p=E.demo();p.grant.start='2026-01';p.grant.end='2026-12';p.grant.asOf='2026-02';p.ledger=[];p.subPays=[];p.postedFa={'2026-01':0,'2026-02':0};
 p.statements=[...E.CATS,E.SUB,FA_CATEGORY].map((category,i)=>({id:String(i),source:'Statement',category,start:'2026-01',end:'2026-02',total:0,complete:true}));
 assert.equal(reconciliationCoverage(p).matched,true);
 p.statements.push({...p.statements[0],id:'duplicate'});assert.equal(reconciliationCoverage(p).matched,false);assert.equal(reconciliationCoverage(p).rows[0].status,'Overlapping statements');
 p.statements.pop();p.statements[0].end='2026-01';assert.deepEqual(reconciliationCoverage(p).rows[0].missing,['2026-02']);
 p.statements[0].end='2026-02';p.statements[0].total=1;assert.equal(reconciliationCoverage(p).rows[0].status,'Totals differ');
 p.statements[0].complete=false;assert.deepEqual(reconciliationCoverage(p).rows[0].missing,['2026-01','2026-02']);
 p.grant.asOf='2025-12';assert.equal(reconciliationCoverage(p).matched,false);
});

test('F&A reconciliation requires posted amounts and distinguishes zero from missing',async()=>{
 const {statementResult,validateStatements,reconciliationCoverage}=await import('../src/lib/reconciliation.js'),p=E.demo(),s={id:'fa',source:'Synthetic statement',category:'F&A',start:'2026-01',end:'2026-02',total:0,complete:true};p.statements=[s];assert.equal(validateStatements(p).length,0);
 assert.equal(statementResult(p,s).status,'Missing posted F&A');assert.equal(statementResult(p,s).actual,null);assert.equal(reconciliationCoverage(p).rows.find(r=>r.category==='F&A').status,'Missing posted F&A');
 p.postedFa={'2026-01':0,'2026-02':0};assert.equal(statementResult(p,s).status,'Matched');p.postedFa['2026-02']=1.01;assert.equal(statementResult(p,s).difference,-1.01);assert.equal(statementResult(p,s).status,'Mismatch');delete p.postedFa['2026-01'];assert.equal(statementResult(p,s).actual,null);
});

test('project import rejects coercible blank and boolean posted F&A while retaining numeric zero',async()=>{
 const {validateProject}=await import('../src/lib/validate-project.js'),{statementResult}=await import('../src/lib/reconciliation.js'),{normalizeArchive}=await import('../src/lib/archive.js');
 for(const value of ['', ' ',false,null,'0']){const p=E.demo();p.postedFa={'2026-01':value};assert.ok(validateProject(p).some(x=>x.level==='error'),JSON.stringify(value));assert.throws(()=>normalizeArchive({project:p,baseline:E.demo()},validateProject),/Posted F&A must be a finite number/);assert.equal(statementResult(p,{category:'F&A',start:'2026-01',end:'2026-01',total:0,complete:true}).status,'Missing posted F&A');}
 for(const postedFa of [{},{'2026-01':0}]){const p=E.demo();p.postedFa=postedFa;assert.equal(validateProject(p).filter(x=>x.level==='error').length,0);}
});
test('headline status ignores legacy flags and requires complete matching evidence',async()=>{
 const E=(await import('../src/lib/engine.js')).default,{reconciliationStatus,FA_CATEGORY}=await import('../src/lib/reconciliation.js');const p=E.demo();p.grant.asOf=p.grant.start;p.grant.reconciled=true;p.ledger=[];p.subPays=[];p.statements=[];
 assert.equal(reconciliationStatus(p).label,'Actuals not reconciled');assert.ok(E.calculate(p).issues.some(x=>x.message.includes('not reconciled')));
 p.statements=[...E.CATS,E.SUB,FA_CATEGORY].map((category,i)=>({id:'s'+i,source:'Synthetic statement',category,start:p.grant.start,end:p.grant.start,total:0,complete:true}));
 assert.equal(reconciliationStatus(p).matched,false);p.postedFa={[p.grant.start]:0};assert.equal(reconciliationStatus(p).label,'Statements matched');
 p.ledger.push({id:'changed',month:p.grant.start,cat:'Other',amount:1});assert.equal(reconciliationStatus(p).matched,false);p.ledger=[];
 p.statements.push({...p.statements[0],id:'overlap'});assert.equal(reconciliationStatus(p).matched,false);
 p.grant.mode='proposal';assert.equal(reconciliationStatus(p).label,'Proposal · no actuals to reconcile');assert.equal(E.calculate(p).issues.some(x=>x.message.includes('not reconciled')),false);
});
test('malformed statement imports return validation errors without throwing',async()=>{
 const E=(await import('../src/lib/engine.js')).default,{validateProject}=await import('../src/lib/validate-project.js');
 for(const statements of [{},[null],[{id:'bad',source:'Synthetic',category:'F&A',start:'2026-01',end:'2026-99',total:0,complete:true}]]){const p=E.demo();p.statements=statements;let errors;assert.doesNotThrow(()=>{errors=validateProject(p)});assert.ok(errors.some(x=>x.level==='error'));}
});
