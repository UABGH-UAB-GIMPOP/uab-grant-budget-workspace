const {test}=require('node:test'),assert=require('node:assert/strict');
test('linked supply commitment replaces modeled amount and partial settlement preserves forecast',async()=>{
 const E=(await import('../src/lib/engine.js')).default;const p=E.demo();p.grant.indirect=0;p.grant.asOf='2026-10';p.supplies=[{id:'s',name:'Order',qty:1,unit:5000,month:'2026-11'}];p.commitments=[{id:'po',name:'Order',source:'PO-1',category:'Supplies',amount:5000,cancelled:0,month:'2026-11',link:{type:'supply',id:'s'}}];
 const before=E.calculate(p);assert.equal(before.proj.Supplies['2026-11'],5000);
 p.ledger.push({id:999,month:'2026-11',cat:'Supplies',amount:2000,commitmentId:'po',reference:'INV-1'});p.grant.asOf='2026-11';const after=E.calculate(p);assert.equal(after.commitments.rows[0].open,3000);assert.equal(after.proj.Supplies['2026-12'],3000);assert.equal(after.cats.find(r=>r.c==='Supplies').proj,before.cats.find(r=>r.c==='Supplies').proj);
 p.ledger.push({id:1000,month:'2026-11',cat:'Supplies',amount:-500,commitmentId:'po',reference:'CREDIT'});assert.equal(E.calculate(p).commitments.rows[0].open,3500);
 p.commitments[0].cancelled=1000;assert.equal(E.calculate(p).commitments.rows[0].open,2500);
});
test('commitment validation rejects duplicate modeled links and wrong-category settlements',async()=>{
 const E=(await import('../src/lib/engine.js')).default,p=E.demo();p.commitments=[{id:'po',name:'Order',source:'PO',category:'Supplies',amount:5000,cancelled:0,month:'2026-12',link:{type:'supply',id:'s1'}}];assert.equal(E.validate(p).filter(x=>x.level==='error').length,0);
 p.commitments.push({...p.commitments[0],id:'po2'});assert.ok(E.validate(p).some(x=>x.message.includes('one commitment')));p.commitments.pop();p.ledger[0].commitmentId='po';assert.ok(E.validate(p).some(x=>x.message.includes('same category')));
});
test('orphan settlement links fail import validation even without a commitment list',async()=>{
 const {validateProject}=await import('../src/lib/validate-project.js'),E=(await import('../src/lib/engine.js')).default,p=E.demo();p.ledger[0].commitmentId='missing';assert.ok(validateProject(p).some(x=>x.level==='error'&&x.message.includes('commitment')));
});
test('settlement conservation holds across cent amounts, full payment and overpayment',async()=>{
 const E=(await import('../src/lib/engine.js')).default;
 for(let i=1;i<=75;i++){
  const p=E.demo();p.grant.indirect=0;p.grant.start='2026-01';p.grant.end='2026-03';p.grant.asOf='2026-01';p.ledger=[];p.people=[];p.subawards=[];p.subPays=[];p.costs=[];p.supplies=[];p.assume={Travel:0,Other:0};
  const total=i*73+0.17,paid=Math.round(total*0.37*100)/100;p.commitments=[{id:'x',name:'Order',source:'PO',category:'Equipment',amount:total,cancelled:0,month:'2026-02'}];
  const before=E.calculate(p).total.proj;p.ledger=[{id:'pay',cat:'Equipment',month:'2026-02',amount:paid,commitmentId:'x'}];p.grant.asOf='2026-02';assert.equal(E.calculate(p).total.proj,before);
  p.ledger[0].amount=total;assert.equal(E.calculate(p).commitments.rows[0].open,0);assert.equal(E.calculate(p).total.proj,total);
  p.ledger[0].amount=total+1;assert.equal(E.calculate(p).commitments.rows[0].overpaid,1);assert.equal(E.calculate(p).total.proj,E.usd(E.cents(total)+100));
 }
});
test('idless model links are rejected instead of covering multiple supplies',async()=>{
 const E=(await import('../src/lib/engine.js')).default,p=E.demo();p.supplies=[{name:'A',qty:1,unit:100,month:'2026-12'},{name:'B',qty:1,unit:200,month:'2026-12'}];p.commitments=[{id:'x',name:'A',source:'PO',category:'Supplies',amount:100,cancelled:0,month:'2026-12',link:{type:'supply'}}];assert.ok(E.validate(p).some(x=>x.level==='error'));
});
test('project-end unpaid obligations mark forecasts incomplete for commitments and subawards',async()=>{
 const E=(await import('../src/lib/engine.js')).default,p=E.demo();p.grant.asOf=p.grant.end;p.subawards=[];p.subPays=[];p.commitments=[{id:'x',name:'Open',source:'PO',category:'Supplies',amount:100,cancelled:0,month:p.grant.end}];assert.equal(E.calculate(p).forecastIncomplete,true);p.commitments=[];p.subawards=[{id:'a',name:'Partner',total:100,subj:100,start:p.grant.start,end:p.grant.end}];assert.equal(E.calculate(p).forecastIncomplete,true);
});
test('partial allocations settle only assigned amounts and reverse exactly',async()=>{
 const E=(await import('../src/lib/engine.js')).default,{reverseEntry,validateReversals}=await import('../src/lib/reversal.js'),p=E.demo();p.commitments=[{id:'x',name:'Equipment',source:'PO',category:'Equipment',amount:1000,cancelled:0,month:'2026-12'}];p.ledger=[{id:1,month:'2026-10',cat:'Equipment',amount:500,commitmentId:'x',commitmentAmount:200,reference:'INV'}];p.grant.asOf='2026-10';
 assert.equal(E.calculate(p).commitments.rows[0].paid,200);assert.equal(E.calculate(p).commitments.rows[0].open,800);
 const reverse=reverseEntry(p,1,'Credit','2026-10',2);assert.equal(reverse.amount,-500);assert.equal(reverse.commitmentAmount,-200);p.ledger.push(reverse);assert.equal(validateReversals(p).length,0);assert.equal(E.calculate(p).commitments.rows[0].open,1000);
 p.ledger[1].commitmentAmount=-201;assert.ok(validateReversals(p).length);
});
test('partial allocations reject over-allocation, wrong sign and orphan amounts',async()=>{
 const {validateCommitments}=await import('../src/lib/commitments.js'),E=(await import('../src/lib/engine.js')).default,p=E.demo();p.commitments=[{id:'x',name:'Equipment',source:'PO',category:'Equipment',amount:1000,cancelled:0,month:'2026-12'}];p.ledger=[{id:1,month:'2026-10',cat:'Equipment',amount:500,commitmentId:'x',commitmentAmount:200}];assert.equal(validateCommitments(p).length,0);
 for(const bad of [501,-1,NaN,Infinity]){p.ledger[0].commitmentAmount=bad;assert.ok(validateCommitments(p).length)}p.ledger[0].commitmentAmount=0;assert.equal(validateCommitments(p).length,0);delete p.ledger[0].commitmentId;assert.ok(validateCommitments(p).length);
});
