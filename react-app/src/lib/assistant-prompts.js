const known=['Personnel','Supplies','Travel','Other','Equipment','Patient care','Tuition','Participant support','Consultants','Consortium/Contractual (Subawards)'];
export function suggestedAssistantQuestions(project){
 if(!project||typeof project!=='object')return ['Summarize this saved budget','Which budget categories have the largest projected gaps?'];
 const categories=new Set();
 if(Array.isArray(project.people)&&project.people.length)categories.add('Personnel');
 for(const [category,amounts] of Object.entries(project.planned||{}))if(known.includes(category)&&Array.isArray(amounts)&&amounts.length)categories.add(category);
 for(const row of [...(project.ledger||[]),...(project.costs||[])])if(known.includes(row?.cat))categories.add(row.cat);
 if(Array.isArray(project.supplies)&&project.supplies.length)categories.add('Supplies');
 if(Array.isArray(project.subawards)&&project.subawards.length)categories.add('Consortium/Contractual (Subawards)');
 const first=[...categories][0];
 const questions=['Summarize this saved budget','Which budget categories have the lowest projected remaining balance?'];
 if(first)questions.push(`What should I review in the ${first} budget?`);
 const adjustable=['Travel','Other'].find(category=>categories.has(category)||project.assume?.[category]!=null);
 if(adjustable){
  const explicit=project.assume?.[adjustable],rows=(project.ledger||[]).filter(row=>row?.cat===adjustable&&row.month<=project.grant?.asOf&&Number.isFinite(Number(row.amount)));
  const months=new Set(rows.map(row=>row.month));const historical=months.size?rows.reduce((sum,row)=>sum+Number(row.amount),0)/months.size:0;
  const base=explicit!==null&&explicit!==undefined&&Number.isFinite(Number(explicit))?Number(explicit):historical;
  const amount=Math.max(100,Math.round((base+100)/100)*100);
  questions.push(`What if monthly ${adjustable} were $${amount.toLocaleString('en-US')}?`);
 }
 return questions;
}
