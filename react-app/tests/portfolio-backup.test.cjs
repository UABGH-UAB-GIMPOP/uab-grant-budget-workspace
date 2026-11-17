const {test}=require('node:test'),assert=require('node:assert/strict');
test('backup round trip retains archived projects, scenarios, IDs and metadata',async()=>{
 const P=await import('../src/lib/portfolio.js'),B=await import('../src/lib/portfolio-backup.js'),E=(await import('../src/lib/engine.js')).default,S=await import('../src/lib/scenarios.js');const project=E.demo(),baseline=structuredClone(project),scenario=S.saveScenario(project,baseline,'Scenario','s1','2026-11-17T00:00:00Z');let p=P.addPortfolioProject(P.createPortfolio(),{project:scenario,baseline},{id:'one',owner:'Synthetic owner'});p=P.addPortfolioProject(p,{project:baseline},{id:'two'});p=P.archiveProject(p,'two');const preview=B.previewPortfolioRestore(B.portfolioBackup(p));assert.deepEqual(preview.portfolio,p);assert.equal(preview.projectCount,2);assert.equal(preview.archivedCount,1);assert.equal(preview.awardCount,1);
});
test('backup rejects malformed, unrelated, duplicate and oversized inputs',async()=>{
 const P=await import('../src/lib/portfolio.js'),B=await import('../src/lib/portfolio-backup.js'),E=(await import('../src/lib/engine.js')).default;
 for(const text of ['{','{"schema":1}','x'.repeat(B.BACKUP_LIMIT+1)])assert.throws(()=>B.previewPortfolioRestore(text));
 const p=P.addPortfolioProject(P.createPortfolio(),{project:E.demo()},{id:'one'}),value=JSON.parse(B.portfolioBackup(p));value.portfolio.projects.push(value.portfolio.projects[0]);assert.throws(()=>B.previewPortfolioRestore(JSON.stringify(value)),/unique/);
});
test('UTF-8 byte limit is enforced on export and import',async()=>{
 const P=await import('../src/lib/portfolio.js'),B=await import('../src/lib/portfolio-backup.js'),E=(await import('../src/lib/engine.js')).default;
 const project=E.demo();project.grant.source='界'.repeat(8500000);const portfolio=P.addPortfolioProject(P.createPortfolio(),{project},{id:'one'});assert.throws(()=>B.portfolioBackup(portfolio),/50 MB/);const text=JSON.stringify({format:'uab-grant-portfolio',version:1,createdAt:'2026-11-17',portfolio});assert.ok(text.length<B.BACKUP_LIMIT);assert.throws(()=>B.previewPortfolioRestore(text),/50 MB/);
});
