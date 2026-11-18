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
test('opening an older scenario preserves the latest source actuals and baseline across reload and switches',async()=>{
 const {saveScenario,restoreScenario,returnToSource}=await import('../src/lib/scenarios.js'),{normalizeArchive}=await import('../src/lib/archive.js'),{validateProject}=await import('../src/lib/validate-project.js'),{reportingProject}=await import('../src/lib/portfolio.js');
 const p=E.demo();let source=returnToSource(saveScenario(p,p,'A','a','2026-11-17T00:00:00Z'));
 source.project.ledger[0].amount+=123;source.baseline.people[0].salary+=456;
 const expected=structuredClone(source);let working=saveScenario(source.project,source.baseline,'B','b','2026-11-17T01:00:00Z');
 let opened=restoreScenario(working,'a',source.baseline);assert.equal(opened.project.ledger[0].amount,p.ledger[0].amount);
 opened=normalizeArchive(JSON.parse(JSON.stringify(opened)),validateProject);
 assert.equal(reportingProject({archive:opened}).ledger[0].amount,expected.project.ledger[0].amount);
 const resaved=saveScenario(opened.project,opened.baseline,'C','c','2026-11-17T02:00:00Z');
 const returned=returnToSource(restoreScenario(resaved,'b',opened.baseline).project);
 assert.equal(returned.project.ledger[0].amount,expected.project.ledger[0].amount);assert.deepEqual(returned.baseline,expected.baseline);assert.equal(returned.project.savedScenarios.length,3);assert.equal(returned.project.scenarioReturn,undefined);
 for(const entry of returned.project.savedScenarios)for(const key of ['project','baseline','sourceProject','sourceBaseline'])assert.equal(entry[key].scenarioReturn,undefined);
 const direct=restoreScenario(expected.project,'a',expected.baseline);assert.deepEqual(returnToSource(direct.project).baseline,expected.baseline);assert.equal(returnToSource(direct.project).project.ledger[0].amount,expected.project.ledger[0].amount);
});
test('scenario return contexts reject malformed or nested budgets and support legacy fallback',async()=>{
 const {saveScenario,returnToSource}=await import('../src/lib/scenarios.js'),{validateProject}=await import('../src/lib/validate-project.js');const p=E.demo(),saved=saveScenario(p,p,'A','a','2026-11-17T00:00:00Z');
 for(const mutate of [x=>x.scenarioReturn=null,x=>x.scenarioReturn.project.ledger='invalid',x=>x.scenarioReturn.baseline.scenarioReturn={},x=>x.scenarioReturn.project.savedScenarios=[],x=>delete x.activeScenarioId]){const changed=structuredClone(saved);mutate(changed);assert.ok(validateProject(changed).some(x=>x.level==='error'));}
 const legacy=structuredClone(saved);delete legacy.scenarioReturn;assert.equal(validateProject(legacy).filter(x=>x.level==='error').length,0);assert.equal(returnToSource(legacy).project.ledger[0].amount,p.ledger[0].amount);
});
