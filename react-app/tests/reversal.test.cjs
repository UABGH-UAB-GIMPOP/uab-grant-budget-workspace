const {test}=require('node:test');const assert=require('node:assert/strict');const E=require('../engine.cjs');
test('reversal retains original and offsets cost with identity and reason',async()=>{
 const {reverseEntry}=await import('../src/lib/reversal.js');const p=E.demo(),original=p.ledger[0],before=JSON.stringify(original);const row=reverseEntry(p,original.id,'Incorrect allocation',original.month,'reversal-1');assert.equal(row.amount,-original.amount);assert.equal(row.reversalOf,original.id);assert.equal(row.personId,original.personId);assert.equal(JSON.stringify(original),before);p.ledger.push(row);assert.throws(()=>reverseEntry(p,original.id,'again',original.month,'reversal-2'));assert.equal(row.note,'Incorrect allocation');
});
test('imports reject orphaned and duplicate reversals or changed offsets',async()=>{
 const {reverseEntry,validateReversals}=await import('../src/lib/reversal.js');const p=E.demo(),original=p.ledger[0];const row=reverseEntry(p,original.id,'Correction',original.month,'r1');p.ledger.push(row);assert.equal(validateReversals(p).length,0);row.amount+=1;assert.ok(validateReversals(p).length);row.amount-=1;p.ledger.push({...row,id:'r2'});assert.ok(validateReversals(p).length);p.ledger=p.ledger.filter(x=>x.id!==original.id);assert.ok(validateReversals(p).length);
});
