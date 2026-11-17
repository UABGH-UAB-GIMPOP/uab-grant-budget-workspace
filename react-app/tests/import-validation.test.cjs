const {test}=require('node:test');const assert=require('node:assert/strict');
test('CSV requires values, accepts explicit zero and credits',async()=>{
 const {validateCsvRecord}=await import('../src/lib/import-validation.js');const record={month:'2026-01',category:'Travel',amount:'0',reference:'REF-1'};
 assert.doesNotThrow(()=>validateCsvRecord(record,2));assert.doesNotThrow(()=>validateCsvRecord({...record,amount:'-12.50'},2));
 for(const key of Object.keys(record))assert.throws(()=>validateCsvRecord({...record,[key]:' '},2),/required/);
 assert.throws(()=>validateCsvRecord({...record,amount:'abc'},2),/numeric/);
});
test('subaward export eligibility distinguishes TDC from MTDC',async()=>{
 const {subawardEligibility}=await import('../src/lib/import-validation.js');const a={total:100000,subj:25000};
 assert.deepEqual(subawardEligibility({base:'TDC',indirect:49},a),{subject:100000,excluded:0,idc:49000});
 assert.deepEqual(subawardEligibility({base:'MTDC',indirect:49},a),{subject:25000,excluded:75000,idc:12250});
});
