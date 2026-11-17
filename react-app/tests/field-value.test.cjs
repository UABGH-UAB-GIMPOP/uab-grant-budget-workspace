const {test}=require('node:test'),assert=require('node:assert/strict');
test('blank required numbers cannot become zero while optional blank remains null',async()=>{
 const {numericFieldValue}=await import('../src/lib/field-value.js');assert.throws(()=>numericFieldValue(''));assert.throws(()=>numericFieldValue('   '));assert.equal(numericFieldValue('',true),null);assert.equal(numericFieldValue('0'),0);assert.equal(numericFieldValue('-1.25'),-1.25);assert.throws(()=>numericFieldValue('Infinity'));assert.throws(()=>numericFieldValue('abc'));
});
