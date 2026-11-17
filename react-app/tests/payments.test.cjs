const {test}=require('node:test');const assert=require('node:assert/strict');
test('payment ledger maintains chronological per-award balances including credits',async()=>{
 const {paymentLedger}=await import('../src/lib/payments.js');const p={subawards:[{id:'alpha',name:'Alpha'},{id:2,name:'Beta'}],subPays:[{sub:'alpha',month:'2026-03',amount:-20},{sub:'alpha',month:'2026-01',amount:100},{sub:'2',month:'2026-02',amount:50},{sub:'alpha',month:'2026-02',amount:30}]};
 const before=JSON.stringify(p);const r=paymentLedger(p,'alpha');assert.deepEqual(r.map(x=>x.cumulative),[100,130,110]);assert.deepEqual(r.map(x=>x.index),[1,3,0]);assert.equal(paymentLedger(p,2)[0].name,'Beta');assert.equal(JSON.stringify(p),before);
});
