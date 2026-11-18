const {test}=require('node:test');const assert=require('node:assert/strict');
const load=()=>import('../src/lib/workbook-reader.js');
async function workbook(rows){const {makeXlsx}=await import('../src/lib/xlsx.js');return new Uint8Array(await makeXlsx([{name:'Entries',rows}]).arrayBuffer());}
async function mutate(bytes,change){const {unzipSync,zipSync,strFromU8,strToU8}=await import('fflate');const files=unzipSync(bytes);change(files,strFromU8,strToU8);return zipSync(files);}
test('workbook inspection preserves typed values, original coordinates and leading-zero text without mutation',async()=>{const {inspectWorkbook}=await load();const bytes=await workbook([['Reference','Amount','Flag'],['00123',12.5,true]]),before=bytes.slice();const result=inspectWorkbook(bytes);assert.equal(result.dateSystem,'1900');assert.deepEqual(result.sheets[0].cells.find(c=>c.address==='A2'),{address:'A2',row:2,column:1,type:'s',value:'00123',format:'General'});assert.equal(result.sheets[0].cells.find(c=>c.address==='B2').value,12.5);assert.deepEqual(bytes,before);});
test('formulas and error values fail closed rather than silently trusting cached values',async()=>{const {inspectWorkbook}=await load();for(const replacement of ['<c r="A1"><f>1+1</f><v>2</v></c>','<c r="A1" t="e"><v>#DIV/0!</v></c>']){const bytes=await mutate(await workbook([[1]]),(files,decode,encode)=>{const path='xl/worksheets/sheet1.xml';files[path]=encode(decode(files[path]).replace(/<c\b[\s\S]*?<\/c>/,replacement));});assert.throws(()=>inspectWorkbook(bytes),/formula|error cells/);}});
test('cell dimensions, populated count and text limits are enforced',async()=>{const {inspectWorkbook}=await load();const bytes=await workbook([['abc',2],[3,4]]);assert.throws(()=>inspectWorkbook(bytes,{limits:{rows:1}}),/dimensions|row/);assert.throws(()=>inspectWorkbook(bytes,{limits:{columns:1}}),/dimensions/);assert.throws(()=>inspectWorkbook(bytes,{limits:{cells:3}}),/populated/);assert.throws(()=>inspectWorkbook(bytes,{limits:{text:2}}),/text/);assert.throws(()=>inspectWorkbook(bytes,{limits:{unknown:1}}),/invalid/);});
test('abort is reported and invalid container is rejected',async()=>{const {inspectWorkbook}=await load();const control=new AbortController();control.abort();assert.throws(()=>inspectWorkbook(new Uint8Array(),{signal:control.signal}),{name:'AbortError'});assert.throws(()=>inspectWorkbook(new Uint8Array([1,2,3])),/ZIP/);});

test('duplicate coordinates, empty/shared formulas and mismatched rows cannot silently change values',async()=>{const {inspectWorkbook}=await load();for(const [replacement,expected] of [['<c r="A1"><v>1</v></c><c r="A1"><v>999</v></c>',/duplicate/],['<c r="A1"><f/><v>999</v></c>',/formula/],['<c r="A1"><f t="shared" si="0"/><v>999</v></c>',/formula/],['<c r="A2"><v>999</v></c>',/coordinates/]]){const bytes=await mutate(await workbook([[1]]),(files,decode,encode)=>{const path='xl/worksheets/sheet1.xml';files[path]=encode(decode(files[path]).replace(/<c\b[\s\S]*?<\/c>/,replacement));});assert.throws(()=>inspectWorkbook(bytes),expected);}});

test('structural preflight ignores commented markup and bounds sheet count',async()=>{const {inspectWorkbook}=await load();const bytes=await mutate(await workbook([[1]]),(files,decode,encode)=>{const path='xl/worksheets/sheet1.xml';files[path]=encode(decode(files[path]).replace('<sheetData>','<!-- <c r="XFD1048576"/> --><sheetData>'));});assert.equal(inspectWorkbook(bytes).populatedCells,1);const {makeXlsx}=await import('../src/lib/xlsx.js');const two=new Uint8Array(await makeXlsx([{name:'One',rows:[[1]]},{name:'Two',rows:[[2]]}]).arrayBuffer());assert.throws(()=>inspectWorkbook(two,{limits:{sheets:1}}),/too many worksheets/);});

test('alternate worksheet relationship targets cannot bypass preflight',async()=>{const {inspectWorkbook}=await load();const {makeXlsx}=await import('../src/lib/xlsx.js');const original=new Uint8Array(await makeXlsx([{name:'Entries',rows:[[1]]},{name:'Other',rows:[[2]]}]).arrayBuffer());const bytes=await mutate(original,(files,decode,encode)=>{files['xl/custom.xml']=encode(decode(files['xl/worksheets/sheet1.xml']).replace('<v>1</v>','<f/><v>999</v>'));delete files['xl/worksheets/sheet1.xml'];files['xl/_rels/workbook.xml.rels']=encode(decode(files['xl/_rels/workbook.xml.rels']).replace('worksheets/sheet1.xml','custom.xml'));files['[Content_Types].xml']=encode(decode(files['[Content_Types].xml']).replace('/xl/worksheets/sheet1.xml','/xl/custom.xml'));});assert.throws(()=>inspectWorkbook(bytes),/unsupported worksheet relationship/);});

test('original numeric worksheet XML cannot silently lose decimal precision before mapping',async()=>{
 const {inspectWorkbook}=await load();
 for(const raw of ['1.0000000000000001','0.0099999999999999999','90071992547409.91','1e-999','1e999']){
 const bytes=await mutate(await workbook([[1]]),(files,decode,encode)=>{const p='xl/worksheets/sheet1.xml';files[p]=encode(decode(files[p]).replace('<v>1</v>',`<v>${raw}</v>`));});assert.throws(()=>inspectWorkbook(bytes),/stored decimal value/,raw);
 }
 for(const [raw,expected] of [['1.2300',1.23],['-0.000',0],['1.25E+2',125],['4.6000E4',46000],['-7.25',-7.25]]){
 const bytes=await mutate(await workbook([[1]]),(files,decode,encode)=>{const p='xl/worksheets/sheet1.xml';files[p]=encode(decode(files[p]).replace('<v>1</v>',`<v>${raw}</v>`));});const value=inspectWorkbook(bytes).sheets[0].cells[0].value;assert.ok(value===expected,raw);
 }
});

test('nested cells, nested value elements and duplicate values fail before any partial workbook result',async()=>{
 const {inspectWorkbook}=await load();
 const bad=[
 '<c r="A1"><v>1.0000000000000001<c r="B1" t="n"><v>2</v></c></v></c>',
 '<c r="A1"><v>1.0000000000000001<c r="B1" t="inlineStr"><is><t>x</t></is></c></v></c>',
 '<c r="A1"><v>1.0000000000000001<c r="B1" t="b"><v>0</v></c></v></c>',
 '<c r="A1"><c r="B1"><v>2</v></c><v>1</v></c>',
 '<c r="A1"><v><x>1</x></v></c>',
 '<c r="A1"><v>1</v><v>2</v></c>',
 '<c r="A1"><v/><v>2</v></c>',
 '<c r="A1" t="b"><v>0<x/></v></c>',
 '<c r="A1"><is><t>1</t></is></c>',
 '<c r="A1"><wrapper><v>1</v></wrapper></c>',
 '<c r="A1" t="inlineStr"><is><t>1</t></is><is><t>2</t></is></c>',
 '<c r="A1" t="inlineStr"><v>1</v><is><t>2</t></is></c>'
 ];
 for(const cell of bad){const bytes=await mutate(await workbook([[1]]),(files,decode,encode)=>{const p='xl/worksheets/sheet1.xml';files[p]=encode(decode(files[p]).replace(/<c\b[\s\S]*?<\/c>/,cell));});const before=bytes.slice();assert.throws(()=>inspectWorkbook(bytes),/nested|once directly|inline strings|unsupported cell content/,cell);assert.deepEqual(bytes,before);}
});
