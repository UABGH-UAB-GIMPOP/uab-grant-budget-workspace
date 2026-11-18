const {test}=require('node:test'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom'),esbuild=require('esbuild'),Module=require('node:module'),path=require('node:path');
test('project actions support keyboard metadata/archive/restore and return focus',async()=>{
 const dom=new JSDOM('<!doctype html><body></body>',{url:'https://synthetic.example',pretendToBeVisual:true});
 for(const k of ['window','document','navigator','HTMLElement','HTMLInputElement','HTMLFormElement','Element','Node','NodeFilter','Event','KeyboardEvent','MouseEvent','FocusEvent','MutationObserver','CustomEvent','DocumentFragment','getComputedStyle'])Object.defineProperty(globalThis,k,{value:dom.window[k],configurable:true});
 globalThis.IS_REACT_ACT_ENVIRONMENT=true;globalThis.ResizeObserver=class{observe(){}unobserve(){}disconnect(){}};globalThis.requestAnimationFrame=fn=>setTimeout(fn,0);globalThis.cancelAnimationFrame=clearTimeout;HTMLElement.prototype.scrollIntoView=function(){};HTMLElement.prototype.hasPointerCapture=()=>false;HTMLElement.prototype.releasePointerCapture=()=>{};
 const React=require('react'),{act}=React,{createRoot}=require('react-dom/client');const built=await esbuild.build({entryPoints:['src/components/project-actions.tsx'],bundle:true,write:false,platform:'node',format:'cjs',external:['react','react-dom','react-dom/client'],alias:{'@':path.resolve('src')}}),mod=new Module(path.resolve('project-actions-test.cjs'),module);mod.filename=path.resolve('project-actions-test.cjs');mod.paths=module.paths;mod._compile(built.outputFiles[0].text,mod.filename);
 const host=document.createElement('div');document.body.append(host);const root=createRoot(host),edits=[],archives=[],row={id:'synthetic-id',title:'Synthetic award',archived:false};
 const render=async r=>act(async()=>root.render(React.createElement(mod.exports.ProjectActions,{row:r,onEditMetadata:id=>edits.push(id),onArchive:(id,flag)=>archives.push([id,flag])})));
 const key=async(el,key)=>act(async()=>el.dispatchEvent(new KeyboardEvent('keydown',{key,bubbles:true})));
 const waitFor=async check=>{for(let i=0;i<100&&!check();i++)await act(async()=>new Promise(r=>setTimeout(r,10)));assert.ok(check(),'Expected menu/focus state did not settle')};
 const trigger=()=>document.querySelector('[aria-label="Actions for Synthetic award"]');
 const open=async()=>{await act(async()=>trigger().focus());await key(trigger(),'ArrowDown');await waitFor(()=>document.querySelector('[role=menu]')&&document.activeElement?.getAttribute('role')==='menuitem')};
 const closeCheck=async()=>{await waitFor(()=>!document.querySelector('[role=menu]')&&document.activeElement===trigger())};
 try{
  await render(row);await open();assert.match(document.activeElement.textContent,/Edit owner and sponsor/);await key(document.activeElement,'Enter');await closeCheck();assert.deepEqual(edits,['synthetic-id']);assert.deepEqual(archives,[]);
  await open();await key(document.activeElement,'End');await waitFor(()=>document.activeElement.textContent==='Archive project');await key(document.activeElement,'Enter');await closeCheck();assert.deepEqual(archives,[['synthetic-id',true]]);
  await render({...row,archived:true});await open();assert.equal(document.querySelectorAll('[role=menuitem]').length,1);assert.doesNotMatch(document.querySelector('[role=menu]').textContent,/Edit owner/);assert.equal(document.activeElement.textContent,'Restore project');await key(document.activeElement,'Enter');await closeCheck();assert.deepEqual(archives,[['synthetic-id',true],['synthetic-id',false]]);assert.deepEqual(edits,['synthetic-id']);
  await open();await key(document.activeElement,'Escape');await closeCheck();assert.equal(archives.length,2);
 }finally{await act(async()=>root.unmount());dom.window.close()}
});
