const {test}=require('node:test');const assert=require('node:assert/strict');
test('recurring dates clamp leap years and restore the original day after short months',async()=>{
 const {nextMilestoneDate}=await import('../src/lib/milestones.js');assert.equal(nextMilestoneDate('2028-01-31','Monthly'), '2028-02-29');assert.equal(nextMilestoneDate('2028-02-29','Monthly',31),'2028-03-31');assert.equal(nextMilestoneDate('2028-02-29','Annually'), '2029-02-28');assert.equal(nextMilestoneDate('2026-11-30','Quarterly'),'2027-02-28');assert.equal(nextMilestoneDate('2026-11-30','Once'),null);assert.throws(()=>nextMilestoneDate('2026-02-30','Monthly'));
});
test('completion preserves evidence and generates exactly one successor, including reopen and recomplete',async()=>{
 const {completeMilestone,validateMilestones}=await import('../src/lib/milestones.js');const items=[{id:'m1',title:'Monthly statement',owner:'Study manager',due:'2028-01-31',done:false,cadence:'Monthly',evidence:'https://example.org/statement'}];
 const a=completeMilestone(items,'m1',true,'m2','2028-02-02T12:00:00Z');assert.equal(items[0].done,false);assert.equal(a[0].evidence,items[0].evidence);assert.equal(a[0].completedAt,'2028-02-02T12:00:00Z');assert.equal(a[1].due,'2028-02-29');assert.equal(a[1].evidence,'');assert.equal(a[1].previousId,'m1');assert.equal(a[1].seriesId,'m1');assert.deepEqual(validateMilestones(a),[]);
 const b=completeMilestone(completeMilestone(a,'m1',false,'unused'),'m1',true,'unused');assert.equal(b.length,2);const c=completeMilestone(b,'m2',true,'m3');assert.equal(c[2].due,'2028-03-31');assert.equal(c[2].seriesId,'m1');assert.equal(c[2].previousId,'m2');
});
test('legacy one-time milestones remain valid and unsafe evidence or malformed recurrence rejects',async()=>{
 const {validateMilestones,completeMilestone}=await import('../src/lib/milestones.js');const m={id:'a',title:'Report',owner:'',due:'2026-11-30',done:false};assert.deepEqual(validateMilestones([m]),[]);assert.equal(completeMilestone([m],'a',true,'b').length,1);
 for(const change of [{evidence:'javascript:alert(1)'},{evidence:'https://user:password@example.org'},{cadence:'Weekly'},{anchorDay:0},{due:'2026-02-30'},{evidence:42}])assert.ok(validateMilestones([{...m,...change}]).length,JSON.stringify(change));
 assert.ok(validateMilestones([{...m,previousId:'a'}]).length);assert.ok(validateMilestones([{...m,previousId:'z'},{...m,id:'b',previousId:'z'}]).length);
});

const E=require('../engine.cjs');
test('milestone dates and identities validate before saving or importing',async()=>{
 const {validateProject}=await import('../src/lib/validate-project.js');const p=E.demo();const m={id:'m1',title:'Progress report',owner:'Study manager',due:'2026-12-01',done:false};p.milestones=[m];assert.equal(validateProject(p).filter(x=>x.level==='error').length,0);
 p.milestones=[{...m,due:'2026-02-30'}];assert.ok(validateProject(p).some(x=>x.level==='error'));p.milestones=[m,{...m}];assert.ok(validateProject(p).some(x=>x.level==='error'));
});

test('import rejects recurrence cycles, missing predecessors and mismatched series',async()=>{
 const {validateProject}=await import('../src/lib/validate-project.js'),{normalizeArchive}=await import('../src/lib/archive.js');const base={title:'Monthly report',owner:'Team',done:false,cadence:'Monthly'},p=E.demo();
 for(const records of [[{...base,id:'a',due:'2026-01-01',previousId:'b',seriesId:'a'},{...base,id:'b',due:'2026-02-01',previousId:'a',seriesId:'a'}],[{...base,id:'a',due:'2026-01-01',previousId:'missing',seriesId:'s'}],[{...base,id:'a',due:'2026-01-01'},{...base,id:'b',due:'2026-02-01',previousId:'a',seriesId:'wrong'}]]){p.milestones=records;assert.throws(()=>normalizeArchive({project:p},validateProject),/Recurring milestones/);}
});
