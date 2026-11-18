const {readdirSync}=require('node:fs'),{spawnSync}=require('node:child_process'),assert=require('node:assert/strict');
const files=readdirSync('tests').filter(name=>name.endsWith('.test.cjs')).sort(),legacy='legacy-regression.test.cjs';assert.ok(files.includes(legacy),'Original regression suite must remain in the test gate');
// Keep the unchanged wall-clock performance assertion out of concurrent DOM workloads.
for(const phase of [{label:'Application and workflow regressions',concurrency:4,files:files.filter(name=>name!==legacy)},{label:'Original parity and performance regressions (serial)',concurrency:1,files:[legacy]}]){
 console.log('\n'+phase.label);const result=spawnSync(process.execPath,['--test','--test-concurrency='+phase.concurrency,...phase.files.map(name=>'tests/'+name)],{stdio:'inherit'});if(result.error)throw result.error;if(result.status!==0){process.exitCode=result.status||1;break;}
}
