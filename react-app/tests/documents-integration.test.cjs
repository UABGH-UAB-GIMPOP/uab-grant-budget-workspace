const {test}=require('node:test'),assert=require('node:assert/strict');
test('document validation applies to archives and saved scenario snapshots without changing legacy budgets',async()=>{
 const E=(await import('../src/lib/engine.js')).default,{validateProject}=await import('../src/lib/validate-project.js'),{normalizeArchive}=await import('../src/lib/archive.js'),{saveScenario}=await import('../src/lib/scenarios.js');const p=E.demo(),before=JSON.stringify(p);
 assert.doesNotThrow(()=>normalizeArchive({project:p},validateProject));assert.equal(JSON.stringify(p),before);
 p.documents=[{id:'terms',title:'Terms',url:'https://example.org/terms',category:'Award terms',archived:false}];assert.equal(validateProject(p).filter(x=>x.level==='error').length,0);
 const scenario=saveScenario(p,p,'Compare','compare','2026-11-17T00:00:00Z');scenario.savedScenarios[0].project.documents[0].url='javascript:alert(1)';assert.throws(()=>normalizeArchive({project:scenario},validateProject),/Documents/);
 p.documents[0].url='https://user:secret@example.org';assert.throws(()=>normalizeArchive({project:p},validateProject),/Documents/);
});
