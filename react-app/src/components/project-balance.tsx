import React from 'react';
import {thresholdStatus} from '../lib/display-preferences';

// The threshold applies to this award's entire budget, not category or portfolio totals.
export function ProjectBalance({calculation,mode,highlighting=true,threshold=null}){
 const {total,forecastIncomplete}=calculation;
 const caution=mode!=='proposal'&&!forecastIncomplete?thresholdStatus(total.variance,total.plan,threshold):null;
 const negative=!forecastIncomplete&&total.variance<0;
 return <><div className={'balance '+(negative&&highlighting?'negative':'')}>
 {forecastIncomplete?'Incomplete':new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(total.variance)}
 </div><p className={caution?'financial-caution financial-warning project-balance-status':undefined}>
 {forecastIncomplete?'Unpaid obligations extend beyond the project period. Review payment dates.':caution|| (negative?'Projected overspend':'Projected remaining')}
 </p></>;
}
