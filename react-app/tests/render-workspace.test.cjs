const {test}=require('node:test'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom'),esbuild=require('esbuild'),Module=require('node:module'),path=require('node:path');
test('entry re-evaluation reuses one React root and preserves mounted state',async()=>{
 const dom=new JSDOM('<!doctype html><body><div id="root"></div></body>',{pretendToBeVisual:true});
 for(const k of ['window','document','navigator','HTMLElement','Node','Event','MouseEvent'])Object.defineProperty(globalThis,k,{value:dom.window[k],configurable:true});
 globalThis.IS_REACT_ACT_ENVIRONMENT=true;
 const React=require('react'),{act}=React;
 const built=await esbuild.build({entryPoints:['src/lib/render-workspace.tsx'],bundle:true,write:false,platform:'node',format:'cjs',external:['react','react-dom','react-dom/client']});
 const load=()=>{const m=new Module(path.resolve('render-workspace-test.cjs'),module);m.filename=path.resolve('render-workspace-test.cjs');m.paths=module.paths;m._compile(built.outputFiles[0].text,m.filename);return m.exports.renderWorkspace};
 function Counter({label}){const [n,set]=React.useState(0);return React.createElement('button',{onClick:()=>set(n+1)},`${label}: ${n}`)}
 const container=document.getElementById('root'),errors=[],original=console.error;console.error=(...args)=>errors.push(args.join(' '));let root;
 try{
  await act(async()=>{root=load()(container,React.createElement(Counter,{label:'Before'}))});
  await act(async()=>document.querySelector('button').dispatchEvent(new MouseEvent('click',{bubbles:true})));
  let next;await act(async()=>{next=load()(container,React.createElement(Counter,{label:'After'}))});
  assert.equal(next,root);assert.equal(container.textContent,'After: 1');assert.equal(container.children.length,1);assert.deepEqual(errors,[]);
 }finally{if(root)await act(async()=>root.unmount());console.error=original;dom.window.close()}
});
