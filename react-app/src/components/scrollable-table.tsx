import React,{useEffect,useId,useRef,useState} from 'react';
import {ChevronLeft,ChevronRight} from 'lucide-react';
import {Button} from './ui/button';
export function ScrollableTable({label,className='',children}){
 const ref=useRef<HTMLDivElement>(null),id=useId();
 const [position,setPosition]=useState({overflow:false,left:false,right:false});
 useEffect(()=>{
  const el=ref.current;if(!el)return;
  const measure=()=>{const max=el.scrollWidth-el.clientWidth;const next={overflow:max>2,left:el.scrollLeft>2,right:el.scrollLeft<max-2};setPosition(old=>old.overflow===next.overflow&&old.left===next.left&&old.right===next.right?old:next)};
  measure();el.addEventListener('scroll',measure,{passive:true});window.addEventListener('resize',measure);
  const observer=typeof ResizeObserver==='undefined'?null:new ResizeObserver(measure);observer?.observe(el);if(el.firstElementChild)observer?.observe(el.firstElementChild);
  return ()=>{el.removeEventListener('scroll',measure);window.removeEventListener('resize',measure);observer?.disconnect()};
 },[children]);
 const move=(direction:number)=>{const el=ref.current;if(el)el.scrollBy({left:direction*Math.max(160,el.clientWidth*0.75),behavior:'auto'})};
 return <div className="table-frame">{position.overflow&&<div className="table-navigation"><span>More columns</span><div><Button variant="outline" size="sm" aria-label={`Scroll ${label} left`} aria-controls={id} disabled={!position.left} onClick={()=>move(-1)}><ChevronLeft size={16}/></Button><Button variant="outline" size="sm" aria-label={`Scroll ${label} right`} aria-controls={id} disabled={!position.right} onClick={()=>move(1)}><ChevronRight size={16}/></Button></div></div>}<div ref={ref} id={id} className={'table-scroll'+(className?' '+className:'')} role="region" aria-label={label} tabIndex={0}>{children}</div></div>;
}
