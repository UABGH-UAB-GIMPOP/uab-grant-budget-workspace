const {test}=require('node:test'),fs=require('node:fs'),path=require('node:path');
for(const file of ['original-calculations.cjs','original-validation.cjs'])test(`original regression suite against current React engine: ${file}`,async()=>{
 const E=(await import('../src/lib/engine.js')).default;const source=fs.readFileSync(path.join(__dirname,'fixtures',file),'utf8');const run=new Function('require','console','performance',source);run(name=>name==='./engine.js'?E:require(name),{log(){}},performance);
});
