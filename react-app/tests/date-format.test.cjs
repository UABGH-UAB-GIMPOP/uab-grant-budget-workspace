const {test}=require('node:test'),assert=require('node:assert/strict');
test('exact calendar dates render as padded MM/DD/YYYY without locale drift',async()=>{
 const {formatDateUS}=await import('../src/lib/date-format.js');
 assert.equal(formatDateUS('2024-07-03'),'07/03/2024');
 assert.equal(formatDateUS('2026-11-18'),'11/18/2026');
 assert.equal(formatDateUS('2026-11-18T23:30:00.000Z'),'11/18/2026');
});
test('date display rejects impossible dates and handles missing values explicitly',async()=>{
 const {formatDateUS}=await import('../src/lib/date-format.js');
 assert.equal(formatDateUS('2026-02-30'),'Date unavailable');
 assert.equal(formatDateUS('not a date'),'Date unavailable');
 assert.equal(formatDateUS(undefined),'—');
 assert.equal(formatDateUS(''),'—');
});
