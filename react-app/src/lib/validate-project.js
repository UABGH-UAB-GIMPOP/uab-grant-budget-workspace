import {validateAllocationImports} from './allocation-history.js';
import {validateInvoiceReviews} from './invoice-dispositions.js';
import {calculateBudgetLimits,validateBudgetLimits} from './budget-limits.js';
import {validateDocuments} from './documents.js';
import {validateMilestones} from './milestones.js';
import {validateScenarioActuals} from './scenarios.js';
import {validateReversals} from './reversal.js';
import {validateStatements} from './reconciliation.js';
import E from './engine.js';
export function validateProject(project,limitSourceProject=undefined) {
 let issues;try{issues=E.validate(project)}catch(error){return [{level:'error',message:error.message}];}
 if(issues.some(x=>x.level==='error'))return issues;
 if(project.scenarioReturn!==undefined){
  const target=project.scenarioReturn;
  const invalid=value=>!value||typeof value!=='object'||Array.isArray(value)||['savedScenarios','activeScenarioId','scenarioReturn'].some(key=>Object.hasOwn(value,key));
  if(!project.activeScenarioId||!target||invalid(target.project)||invalid(target.baseline))issues.push({level:'error',message:'Invalid scenario return budget.'});
  else issues.push(...validateProject(target.project),...validateProject(target.baseline));
 }
 if(project?.savedScenarios!==undefined){
  if(!Array.isArray(project.savedScenarios))issues.push({level:'error',message:'Saved scenarios must be a list.'});
  else {const ids=new Set();for(const snapshot of project.savedScenarios){
   if(!snapshot||typeof snapshot.id!=='string'||!snapshot.id.trim()||ids.has(snapshot.id)||typeof snapshot.name!=='string'||!snapshot.name.trim()||snapshot.name.length>120||typeof snapshot.at!=='string'||!Number.isFinite(Date.parse(snapshot.at))||!snapshot.project||!snapshot.baseline||snapshot.project.savedScenarios||snapshot.baseline.savedScenarios||snapshot.project.scenarioReturn||snapshot.baseline.scenarioReturn)issues.push({level:'error',message:'Invalid saved scenario.'});
   else {ids.add(snapshot.id);issues.push(...validateProject(snapshot.project,snapshot.sourceProject),...validateProject(snapshot.baseline,snapshot.sourceBaseline));
    if(snapshot.sourceProject!==undefined||snapshot.sourceBaseline!==undefined){
     if(!snapshot.sourceProject||!snapshot.sourceBaseline||snapshot.sourceProject.savedScenarios||snapshot.sourceProject.activeScenarioId||snapshot.sourceBaseline.savedScenarios||snapshot.sourceBaseline.activeScenarioId||snapshot.sourceProject.scenarioReturn||snapshot.sourceBaseline.scenarioReturn)issues.push({level:'error',message:'Invalid scenario source snapshot.'});
     else issues.push(...validateProject(snapshot.sourceProject),...validateProject(snapshot.sourceBaseline));
    }
   }
  }}
 }
 if(project.audit!==undefined){
  if(!Array.isArray(project.audit))issues.push({level:'error',message:'Change history must be a list.'});
  else for(const entry of project.audit){
   if(!entry||typeof entry.action!=='string'||!entry.action.trim()||typeof entry.at!=='string'||!Number.isFinite(Date.parse(entry.at))||(entry.changes!==undefined&&(!Array.isArray(entry.changes)||entry.changes.some(c=>!c||typeof c.field!=='string'||(c.id!==undefined&&typeof c.id!=='string')))))issues.push({level:'error',message:'Invalid change-history record.'});
  }
 }
 if(limitSourceProject&&JSON.stringify(project.budgetLimits??[])!==JSON.stringify(limitSourceProject.budgetLimits??[]))issues.push({level:'error',message:'Saved scenario budget limits do not match its preserved source terms.'});
 const result=[...issues,...validateAllocationImports(project),...validateInvoiceReviews(project),...validateBudgetLimits(project,{scopeGrant:limitSourceProject?.grant}),...validateDocuments(project.documents),...validateMilestones(project.milestones),...validateStatements(project),...validateReversals(project),...validateScenarioActuals(project)];
 if(!result.some(issue=>issue.level==='error')&&project.budgetLimits?.length)try{calculateBudgetLimits(project,{scopeGrant:limitSourceProject?.grant})}catch(error){result.push({level:'error',message:error.message})}
 return result;
}
