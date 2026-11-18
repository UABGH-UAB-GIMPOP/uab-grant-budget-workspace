import E from './engine.js';
const clone=x=>JSON.parse(JSON.stringify(x));
const clean=value=>{const next=clone(value);delete next.savedScenarios;delete next.activeScenarioId;delete next.scenarioReturn;return next;};
function returnContext(project,baseline){
 if(project.scenarioReturn)return clone(project.scenarioReturn);
 const source=scenarioSource(project);
 return {project:clean(source?.sourceProject||source?.project||project),baseline:clean(source?.sourceBaseline||source?.baseline||baseline||project)};
}
export function saveScenario(project,baseline,name,id,at){
 if(!name.trim()||name.length>120)throw Error('Enter a scenario name of 1–120 characters.');
 if((project.savedScenarios||[]).some(s=>s.id===id))throw Error('Scenario ID already exists.');
 const snapshot=clean(project),comparison=clean(baseline);delete snapshot.savedScenarios;delete comparison.savedScenarios;delete snapshot.activeScenarioId;delete comparison.activeScenarioId;
 const prior=scenarioSource(project),origin=clean(prior?.sourceProject||prior?.project||snapshot),originBaseline=clean(prior?.sourceBaseline||prior?.baseline||comparison);delete origin.savedScenarios;delete origin.activeScenarioId;delete originBaseline.savedScenarios;delete originBaseline.activeScenarioId;
 const next=clone(project);next.scenarioReturn=returnContext(project,baseline);next.activeScenarioId=id;next.savedScenarios=[...(next.savedScenarios||[]),{id,name:name.trim(),at,project:snapshot,baseline:comparison,sourceProject:origin,sourceBaseline:originBaseline}];return next;
}
export function restoreScenario(project,id,baseline=project){
 const entry=(project.savedScenarios||[]).find(s=>s.id===id);if(!entry)throw Error('Scenario not found.');
 return {project:{...clone(entry.project),activeScenarioId:id,scenarioReturn:returnContext(project,baseline),savedScenarios:clone(project.savedScenarios)},baseline:clone(entry.baseline),scenario:entry.name};
}

export function scenarioSource(project){
 if(project.activeScenarioId===undefined)return null;
 const source=(project.savedScenarios||[]).find(s=>s.id===project.activeScenarioId);
 if(!source)throw Error('The active scenario is missing its source snapshot.');
 return source;
}
export function validateScenarioActuals(project){
 try{
  const source=scenarioSource(project);if(!source)return [];const original=source.sourceProject||source.project;
  if(JSON.stringify(project.budgetLimits??[])!==JSON.stringify(original.budgetLimits??[]))throw Error('Entered budget limits are fixed for this scenario. Return to the source budget to update terms.');
  for(const key of ['ledger','subPays','importBatches','statements','invoiceReviews','allocationImports'])if(JSON.stringify(project[key]??[])!==JSON.stringify(original[key]??[]))throw Error('Actual transactions and source history are read-only in a scenario. Return to the source budget to update actuals.');
  for(const key of ['asOf','start','mode','source'])if(project.grant[key]!==original.grant[key])throw Error('The actuals cutoff and source are fixed for this scenario. Return to the source budget to change them.');
  if(JSON.stringify(project.postedFa??{})!==JSON.stringify(original.postedFa??{}))throw Error('Posted F&A is read-only in a scenario.');
  const protectedEnd=original.grant.asOf<original.grant.end?original.grant.asOf:original.grant.end;if(project.grant.end<protectedEnd)throw Error('The project end cannot exclude recorded actuals in a scenario.');
  // A forecast-only change must not reprice any historical category or estimated F&A.
  const history=value=>{const result=E.calculate(value);return result.months.filter(m=>m<=value.grant.asOf).map(m=>({month:m,categories:Object.fromEntries(Object.entries(result.act).map(([cat,amounts])=>[cat,amounts[m]])),fa:result.fa.actual[m]}));};
  if(JSON.stringify(history(project))!==JSON.stringify(history(original)))throw Error('This change would recalculate historical actuals. Use a future effective date or return to the source budget.');
  return [];
 }catch(e){return [{level:'error',message:e.message}]}
}
export function validateScenarioBaseline(project,baseline){
 const source=scenarioSource(project);if(!source)return;
 if(JSON.stringify(clean(baseline))!==JSON.stringify(clean(source.sourceBaseline||source.baseline)))throw Error('The comparison baseline is fixed for this scenario. Return to the source budget to change it.');
}
export function returnToSource(project){
 const source=scenarioSource(project);if(!source)throw Error('No active scenario.');
 const target=returnContext(project);
 return {project:{...clean(target.project),savedScenarios:clone(project.savedScenarios)},baseline:clean(target.baseline),scenario:'Working budget'};
}
