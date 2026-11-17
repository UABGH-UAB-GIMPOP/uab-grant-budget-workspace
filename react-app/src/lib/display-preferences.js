export const DISPLAY_KEY='uab-grant-display-v1';
export function loadHighlighting(storage){try{return JSON.parse(storage.getItem(DISPLAY_KEY)||'null')?.highlighting!==false}catch{return true}}
export function saveHighlighting(storage,enabled){storage.setItem(DISPLAY_KEY,JSON.stringify({highlighting:enabled}));}
export function remainingStatus(amount){return typeof amount==='number'&&Number.isFinite(amount)&&amount<0?'Projected overspend':null;}
