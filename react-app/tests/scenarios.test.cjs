const {test}=require('node:test');const assert=require('node:assert/strict');const E=require('../engine.cjs');
test('saved scenarios isolate budgets, preserve baseline and avoid recursive snapshots',async()=>{
 const {saveScenario,restoreScenario}=await import('../src/lib/scenarios.js');const p=E.demo(),b=E.demo();let working=saveScenario(p,b,'Alternative A','a','2026-11-17T00:00:00Z');working.people[0].salary=1;working=saveScenario(working,b,'Alternative B','b','2026-11-17T01:00:00Z');const restored=restoreScenario(working,'a');assert.equal(restored.project.people[0].salary,p.people[0].salary);assert.equal(restored.project.savedScenarios.length,2);assert.equal(working.savedScenarios[1].project.savedScenarios,undefined);restored.project.people[0].salary=2;assert.notEqual(working.savedScenarios[0].project.people[0].salary,2);assert.throws(()=>restoreScenario(working,'missing'));
});
test('import validates nested scenario milestone data and malformed root safely',async()=>{
 const {validateProject}=await import('../src/lib/validate-project.js');const {saveScenario}=await import('../src/lib/scenarios.js');const p=E.demo();const saved=saveScenario(p,p,'A','a','2026-11-17T00:00:00Z');saved.savedScenarios[0].project.milestones='invalid';assert.ok(validateProject(saved).some(x=>x.level==='error'));assert.ok(validateProject(null).some(x=>x.level==='error'));
});
test('imports reject empty scenario IDs, non-text timestamps and malformed history',async()=>{
 const {validateProject}=await import('../src/lib/validate-project.js'),{saveScenario}=await import('../src/lib/scenarios.js');const p=E.demo();
 for(const change of [s=>s.savedScenarios[0].id='',s=>s.savedScenarios[0].at=2026,s=>s.audit={},s=>s.audit=[{at:'2026-11-17T00:00:00Z',action:'Edit',changes:{}}],s=>s.audit=[{at:'2026-11-17T00:00:00Z',action:'Edit',changes:[null]}]]){const s=saveScenario(p,p,'A','a','2026-11-17T00:00:00Z');change(s);assert.ok(validateProject(s).some(x=>x.level==='error'))}
});
test('scenarios isolate explicit periods and imported source history across archive restore',async()=>{
 const {saveScenario,restoreScenario}=await import('../src/lib/scenarios.js'),{allocationPeriods,splitBudgetPeriod}=await import('../src/lib/budget-periods.js'),{prepareImport,applyReviewedImport}=await import('../src/lib/import-preview.js'),{validateProject}=await import('../src/lib/validate-project.js'),{normalizeArchive}=await import('../src/lib/archive.js'),E=(await import('../src/lib/engine.js')).default;
 let p=E.demo();p.id='scenario-project';p.budgetPeriods=allocationPeriods(p);const baseline=structuredClone(p),text='month,category,amount,reference\n2026-01,Other,5.25,scenario-source',scope={projectId:p.id,sourceSystem:'Synthetic',batchId:'batch-scenario'},review=await prepareImport(p,text,scope);p=await applyReviewedImport(p,text,scope,review,validateProject);const saved=saveScenario(p,baseline,'Imported baseline','scenario-1','2026-11-17T12:00:00Z'),working=structuredClone(saved);working.budgetPeriods=splitBudgetPeriod(working.budgetPeriods,working.budgetPeriods[0].id);working.budgetPeriods[0].allocations.Other+=100;working.importBatches[0].originalCsv='altered';working.ledger.at(-1).amount=1000;
 const restored=restoreScenario(saved,'scenario-1');assert.equal(restored.project.ledger.at(-1).amount,5.25);assert.equal(restored.project.importBatches[0].originalCsv,text);assert.deepEqual(restored.project.budgetPeriods,p.budgetPeriods);assert.deepEqual(restored.baseline.budgetPeriods,baseline.budgetPeriods);const archived=normalizeArchive(restored,validateProject);assert.equal(archived.project.savedScenarios.length,1);assert.equal(archived.project.savedScenarios[0].project.savedScenarios,undefined);archived.project.budgetPeriods[0].allocations.Other=42;assert.notEqual(archived.project.savedScenarios[0].project.budgetPeriods[0].allocations.Other,42);
});
test('active scenario locks actuals and comparison while allowing forecast assumptions',async()=>{
 const {saveScenario,restoreScenario,returnToSource}=await import('../src/lib/scenarios.js'),{validateProject}=await import('../src/lib/validate-project.js'),{normalizeArchive}=await import('../src/lib/archive.js');
 const p=E.demo(),saved=saveScenario(p,p,'Staffing option','locked','2026-11-17T00:00:00Z');
 saved.people[0].salary+=1000;assert.equal(validateProject(saved).filter(x=>x.level==='error').length,0);
 for(const mutate of [x=>x.ledger[0].amount+=1,x=>x.subPays[0].amount+=1,x=>x.statements=[{}],x=>x.grant.asOf='2026-08',x=>x.grant.source='Changed',x=>x.grant.mode='proposal',x=>x.importBatches=[{}]]){
  const changed=structuredClone(saved);mutate(changed);assert.ok(validateProject(changed).some(x=>x.level==='error'));
 }
 const changedBaseline=structuredClone(p);changedBaseline.people[0].salary+=1;assert.throws(()=>normalizeArchive({project:saved,baseline:changedBaseline,scenario:'Staffing option'},validateProject),/baseline is fixed/);
 const restored=restoreScenario(saved,'locked');assert.equal(restored.project.activeScenarioId,'locked');assert.equal(normalizeArchive(restored,validateProject).project.activeScenarioId,'locked');
 const source=returnToSource(saved);assert.equal(source.project.activeScenarioId,undefined);assert.equal(source.project.people[0].salary,p.people[0].salary);assert.equal(source.project.savedScenarios.length,1);source.project.ledger[0].amount+=1;assert.equal(validateProject(source.project).filter(x=>x.level==='error').length,0);
});
test('resaving a scenario preserves original return target and protects actual scope',async()=>{
 const {saveScenario,returnToSource}=await import('../src/lib/scenarios.js'),{validateProject}=await import('../src/lib/validate-project.js'),{normalizeArchive}=await import('../src/lib/archive.js');const p=E.demo();
 let a=saveScenario(p,p,'A','a','2026-11-17T00:00:00Z');a.people[0].salary+=100000;const b=saveScenario(a,p,'B','b','2026-11-17T01:00:00Z');
 assert.equal(returnToSource(b).project.people[0].salary,p.people[0].salary);assert.equal(b.savedScenarios[1].project.people[0].salary,a.people[0].salary);assert.equal(validateProject(b).filter(x=>x.level==='error').length,0);
 for(const mutate of [x=>x.postedFa={'2026-01':999999},x=>x.grant.end='2026-06']){const changed=structuredClone(b);mutate(changed);assert.ok(validateProject(changed).some(x=>x.level==='error'));assert.throws(()=>normalizeArchive({project:changed,baseline:p,scenario:'B'},validateProject));}
 const invalid=structuredClone(b);invalid.savedScenarios[1].sourceProject.ledger='invalid';assert.ok(validateProject(invalid).some(x=>x.level==='error'));
});
test('scenario financial assumptions cannot reprice historical actuals but future rates work',async()=>{
 const {saveScenario}=await import('../src/lib/scenarios.js'),{validateProject}=await import('../src/lib/validate-project.js'),E=(await import('../src/lib/engine.js')).default;
 const p=E.demo();p.ledger.push({id:'historical-equipment',month:'2026-03',cat:'Equipment',amount:1000,note:'Synthetic equipment'});const saved=saveScenario(p,p,'Future staffing','future','2026-11-17T00:00:00Z');
 for(const mutate of [x=>x.grant.indirect=30,x=>x.grant.base='TDC',x=>x.subawards[0].subj=1,x=>x.rateChanges=[{id:'r',kind:'indirect',month:'2026-02',value:25,source:'Synthetic'}]]){const changed=structuredClone(saved);mutate(changed);assert.ok(validateProject(changed).some(x=>x.level==='error'),JSON.stringify(changed.grant));}
 const future=structuredClone(saved);future.rateChanges=[{id:'future-rate',kind:'indirect',month:'2027-01',value:25,source:'Synthetic assumption'}];assert.equal(validateProject(future).filter(x=>x.level==='error').length,0);assert.equal(E.calculate(future).total.actual,E.calculate(p).total.actual);assert.notEqual(E.calculate(future).total.proj,E.calculate(p).total.proj);
});
