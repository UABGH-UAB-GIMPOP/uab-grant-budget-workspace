export const SUPPLY_CLASSIFICATIONS=Object.freeze([
 {value:'unknown',label:'Unknown'},
 {value:'consumable',label:'Consumable'},
 {value:'equipment',label:'Equipment'},
 {value:'participant-support',label:'Participant support'},
 {value:'other',label:'Other'},
]);
export const SUPPLY_ELIGIBILITY_REVIEWS=Object.freeze([
 {value:'unknown',label:'Not reviewed'},
 {value:'needs-review',label:'Needs review'},
 {value:'user-marked-eligible',label:'User marked eligible'},
 {value:'user-marked-ineligible',label:'User marked ineligible'},
]);
export const supplyClassificationLabel=value=>SUPPLY_CLASSIFICATIONS.find(option=>option.value===value)?.label??'Unknown';
export const supplyEligibilityReviewLabel=value=>SUPPLY_ELIGIBILITY_REVIEWS.find(option=>option.value===value)?.label??'Not reviewed';
export function validateSupplyPlanning(row){
 const issues=[];
 if(row.classification!==undefined&&(typeof row.classification!=='string'||!SUPPLY_CLASSIFICATIONS.some(option=>option.value===row.classification)))issues.push('Supply classification must be selected from the supported planning values.');
 if(row.eligibilityReview!==undefined&&(typeof row.eligibilityReview!=='string'||!SUPPLY_ELIGIBILITY_REVIEWS.some(option=>option.value===row.eligibilityReview)))issues.push('Supply eligibility review must be selected from the supported planning values.');
 for(const [field,label] of [['eligibilitySource','Eligibility source'],['eligibilityNote','Eligibility review notes']])if(row[field]!==undefined&&(typeof row[field]!=='string'||row[field].length>2000))issues.push(`${label} must be text of at most 2,000 characters.`);
 return issues;
}
