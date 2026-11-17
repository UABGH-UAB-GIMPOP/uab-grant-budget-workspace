const {test}=require('node:test'),assert=require('node:assert/strict');
test('money rounding is symmetric at decimal ties including scientific notation',async()=>{
 const {cents}=await import('../src/lib/money.js');for(const [value,want] of [[1.005,101],[1.015,102],[2.675,268],[0.005,1],[0.0049,0],[1e-7,0],[1.234e3,123400],[999999.995,100000000]]){assert.equal(cents(value),want);assert.equal(cents(-value),-want||0)}assert.throws(()=>cents(Infinity));assert.throws(()=>cents(1e20));
});
test('matching positive and negative cent-rounded amounts cancel exactly',async()=>{
 const {cents}=await import('../src/lib/money.js');for(let i=0;i<1000;i++){const value=i/100+0.005;assert.equal(cents(value)+cents(-value),0)}
});
