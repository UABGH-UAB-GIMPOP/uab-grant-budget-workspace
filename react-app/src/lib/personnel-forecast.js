import E from './engine.js';
export function personnelForecast(project,calculation){
 const months=calculation.months.filter(m=>E.mi(m)>calculation.asOf);
 return project.people.map(person=>{
  const monthly=months.map(month=>({month,...E.person(project,person,month)}));
  const total=key=>E.usd(monthly.reduce((n,row)=>n+E.cents(row[key]),0));
  return {id:person.id,name:person.name,start:months[0]||null,end:months.at(-1)||null,months:months.length,salary:total('salary'),charged:total('charged'),excess:total('excess'),fringe:total('fringe'),cost:total('cost'),monthly};
 });
}
