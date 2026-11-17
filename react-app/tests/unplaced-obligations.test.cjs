const {test}=require('node:test'),assert=require('node:assert/strict');
test('ended projects expose unpaid commitments and subawards without inventing F&A or double counting',async()=>{
 const E=(await import('../src/lib/engine.js')).default,{unplacedObligations}=await import('../src/lib/unplaced-obligations.js');const p=E.demo();p.grant.asOf=p.grant.end;p.commitments=[{id:'unpaid',name:'Supplies order',category:'Supplies',amount:1000.01,cancelled:100,month:'2028-12',source:'Synthetic order'}];p.ledger.push({id:'partial',cat:'Supplies',month:'2028-12',amount:500,commitmentId:'unpaid',commitmentAmount:200.01});
 const c=E.calculate(p),report=unplacedObligations(p,c);assert.equal(c.forecastIncomplete,true);assert.equal(report.rows.find(r=>r.id==='unpaid').amount,700);assert.equal(report.rows.find(r=>r.category==='Subaward').amount,150000);assert.equal(report.total,150700);assert.equal(c.total.actual,c.total.proj);
 p.grant.asOf='2026-10';assert.equal(unplacedObligations(p,E.calculate(p)).rows.length,0);
});
