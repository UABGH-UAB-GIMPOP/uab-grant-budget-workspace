const {test}=require('node:test'),assert=require('node:assert/strict');
test('award detail threshold preserves exact balance, excludes proposal and incomplete forecasts, and never mutates calculation',async()=>{
 const React=require('react'),{renderToStaticMarkup}=require('react-dom/server'),esbuild=require('esbuild'),Module=require('node:module'),path=require('node:path');
 const build=await esbuild.build({entryPoints:['src/components/project-balance.tsx'],bundle:true,write:false,platform:'node',format:'cjs',external:['react']}),m=new Module(path.resolve('balance.test.cjs'),module);m.filename=path.resolve('balance.test.cjs');m.paths=module.paths;m._compile(build.outputFiles[0].text,m.filename);
 const c={total:{variance:7,plan:100},forecastIncomplete:false},before=JSON.stringify(c);
 const render=props=>renderToStaticMarkup(React.createElement(m.exports.ProjectBalance,{calculation:c,mode:'award',threshold:7,...props}));
 assert.match(render(),/\$7\.00/);assert.match(render(),/At or below 7% remaining/);assert.match(render(),/financial-caution/);
 for(const props of [{mode:'proposal'},{threshold:null},{calculation:{...c,forecastIncomplete:true}},{calculation:{...c,total:{variance:0,plan:0}}}])assert.doesNotMatch(render(props),/financial-caution|At or below/);
 assert.match(render({calculation:{...c,forecastIncomplete:true}}),/Incomplete/);
 const negative={...c,total:{variance:-7,plan:100}};
 assert.match(render({calculation:negative}),/balance negative/);assert.doesNotMatch(render({calculation:negative}),/financial-caution/);
 assert.match(render({calculation:negative,highlighting:false}),/Projected overspend/);assert.doesNotMatch(render({calculation:negative,highlighting:false}),/balance negative/);
 assert.equal(JSON.stringify(c),before);
});
