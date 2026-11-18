import React,{useEffect,useState} from 'react';
import {DISPLAY_KEY,loadHighlighting,remainingStatus,loadRemainingThreshold,thresholdStatus} from '../lib/display-preferences';
const browserPreferenceStorage={getItem(key){return typeof window==='undefined'?null:window.localStorage.getItem(key)}};
export function useFinancialHighlighting(storage=browserPreferenceStorage){
 const [enabled,setEnabled]=useState(()=>loadHighlighting(storage));
 useEffect(()=>{setEnabled(loadHighlighting(storage));const refresh=e=>{if(e.key===DISPLAY_KEY||e.key===null)setEnabled(loadHighlighting(storage))};window.addEventListener('storage',refresh);return()=>window.removeEventListener('storage',refresh)},[storage]);
 return enabled;
}
export function useRemainingThreshold(storage=browserPreferenceStorage){
 const [threshold,setThreshold]=useState(()=>loadRemainingThreshold(storage));
 useEffect(()=>{setThreshold(loadRemainingThreshold(storage));const refresh=e=>{if(e.key===DISPLAY_KEY||e.key===null)setThreshold(loadRemainingThreshold(storage))};window.addEventListener('storage',refresh);return()=>window.removeEventListener('storage',refresh)},[storage]);return threshold;
}
export function FinancialAmount({value,highlighting=true,budget=undefined,threshold=null}){
 const negative=!!remainingStatus(value),amber=thresholdStatus(value,budget,threshold);
 return <span className={negative&&highlighting?'negative financial-warning':amber?'financial-caution financial-warning':'financial-amount'}>{new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(value)}{amber&&<span className="financial-status">{amber}</span>}{negative&&<span className="financial-status">Projected overspending</span>}</span>;
}
