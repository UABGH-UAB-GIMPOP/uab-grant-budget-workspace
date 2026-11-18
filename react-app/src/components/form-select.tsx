import React from 'react';
import {Select,SelectTrigger,SelectValue,SelectContent,SelectItem} from './ui/select';
export function FormSelect({name,label,children,disabled=false,defaultValue=undefined}){
 const options=React.Children.toArray(children).filter(React.isValidElement).map((child:any)=>({value:String(child.props.value??child.props.children),label:child.props.children}));
 return <Select name={name} disabled={disabled||!options.length} defaultValue={defaultValue??options[0]?.value}><SelectTrigger aria-label={label}><SelectValue placeholder="Choose an option"/></SelectTrigger><SelectContent>{options.map(option=><SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select>;
}
