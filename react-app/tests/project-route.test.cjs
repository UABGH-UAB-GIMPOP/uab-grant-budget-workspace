const {test}=require('node:test'),assert=require('node:assert/strict');
test('project deep links resolve only known active projects without leaking names into URL',async()=>{
 const R=await import('../src/lib/project-route.js'),p={projects:[{id:'p_123',archived:false},{id:'p_456',archived:true}]};
 assert.equal(R.projectHash('p_123'),'#/grants/p_123');assert.deepEqual(R.resolveProjectHash('#/grants/p_123',p),{id:'p_123',error:null});
 for(const h of ['#/grants/p_456','#/grants/not-present','#/grants/../../secret','#/grants/%20']){assert.equal(R.resolveProjectHash(h,p).id,null);assert.ok(R.resolveProjectHash(h,p).error)}
 assert.throws(()=>R.projectHash('Project name / unsafe'));assert.equal(R.resolveProjectHash('',p).id,null);
});
