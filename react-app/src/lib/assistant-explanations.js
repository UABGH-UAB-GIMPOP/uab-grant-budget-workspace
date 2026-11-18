const money=value=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(value);
/** Return only engine-grounded text; no model prose or arithmetic enters the answer. */
export function explainOverallRemaining(question,summary){
 if(!/\bwhy\b|\bhow\b|\bexplain\b/i.test(question))return '';
 const categories=(summary?.categories||[]).filter(row=>row.c!=='Total direct costs'&&Number.isFinite(row.variance));
 const over=categories.filter(row=>row.variance<0),under=categories.filter(row=>row.variance>0),remaining=summary?.totals?.variance;
 if(!over.length||!under.length||!Number.isFinite(remaining)||remaining<=0)return '';
 const overText=over.map(row=>`${row.c} is over plan by ${money(-row.variance)}`).join(', ');
 const room=under.reduce((sum,row)=>sum+row.variance,0),roomText=under.map(row=>`${row.c} ${money(row.variance)}`).join(', ');
 return `Projected remaining is planned budget minus projected costs across all categories. ${overText}, while other categories have ${money(room)} of combined projected room (${roomText}). That leaves ${money(remaining)} overall. A positive overall balance does not make an over-budget category available.`;
}
