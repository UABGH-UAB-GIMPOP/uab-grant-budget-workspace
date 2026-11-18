import React from 'react';
import {Select,SelectTrigger,SelectValue,SelectContent,SelectItem} from './ui/select';
export function FilterSelect({label,value,options,onChange,disabled=false}:{label:string;value:string;options:{value:string;label:string}[];onChange:(value:string)=>void;disabled?:boolean}){
 return <label className="filter-select"><span>{label}</span><Select disabled={disabled} value={'value:'+value} onValueChange={next=>onChange(next.slice(6))}><SelectTrigger aria-label={label}><SelectValue/></SelectTrigger><SelectContent>{options.map(option=><SelectItem key={option.value} value={'value:'+option.value}>{option.label}</SelectItem>)}</SelectContent></Select></label>;
}
