import React,{useState,useRef,useEffect} from 'react';
import {Select,SelectTrigger,SelectValue,SelectContent,SelectItem} from './ui/select';
export function OptionalFormSelect({name,label,children,defaultValue=undefined}){
 const options=React.Children.toArray(children).filter(React.isValidElement).map((child:any)=>({value:String(child.props.value??child.props.children),label:child.props.children}));
 const initial=defaultValue===undefined?options[0]?.value??'':String(defaultValue),[value,setValue]=useState(initial),input=useRef<HTMLInputElement>(null);
 useEffect(()=>{const form=input.current?.form;if(!form)return;const reset=()=>setValue(initial);form.addEventListener('reset',reset);return()=>form.removeEventListener('reset',reset)},[initial]);
 return <><input ref={input} type="hidden" name={name} value={value}/><Select value={'value:'+value} onValueChange={next=>setValue(next.slice(6))}><SelectTrigger aria-label={label}><SelectValue/></SelectTrigger><SelectContent>{options.map(option=><SelectItem key={option.value} value={'value:'+option.value}>{option.label}</SelectItem>)}</SelectContent></Select></>;
}
