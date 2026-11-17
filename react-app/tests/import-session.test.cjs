const {test}=require('node:test'),assert=require('node:assert/strict');
const api=()=>import('../src/lib/import-session.js');
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve}};
test('canceled and superseded async imports cannot publish late results',async()=>{
 const {createImportSession}=await api(),archive={project:{id:'A'},baseline:{id:'B'},scenario:'Working',revision:null},session=createImportSession(()=>archive);
 let result=null,error=null,busy=true;const first=deferred(),token=session.begin();
 const pending=(async()=>{try{const value=await first.promise;session.check(token);result=value}catch(e){if(session.isActive(token))error=e.message}finally{if(session.isActive(token))busy=false}})();
 session.cancel();const replacement=session.begin();first.resolve('obsolete');await pending;
 assert.equal(result,null);assert.equal(error,null);assert.equal(busy,true);assert.equal(session.isActive(replacement),true);
 session.check(replacement);session.cancel();assert.throws(()=>session.check(replacement),/canceled/);
});
test('every archive dimension invalidates an in-flight import',async()=>{
 const {createImportSession}=await api();for(const field of ['project','baseline','scenario','revision']){
  let archive={project:{id:'A'},baseline:{id:'B'},scenario:'Working',revision:null};const session=createImportSession(()=>archive),token=session.begin();
  archive={...archive,[field]:field==='project'||field==='baseline'?{id:'Changed'}:'Changed'};
  assert.throws(()=>session.check(token),/changed/);assert.equal(session.isActive(token),true);
 }
});
test('late apply never reaches persistence after archive changes',async()=>{
 const {createImportSession}=await api();let archive={project:{amount:1},baseline:{amount:1},scenario:'A',revision:'original'},writes=0;
 const session=createImportSession(()=>archive),token=session.begin(),digest=deferred();
 const apply=(async()=>{await digest.promise;session.check(token);writes++;archive.project.amount=2})();
 archive={...archive,baseline:{amount:3}};digest.resolve();await assert.rejects(apply,/changed/);assert.equal(writes,0);assert.equal(archive.project.amount,1);assert.equal(archive.baseline.amount,3);
});
