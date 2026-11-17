const {test}=require('node:test'),assert=require('node:assert/strict');
test('effective fringe and cap changes preserve prior months and posted actuals',async()=>{
 const E=(await import('../src/lib/engine.js')).default,p=E.demo(),person=p.people[0];person.salary=360000;person.effort=100;person.fringe=30;person.raiseDate='';p.grant.salaryCap=240000;
 p.rateChanges=[{id:'f',kind:'fringe',personId:person.id,month:'2027-01',value:40,source:'Synthetic fringe profile'},{id:'c',kind:'salaryCap',month:'2027-01',value:252000,source:'Synthetic cap profile'}];
 assert.equal(E.person(p,person,'2026-12').cost,26000);assert.equal(E.person(p,person,'2027-01').cost,29400);
 const before=E.calculate(p).total.actual;p.rateChanges[0].month='2026-01';assert.equal(E.calculate(p).total.actual,before);
 p.rateChanges[1].value=0;assert.equal(E.person(p,person,'2027-01').charged,30000);
});
test('rate schedules reject ambiguous duplicates and missing sources or people',async()=>{
 const E=(await import('../src/lib/engine.js')).default,p=E.demo();const r={id:'c',kind:'salaryCap',month:'2027-01',value:250000,source:'Synthetic'};p.rateChanges=[r,{...r,id:'c2'}];assert.ok(E.validate(p).some(x=>x.level==='error'));
 p.rateChanges=[{...r,kind:'fringe',value:40,personId:'missing'}];assert.ok(E.validate(p).some(x=>x.level==='error'));p.rateChanges=[{...r,source:''}];assert.ok(E.validate(p).some(x=>x.level==='error'));
});
test('F&A resets rounding at rate intervals without repricing earlier months',async()=>{
 const E=(await import('../src/lib/engine.js')).default,p=E.demo();p.grant.start='2026-01';p.grant.end='2026-03';p.grant.asOf='2026-01';p.grant.indirect=10;p.people=[];p.subawards=[];p.subPays=[];p.supplies=[];p.costs=[];p.ledger=[{id:1,cat:'Other',month:'2026-01',amount:100}];p.assume={Other:100,Travel:0};p.rateChanges=[{id:'fa',kind:'indirect',month:'2026-02',value:20,source:'Synthetic test profile'}];let c=E.calculate(p);assert.equal(c.fa.proj['2026-01'],10);assert.equal(c.fa.proj['2026-02'],20);assert.equal(c.fa.proj['2026-03'],20);assert.equal(c.idc.proj,50);
 p.postedFa={'2026-01':12};c=E.calculate(p);assert.equal(c.fa.actual['2026-01'],12);assert.equal(c.fa.proj['2026-01'],12);assert.equal(c.idc.proj,52);
});
