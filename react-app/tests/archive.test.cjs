const {test}=require('node:test');const assert=require('node:assert/strict');
const E=require('../engine.cjs');const vm=require('node:vm'),fs=require('node:fs');const mock=vm.runInNewContext(fs.readFileSync(require.resolve('../mock.cjs'),'utf8')+';APRIL_MOCK');
const fixture=()=>JSON.parse(JSON.stringify(mock));
test('project archive preserves scenario and independent comparison baseline',async()=>{
 const {normalizeArchive}=await import('../src/lib/archive.js');const p=fixture();const b=fixture();b.people[0].salary+=1000;
 const a=normalizeArchive({project:p,baseline:b,scenario:'Staffing alternative'},E.validate);
 assert.equal(a.scenario,'Staffing alternative');assert.equal(a.baseline.people[0].salary,b.people[0].salary);a.project.people[0].salary=1;assert.notEqual(p.people[0].salary,1);
});
test('malformed baseline and scenario reject before application',async()=>{
 const {normalizeArchive}=await import('../src/lib/archive.js');assert.throws(()=>normalizeArchive({project:fixture(),baseline:{},scenario:'Test'},E.validate));assert.throws(()=>normalizeArchive({project:fixture(),scenario:{}},E.validate));
});
test('unreadable saved data retained without writing or deleting',async()=>{
 const {loadArchive}=await import('../src/lib/archive.js');let writes=0;const a=loadArchive({getItem:()=>'{broken',setItem:()=>writes++},'key',fixture,E.validate);assert.equal(a.recovery,true);assert.equal(a.raw,'{broken');assert.equal(writes,0);
});
test('storage access failure enters recovery instead of throwing twice',async()=>{
 const {loadArchive}=await import('../src/lib/archive.js');const a=loadArchive({getItem:()=>{throw Error('Blocked')}},'key',fixture,E.validate);assert.equal(a.recovery,true);assert.equal(a.raw,null);
});

test('browser engine module exposes the same calculation API and results',async()=>{
 const {default:browserEngine}=await import('../src/lib/engine.js');assert.deepEqual(browserEngine.CATS,E.CATS);const {commitments,forecastIncomplete,faEstimatedActual,...legacy}=browserEngine.calculate(fixture());assert.deepEqual(faEstimatedActual,legacy.fa.actual);assert.equal(forecastIncomplete,false);assert.deepEqual(commitments,{rows:[],issues:[]});assert.deepEqual(legacy,E.calculate(fixture()));
});
test('replacement removes obsolete properties and persists full comparison state',async()=>{
 const {replaceArchive}=await import('../src/lib/archive.js');let saved;const old={project:fixture(),baseline:fixture(),scenario:'Old'};old.project.obsolete='discard';
 const next={project:fixture(),baseline:fixture(),scenario:'Replacement'};const result=replaceArchive({setItem:(k,v)=>saved=JSON.parse(v)},'key',next,E.validate);
 assert.equal(result.project.obsolete,undefined);assert.equal(saved.scenario,'Replacement');assert.deepEqual(saved.baseline,(await import('../src/lib/record-ids.js')).ensureCostIds(next.baseline));assert.equal(old.project.obsolete,'discard');
});
test('failed persistence leaves the original state intact',async()=>{
 const {replaceArchive}=await import('../src/lib/archive.js');const value={project:fixture(),baseline:fixture(),scenario:'Test'},before=JSON.stringify(value);
 assert.throws(()=>replaceArchive({setItem:()=>{throw Error('Quota exceeded')}},'key',value,E.validate),/Quota/);assert.equal(JSON.stringify(value),before);
});
test('blocked browser storage getter enters recovery and preserves the failure',async()=>{
 const {browserStorage,loadArchive,replaceArchive}=await import('../src/lib/archive.js');const blocked=browserStorage(()=>{throw Error('Storage denied')});const loaded=loadArchive(blocked,'key',fixture,E.validate);assert.equal(loaded.recovery,true);assert.equal(loaded.message,'Storage denied');assert.throws(()=>replaceArchive(blocked,'key',fixture(),E.validate),/Storage denied/);assert.throws(()=>blocked.removeItem('key'),/Storage denied/);
});
test('legacy cost rows receive distinct stable IDs without changing source data',async()=>{
 const {ensureCostIds}=await import('../src/lib/record-ids.js');const original={supplies:[{name:'A'},{name:'B'},{id:'migrated-supplies-0',name:'C'}],costs:[{name:'D'}]};const result=ensureCostIds(original);assert.equal(new Set(result.supplies.map(r=>r.id)).size,3);assert.deepEqual(ensureCostIds(result),result);assert.equal(original.supplies[0].id,undefined);assert.ok(result.costs[0].id);
});
test('stale archive writes reject without overwriting a newer tab save',async()=>{
 const {replaceArchive,loadArchive}=await import('../src/lib/archive.js');let raw=null;const storage={getItem:()=>raw,setItem:(k,v)=>raw=v};const a=loadArchive(storage,'key',fixture,E.validate),b=loadArchive(storage,'key',fixture,E.validate);const first=replaceArchive(storage,'key',{project:a.project,scenario:'A'},E.validate,a.raw);const saved=raw;assert.throws(()=>replaceArchive(storage,'key',{project:b.project,scenario:'B'},E.validate,b.raw),/another tab/);assert.equal(raw,saved);replaceArchive(storage,'key',{...first,scenario:'A2'},E.validate,saved);assert.equal(JSON.parse(raw).scenario,'A2');
});
test('compact local storage preserves large archives and exact revision checks',async()=>{
 const {persistArchive,loadArchive,encodeStoredArchive,decodeStoredArchive}=await import('../src/lib/archive.js');const p=fixture();p.ledger=Array.from({length:20000},(_,i)=>({id:i,cat:'Other',month:'2026-01',amount:1,reference:'synthetic-'+i}));let raw=null;
 const store={getItem:()=>raw,setItem:(k,v)=>{if(v.length*2>5000000)throw Error('Quota exceeded');raw=v}};
 const value={project:p,baseline:p,scenario:'Large synthetic budget'},saved=persistArchive(store,'key',value,E.validate,null);
 assert.equal(saved.raw,raw);assert.equal(JSON.parse(raw).storageFormat,'uab-budget-lz-2');assert.ok(raw.length*2<5000000);
 assert.deepEqual(decodeStoredArchive(raw),saved.archive);const loaded=loadArchive(store,'key',fixture,E.validate);assert.equal(loaded.recovery,undefined);assert.equal(loaded.project.ledger.length,20000);
 persistArchive(store,'key',{...saved.archive,scenario:'Next revision'},E.validate,raw);const current=raw;assert.throws(()=>persistArchive(store,'key',value,E.validate,saved.raw),/another tab/);assert.equal(raw,current);
 assert.deepEqual(decodeStoredArchive(encodeStoredArchive({test:'small'})),{test:'small'});
});
test('damaged compact storage enters recovery without replacing original data',async()=>{
 const {loadArchive,encodeStoredArchive}=await import('../src/lib/archive.js');const encoded=JSON.parse(encodeStoredArchive({padding:'synthetic'.repeat(40000)}));encoded.length+=1;const raw=JSON.stringify(encoded);let writes=0;
 const result=loadArchive({getItem:()=>raw,setItem:()=>writes++},'key',fixture,E.validate);assert.equal(result.recovery,true);assert.equal(result.raw,raw);assert.equal(writes,0);
});

test('packed snapshots restore independent arrays and reject unsafe reference paths',async()=>{
 const {encodeStoredArchive,decodeStoredArchive}=await import('../src/lib/archive.js');const LZ=(await import('lz-string')).default;
 const rows=Array.from({length:1000},(_,i)=>({id:i,note:'synthetic '.repeat(40)}));const original={project:{ledger:rows},baseline:{ledger:rows}};const restored=decodeStoredArchive(encodeStoredArchive(original));restored.project.ledger[0].note='changed';assert.equal(restored.baseline.ledger[0].note,rows[0].note);
 const payload=JSON.stringify({root:{safe:null},chunks:['[]'],refs:[{path:['__proto__','polluted'],id:0}]});assert.throws(()=>decodeStoredArchive(JSON.stringify({storageFormat:'uab-budget-lz-2',length:payload.length,data:LZ.compressToUTF16(payload)})),/path/);assert.equal({}.polluted,undefined);
});
test('packed reference boundary round-trips and oversized saves preserve previous archive',async()=>{
 const {persistArchive,loadArchive}=await import('../src/lib/archive.js');const p=fixture();p.ledger=[];p.retainedMetadata=Object.fromEntries(Array.from({length:5000},(_,i)=>['list'+i,Array(100).fill(i%10)]));let raw=null,writes=0;
 const storage={getItem:()=>raw,setItem:(k,v)=>{raw=v;writes++}};
 persistArchive(storage,'key',{project:p,baseline:p,scenario:'Boundary'},E.validate,null);const previous=raw;const loaded=loadArchive(storage,'key',fixture,E.validate);assert.equal(loaded.recovery,undefined);assert.equal(Object.keys(loaded.project.retainedMetadata).length,5000);
 p.retainedMetadata.excess=Array(100).fill(1);assert.throws(()=>persistArchive(storage,'key',{project:p,baseline:p,scenario:'Too many'},E.validate,previous),/reference limits/);assert.equal(raw,previous);assert.equal(writes,1);
});
