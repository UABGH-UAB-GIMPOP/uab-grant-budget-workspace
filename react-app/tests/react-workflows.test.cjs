const {test}=require('node:test'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom'),esbuild=require('esbuild'),path=require('node:path'),Module=require('node:module');
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve}};
test('actual React import and period handlers preserve canceled and rejected work',async t=>{
 const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'https://synthetic.example/',pretendToBeVisual:true});
 for(const key of ['window','document','navigator','HTMLElement','HTMLInputElement','HTMLFormElement','Element','Node','NodeFilter','MutationObserver','CustomEvent','Event','MouseEvent','FocusEvent','FormData','getComputedStyle'])Object.defineProperty(globalThis,key,{value:dom.window[key],configurable:true,writable:true});
 globalThis.ResizeObserver=class{observe(){} unobserve(){} disconnect(){}};globalThis.IS_REACT_ACT_ENVIRONMENT=true;globalThis.requestAnimationFrame=fn=>setTimeout(fn,0);globalThis.cancelAnimationFrame=clearTimeout;
 const crypto=require('node:crypto').webcrypto;Object.defineProperty(globalThis,'crypto',{value:crypto,configurable:true});
 const React=require('react'),{act}=React,{createRoot}=require('react-dom/client');
 const result=await esbuild.build({entryPoints:['src/main.tsx'],bundle:true,write:false,platform:'node',format:'cjs',external:['react','react-dom','react-dom/client'],loader:{'.css':'empty'},alias:{'@':path.resolve('src')}});
 const compiled=new Module(path.resolve('test-app.cjs'),module);compiled.filename=path.resolve('test-app.cjs');compiled.paths=module.paths;compiled._compile(result.outputFiles[0].text,compiled.filename);const App=compiled.exports.App;
 let root,raw,writes,fail;
 async function mount(initialView='Setup',props={}){raw=null;writes=0;fail=false;globalThis.localStorage={getItem:()=>raw,setItem:(k,v)=>{if(fail)throw Error('Quota exceeded');raw=v;writes++},removeItem:()=>{raw=null}};const host=document.createElement('div');document.body.append(host);root=createRoot(host);await act(async()=>root.render(React.createElement(App,{initialView,...props})));}
 const button=name=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===name);assert.ok(b,'Missing button '+name);return b};
 const click=async name=>act(async()=>button(name).click());
 const submit=async form=>act(async()=>form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
 async function selectFile(file){const input=document.querySelector('input[type=file]');Object.defineProperty(input,'files',{value:[file],configurable:true});await act(async()=>input.dispatchEvent(new Event('change',{bubbles:true})));}
 async function cleanup(){await act(async()=>root.unmount());document.body.innerHTML='';}
 await t.test('all views begin read-only and explicit edits save once or cancel completely',async()=>{
  for(const view of ['Summary','Ledger','Personnel','Effort','Supplies','Subawards','Setup']){await mount(view);assert.equal(document.querySelectorAll('input[type=number],input[type=month],input[type=date]').length,0,view);assert.equal(document.querySelectorAll('button[aria-label^="Remove"]').length,0,view);assert.equal(writes,0);await cleanup();}
  await mount('Personnel');assert.equal(document.querySelector('input[aria-label="Dr. Alex Rivera salary"]'),null);await click('Edit budget');const change=async value=>{const input=document.querySelector('input[aria-label="Dr. Alex Rivera salary"]');await act(async()=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,value);input.dispatchEvent(new FocusEvent('focusout',{bubbles:true}))});};
  await change('161000');assert.equal(writes,0);await click('Cancel edits');assert.equal(raw,null);assert.match(document.querySelector('[aria-label="Dr. Alex Rivera salary"]').textContent,/\$160,000\.00/);
  await click('Edit budget');await change('162000');await click('Save changes');assert.equal(writes,1);assert.equal(JSON.parse(raw).project.people[0].salary,162000);assert.equal(document.querySelector('input[aria-label="Dr. Alex Rivera salary"]'),null);await cleanup();
 });
 await t.test('failed save permits download of the unsaved draft without changing saved storage',async()=>{
  await mount('Personnel');await click('Edit budget');const input=document.querySelector('input[aria-label="Dr. Alex Rivera salary"]');await act(async()=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'163000');input.dispatchEvent(new FocusEvent('focusout',{bubbles:true}))});fail=true;await click('Save changes');assert.equal(raw,null);let blob;const oldCreate=URL.createObjectURL,oldRevoke=URL.revokeObjectURL,oldClick=dom.window.HTMLAnchorElement.prototype.click;URL.createObjectURL=value=>{blob=value;return 'blob:synthetic'};URL.revokeObjectURL=()=>{};dom.window.HTMLAnchorElement.prototype.click=function(){};
  try{await click('Download unsaved draft');const draft=JSON.parse(await blob.text());assert.equal(draft.project.people[0].salary,163000);assert.equal(draft.baseline.people[0].salary,160000);assert.equal(raw,null);assert.equal(writes,0);}finally{URL.createObjectURL=oldCreate;URL.revokeObjectURL=oldRevoke;dom.window.HTMLAnchorElement.prototype.click=oldClick;await cleanup();}
 });
 await t.test('summary category details open without edits and return without changing the project',async()=>{
  await mount('Summary');await click('Other');assert.match(document.querySelector('[role=dialog]').textContent,/Actuals through/);assert.ok(document.querySelector('[aria-label="Category transactions"]'));assert.equal(writes,0);await click('Back to summary');assert.equal(document.querySelector('[role=dialog]'),null);assert.equal(document.querySelector('[role=tab][aria-selected=true]').textContent.trim(),'Summary');assert.equal(raw,null);await cleanup();
 });
 await t.test('cancel during file read prevents a late preview and save',async()=>{
  await mount();await click('More');const wait=deferred();await selectFile({name:'synthetic.csv',size:50,text:()=>wait.promise});assert.match(document.body.textContent,/Checking import/);await click('Close');await act(async()=>wait.resolve('month,category,amount,reference\n2026-01,Other,1,QA'));
  assert.equal(document.querySelector('[role=dialog]'),null);assert.equal(writes,0);assert.equal(raw,null);await cleanup();
 });
 await t.test('period review applies explicit periods while preserving baseline; rejected save changes neither',async()=>{
  await mount();await click('Edit budget');await click('Edit periods');await click('Split period 1');await click('Review period changes');await click('Apply periods');assert.equal(raw,null);fail=true;await click('Save changes');assert.match(document.body.textContent,/Quota exceeded/);assert.equal(raw,null);assert.equal(writes,0);assert.ok(button('Save changes'));
  fail=false;await click('Save changes');assert.equal(writes,1);const archive=JSON.parse(raw);assert.equal(archive.project.budgetPeriods.length,4);assert.equal(archive.baseline.budgetPeriods,undefined);assert.equal(document.querySelector('[role=dialog]'),null);await cleanup();
 });
 await t.test('cancel during CSV digest prevents late review and archive replacement',async()=>{
  await mount();await click('More');await selectFile({name:'synthetic.csv',size:70,text:async()=> 'month,category,amount,reference\n2026-01,Other,1,QA'});
  const input=document.querySelector('[role=dialog] input[name=source]');assert.ok(input);input.value='Synthetic source';const wait=deferred(),real=crypto.subtle.digest.bind(crypto.subtle);let entered=false;
  crypto.subtle.digest=async(...args)=>{if(!entered){entered=true;await wait.promise}return real(...args)};
  try{await submit(input.closest('form'));assert.equal(entered,true,document.querySelector('[role=dialog]')?.textContent);await click('Cancel');await act(async()=>{wait.resolve();await new Promise(r=>setTimeout(r,30))});assert.equal(document.querySelector('[role=dialog]'),null);assert.equal(writes,0);assert.equal(raw,null);}finally{crypto.subtle.digest=real;await cleanup()}
 });
 async function prepareCsv(){
  await click('More');await selectFile({name:'synthetic.csv',size:70,text:async()=> 'month,category,amount,reference\n2026-01,Other,1,QA'});
  const input=document.querySelector('[role=dialog] input[name=source]');input.value='Synthetic source';await submit(input.closest('form'));
  for(let i=0;i<100&&!document.querySelector('[aria-label="CSV row review"]');i++)await act(async()=>new Promise(r=>setTimeout(r,10)));
  assert.ok(document.querySelector('[aria-label="CSV row review"]'));
 }
 await t.test('first CSV import uses stable portfolio identity and repeat import is idempotent',async()=>{
  await mount('Setup',{projectId:'portfolio-stable-id'});await prepareCsv();await click('Apply import');
  for(let i=0;i<100&&document.body.textContent.includes('Checking import');i++)await act(async()=>new Promise(r=>setTimeout(r,10)));
  assert.equal(JSON.parse(raw).project.id,'portfolio-stable-id');const before=raw,count=writes;await prepareCsv();assert.ok(button('Done'));await click('Done');assert.equal(raw,before);assert.equal(writes,count);await cleanup();
 });
 await t.test('cancel during apply digest cannot persist or reopen the canceled import',async()=>{
  await mount();await prepareCsv();const wait=deferred(),real=crypto.subtle.digest.bind(crypto.subtle);let entered=false;
  crypto.subtle.digest=async(...args)=>{if(!entered){entered=true;await wait.promise}return real(...args)};
  try{await click('Apply import');assert.equal(entered,true);await click('Cancel');await act(async()=>{wait.resolve();await new Promise(r=>setTimeout(r,40))});assert.equal(writes,0);assert.equal(raw,null);assert.equal(document.querySelector('[role=dialog]'),null);}finally{crypto.subtle.digest=real;await cleanup()}
 });
 await t.test('CSV apply preserves external saved version when another tab changes storage',async()=>{
  await mount();await prepareCsv();raw='external saved version';await click('Apply import');
  for(let i=0;i<100&&document.body.textContent.includes('Checking import');i++)await act(async()=>new Promise(r=>setTimeout(r,10)));
  assert.match(document.body.textContent,/another tab/);assert.equal(raw,'external saved version');assert.equal(writes,0);assert.ok(document.querySelector('[aria-label="CSV row review"]'));await cleanup();
 });
 await t.test('scenario workflow locks comparison and returns to unchanged source',async()=>{
  await mount();globalThis.confirm=()=>true;await click('More');await click('Save scenario');
  const name=document.querySelector('[role=dialog] input[name=name]');name.value='QA staffing option';await submit(name.closest('form'));
  const saved=JSON.parse(raw),sourceLedger=JSON.stringify(saved.project.ledger),sourceBaseline=JSON.stringify(saved.baseline);assert.ok(saved.project.activeScenarioId);assert.match(document.body.textContent,/Actuals and baseline locked/);await click('Edit budget');assert.equal(document.querySelector('[aria-label="Actuals through"]').disabled,true);assert.equal(document.querySelector('[aria-label="Title"]').disabled,false);
  await click('Add milestone');await click('Save changes');assert.equal(JSON.parse(raw).project.milestones.length,1);assert.equal(JSON.stringify(JSON.parse(raw).project.ledger),sourceLedger);
  await click('More');const before=raw;await click('Set comparison baseline');assert.match(document.body.textContent,/baseline is fixed/);assert.equal(raw,before);assert.equal(JSON.stringify(JSON.parse(raw).baseline),sourceBaseline);
  await click('Return to source budget');assert.equal(JSON.parse(raw).project.activeScenarioId,undefined);assert.equal(JSON.parse(raw).project.milestones.length,0);assert.equal(JSON.stringify(JSON.parse(raw).project.ledger),sourceLedger);await cleanup();
 });
 await t.test('identical CSV offers Done and cannot create another batch',async()=>{
  await mount();await prepareCsv();await click('Apply import');
  for(let i=0;i<100&&document.querySelector('[role=dialog]');i++)await act(async()=>new Promise(r=>setTimeout(r,10)));
  assert.equal(writes,1);const before=raw;await prepareCsv();assert.match(document.body.textContent,/0 new.*1 identical.*0 conflicts/);assert.equal(button('Apply import').disabled,true);assert.match(document.body.textContent,/No changes to apply/);await click('Done');assert.equal(raw,before);assert.equal(writes,1);await cleanup();
 });
 await t.test('recurring milestone completion saves once and failed storage preserves pending state',async()=>{
  await mount();await click('Edit budget');await click('Add milestone');const repeat=document.querySelector('[aria-label="New milestone repeat"]');await act(async()=>{repeat.value='Monthly';repeat.dispatchEvent(new Event('change',{bubbles:true}))});await click('Save changes');const before=raw;await click('Edit budget');fail=true;
  await act(async()=>document.querySelector('[role=checkbox][aria-label$=" complete"]').click());await click('Save changes');assert.equal(raw,before);assert.equal(document.querySelector('[role=checkbox][aria-label$=" complete"]').getAttribute('aria-checked'),'true');assert.match(document.body.textContent,/Quota exceeded/);
  fail=false;await click('Save changes');const saved=JSON.parse(raw).project.milestones;assert.equal(saved.length,2);assert.equal(saved[0].done,true);assert.equal(saved[1].done,false);assert.equal(saved[1].previousId,saved[0].id);assert.equal(saved[1].cadence,'Monthly');await cleanup();
 });
 await t.test('batched cadence and completion preserve both updates before a render',async()=>{
  await mount();await click('Edit budget');await click('Add milestone');await act(async()=>{const repeat=document.querySelector('[aria-label="New milestone repeat"]');repeat.value='Monthly';repeat.dispatchEvent(new Event('change',{bubbles:true}));document.querySelector('[role=checkbox][aria-label$=" complete"]').click()});assert.equal(raw,null);await click('Save changes');const items=JSON.parse(raw).project.milestones;assert.equal(items.length,2);assert.equal(items[0].cadence,'Monthly');assert.equal(items[0].done,true);assert.equal(items[1].cadence,'Monthly');await cleanup();
 });
 await t.test('date blur reads the entered value even without a React change event',async()=>{
  await mount();await click('Edit budget');await click('Add milestone');const input=document.querySelector('[aria-label="New milestone due"]');await act(async()=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'2027-01-31');input.dispatchEvent(new FocusEvent('focusout',{bubbles:true}))});await click('Save changes');assert.equal(JSON.parse(raw).project.milestones[0].due,'2027-01-31');assert.equal(JSON.parse(raw).project.milestones[0].anchorDay,31);await cleanup();
 });
 await t.test('payment schedule validates and survives rejected save before applying atomically',async()=>{
  await mount('Ledger');await click('Edit budget');const form=button('Add commitment').closest('form');for(const [key,value] of Object.entries({name:'QA order',source:'Synthetic',category:'Equipment',amount:'1000',month:'2026-11'}))form.elements.namedItem(key).value=value;await submit(form);await click('Schedule');await click('Add payment');
  for(const [label,value] of [['Payment 1 amount','400'],['Payment 2 amount','600'],['Payment 2 month','2026-12']]){const input=document.querySelector('[aria-label="'+label+'"]');await act(async()=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,value);input.dispatchEvent(new FocusEvent('focusout',{bubbles:true}))});}
  const before=raw;await click('Apply schedule');fail=true;await click('Save changes');assert.equal(raw,before);assert.ok(button('Save changes'));assert.match(document.body.textContent,/Quota exceeded/);fail=false;await click('Save changes');const schedule=JSON.parse(raw).project.commitments[0].schedule;assert.deepEqual(schedule.map(x=>[x.month,x.amount]),[['2026-11',400],['2026-12',600]]);assert.equal(document.querySelector('[role=dialog]'),null);await cleanup();
 });
 dom.window.close();
});
