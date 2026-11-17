import {validateMilestones} from './milestones.js';
import {validateScenarioActuals} from './scenarios.js';
import {validateReversals} from './reversal.js';
import {validateStatements} from './reconciliation.js';
import E from './engine.js';
export function validateProject(project) {
 const issues=E.validate(project);
 if(issues.some(x=>x.level==='error'))return issues;
 if(project?.savedScenarios!==undefined){
  if(!Array.isArray(project.savedScenarios))issues.push({level:'error',message:'Saved scenarios must be a list.'});
  else {const ids=new Set();for(const snapshot of project.savedScenarios){
   if(!snapshot||typeof snapshot.id!=='string'||!snapshot.id.trim()||ids.has(snapshot.id)||typeof snapshot.name!=='string'||!snapshot.name.trim()||snapshot.name.length>120||typeof snapshot.at!=='string'||!Number.isFinite(Date.parse(snapshot.at))||!snapshot.project||!snapshot.baseline||snapshot.project.savedScenarios||snapshot.baseline.savedScenarios)issues.push({level:'error',message:'Invalid saved scenario.'});
   else {ids.add(snapshot.id);issues.push(...validateProject(snapshot.project),...validateProject(snapshot.baseline));
    if(snapshot.sourceProject!==undefined||snapshot.sourceBaseline!==undefined){
     if(!snapshot.sourceProject||!snapshot.sourceBaseline||snapshot.sourceProject.savedScenarios||snapshot.sourceProject.activeScenarioId||snapshot.sourceBaseline.savedScenarios||snapshot.sourceBaseline.activeScenarioId)issues.push({level:'error',message:'Invalid scenario source snapshot.'});
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
 return [...issues,...validateMilestones(project.milestones),...validateStatements(project),...validateReversals(project),...validateScenarioActuals(project)];
}
