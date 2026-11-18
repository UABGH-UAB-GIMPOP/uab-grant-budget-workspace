const {test}=require('node:test'),assert=require('node:assert/strict');
test('assistant response UI contract binds deterministic facts to the exact saved snapshot',async()=>{
 const {validateAssistantResponse}=await import('../src/lib/assistant-client.js'),scope={projectId:'portfolio-alpha',revision:'a'.repeat(64),engine:'engine-e465e1b'},response={projectId:scope.projectId,revision:scope.revision,kind:'result',tool:'budget_summary',result:{source:{...scope,snapshotHash:scope.revision,knownThrough:'2026-10'},totals:{plan:100,actual:20,proj:60,variance:40},categories:[{c:'Travel',plan:100,actual:20,proj:60,variance:40}]}};
 assert.equal(validateAssistantResponse(response,scope),response);assert.throws(()=>validateAssistantResponse({...response,result:{...response.result,source:{...response.result.source,snapshotHash:'b'.repeat(64)}}},scope),/invalid or stale/);
 assert.throws(()=>validateAssistantResponse({...response,revision:'b'.repeat(64)},scope),/invalid or stale/);
});
