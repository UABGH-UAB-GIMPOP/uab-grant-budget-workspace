const {test}=require('node:test'),assert=require('node:assert/strict');
const setup=async()=>{const P=await import('../src/lib/portfolio.js'),E=(await import('../src/lib/engine.js')).default;const project=E.demo();return {P,archive:{project,baseline:structuredClone(project),scenario:'Working budget'}}};
test('portfolio creates stable independent projects, switches, archives and restores without deleting data',async()=>{const {P,archive}=await setup();let p=P.addPortfolioProject(P.createPortfolio(),archive,{id:'one'});p=P.addPortfolioProject(p,archive,{id:'two'});assert.equal(p.activeId,'two');p=P.switchProject(p,'one');assert.equal(p.activeId,'one');p=P.archiveProject(p,'one');assert.equal(p.activeId,'two');assert.equal(p.projects.length,2);assert.throws(()=>P.switchProject(p,'one'));p=P.archiveProject(p,'one',false);assert.equal(P.switchProject(p,'one').activeId,'one');p.projects[0].archive.project.grant.title='Changed';assert.notEqual(p.projects[1].archive.project.grant.title,'Changed');assert.notEqual(archive.project.grant.title,'Changed');});
test('duplicate IDs, mismatched identities and active scenarios cannot double-count awards',async()=>{const {P,archive}=await setup();const p=P.addPortfolioProject(P.createPortfolio(),archive,{id:'one'});assert.throws(()=>P.addPortfolioProject(p,archive,{id:'one'}),/already/);assert.throws(()=>P.normalizePortfolio({...p,projects:[...p.projects,p.projects[0]]}),/unique/);const wrong=structuredClone(archive);wrong.project.id='different';assert.throws(()=>P.addPortfolioProject(p,wrong,{id:'two'}),/identity/);const scenario=structuredClone(p);scenario.projects[0].archive.project.activeScenarioId='scenario';assert.throws(()=>P.normalizePortfolio(scenario));});
test('portfolio totals separate proposals, define year scope and retain freshness differences',async()=>{const {P,archive}=await setup();let p=P.addPortfolioProject(P.createPortfolio(),archive,{id:'one',funderType:'Federal'});const second=structuredClone(archive);second.project.grant.asOf='2026-08';p=P.addPortfolioProject(p,second,{id:'two',funderType:'Foundation'});const proposal=structuredClone(archive);proposal.project.grant.mode='proposal';p=P.addPortfolioProject(p,proposal,{id:'proposal'});const s=P.portfolioSummary(p,{year:2026});assert.equal(s.awardCount,2);assert.equal(s.proposalCount,1);assert.equal(s.awardedBudget,2*s.rows[0].budget);assert.equal(s.proposedBudget,s.rows[2].budget);assert.equal(s.mixedCutoffs,true);assert.match(s.yearBasis,/full project/);assert.equal(s.funderMix.length,2);assert.equal(P.portfolioSummary(p,{year:2000}).rows.length,0);assert.throws(()=>P.portfolioSummary(p,{year:'2026'}));p=P.archiveProject(p,'one');assert.equal(P.portfolioSummary(p).awardCount,1);});
test('portfolio save is one guarded write; corrupt or failed storage never falls back to sample',async()=>{const {P,archive}=await setup();let raw=null,writes=0;const storage={getItem:()=>raw,setItem:(k,v)=>{raw=v;writes++}};const p=P.addPortfolioProject(P.createPortfolio(),archive,{id:'one'});const saved=P.savePortfolio(storage,'portfolio',p,null);assert.equal(writes,1);assert.equal(P.loadPortfolio(storage,'portfolio').portfolio.projects.length,1);assert.throws(()=>P.savePortfolio(storage,'portfolio',p,null),/another tab/);assert.equal(writes,1);raw='broken';const result=P.loadPortfolio(storage,'portfolio');assert.equal(result.recovery,true);assert.equal(result.portfolio,null);assert.equal(result.raw,'broken');assert.throws(()=>P.savePortfolio({getItem:()=>saved.raw,setItem(){throw Error('Quota')}},'portfolio',p,saved.raw),/Quota/);});

test('portfolio retains active scenarios but aggregates source budget without mutating baseline',async()=>{
 const {P,archive}=await setup(),S=await import('../src/lib/scenarios.js');
 const sourceForecast=P.portfolioSummary(P.addPortfolioProject(P.createPortfolio(),archive,{id:'one'})).forecast;
 const next=structuredClone(archive);next.project=S.saveScenario(next.project,next.baseline,'What if','s1','2026-11-17T12:00:00Z');next.project.assume.Travel=999;
 const p=P.addPortfolioProject(P.createPortfolio(),next,{id:'one'});
 assert.deepEqual(p.projects[0].archive.baseline,next.baseline);
 assert.equal(p.projects[0].archive.project.activeScenarioId,'s1');
 assert.equal(P.portfolioSummary(p).forecast,sourceForecast);
 assert.deepEqual(P.normalizePortfolio(p),p);
});

test('project storage keeps projects isolated, preserves scenario archives and detects cross-tab writes',async()=>{
 const {P,archive}=await setup(),{projectStorage}=await import('../src/lib/portfolio-storage.js'),A=await import('../src/lib/archive.js'),{validateProject}=await import('../src/lib/validate-project.js');
 const data=new Map(),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
 let p=P.addPortfolioProject(P.createPortfolio(),archive,{id:'one'});p=P.addPortfolioProject(p,archive,{id:'two'});P.savePortfolio(storage,'portfolio',p,null);
 const one=projectStorage(storage,'portfolio','budget','one'),two=projectStorage(storage,'portfolio','budget','two');
 const before=one.getItem('budget'),change=structuredClone(archive);change.project.grant.title='One revised';
 const saved=A.persistArchive(one,'budget',change,validateProject,before);
 assert.equal(one.getItem('budget'),saved.raw);
 assert.equal(A.decodeStoredArchive(two.getItem('budget')).project.grant.title,archive.project.grant.title);
 assert.throws(()=>A.persistArchive(two,'budget',archive,validateProject,two.getItem('budget')),/another tab/);
 one.setItem('display','false');assert.equal(storage.getItem('display'),'false');
 assert.throws(()=>one.removeItem('budget'),/Archive/);
});
test('new projects contain no sample costs, actuals or assumed institutional rates',async()=>{
 const {newProject}=await import('../src/lib/new-project.js'),E=(await import('../src/lib/engine.js')).default;
 const a=newProject({title:'New proposal',start:'2027-01',end:'2027-12'});assert.equal(a.project.grant.mode,'proposal');assert.equal(a.project.people.length,0);assert.equal(a.project.subawards.length,0);assert.equal(a.project.grant.indirect,0);assert.equal(E.calculate(a.project).total.plan,0);assert.equal(E.calculate(a.project).total.proj,0);
 assert.throws(()=>newProject({title:'Bad dates',start:'2028-01',end:'2027-12'}),/period/);
});
test('portfolio filters the same source period and title it displays for an active scenario',async()=>{
 const {P,archive}=await setup(),S=await import('../src/lib/scenarios.js');archive.project=S.saveScenario(archive.project,archive.baseline,'Extended','s1','2026-11-17T12:00:00Z');archive.project.grant.end='2029-12';archive.project.grant.title='Scenario different title';
 const p=P.addPortfolioProject(P.createPortfolio(),archive,{id:'one'});
 assert.equal(P.portfolioSummary(p,{year:2029}).rows.length,0);
 assert.equal(P.portfolioSummary(p,{search:'Community Health Study'}).rows.length,1);
 assert.equal(P.portfolioSummary(p,{search:'Scenario different title'}).rows.length,0);
});
test('metadata updates preserve budget, validate sponsor type and cannot target archived grants',async()=>{
 const {P,archive}=await setup();const original=P.addPortfolioProject(P.createPortfolio(),archive,{id:'one'}),before=JSON.stringify(original.projects[0].archive);
 const next=P.updatePortfolioMetadata(original,'one',{owner:' Team lead ',sponsor:'Foundation',funderType:'Foundation'});
 assert.equal(next.projects[0].owner,'Team lead');assert.equal(original.projects[0].owner,'');assert.equal(JSON.stringify(next.projects[0].archive),before);
 assert.throws(()=>P.updatePortfolioMetadata(original,'one',{funderType:'Invented'}));assert.throws(()=>P.updatePortfolioMetadata(original,'one',{id:'two'}));assert.throws(()=>P.updatePortfolioMetadata(P.archiveProject(original,'one'),'one',{owner:'New'}),/archived/);
});
