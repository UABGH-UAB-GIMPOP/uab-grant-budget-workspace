import {ScrollableTable} from './scrollable-table';
import React,{useState,useRef,useLayoutEffect} from 'react';
import {Button} from './ui/button';
import {Pin,PinOff,Table2} from 'lucide-react';
const money=(value:number|null)=>value==null?'Not reported':new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(value);
export function SpendingChart({c}){
 const [selected,setSelected]=useState<number|null>(null);
 const [pinned,setPinned]=useState(false);
 const [showData,setShowData]=useState(false);
 const svgRef=useRef<SVGSVGElement>(null);
 const [tooltipX,setTooltipX]=useState(96);
 const w=640,h=270,p=52,last=c.months.length-1;
 const max=Math.max(1,...c.curve.plan,...c.curve.projected,...c.curve.actual.filter(v=>v!=null));
 const x=(i:number)=>p+i*(w-p-15)/(last||1),y=(v:number)=>h-45-v/max*(h-65);
 const path=(values:any[])=>values.map((v,i)=>v==null?'':`${i===0||values[i-1]==null?'M':'L'}${x(i)},${y(v)}`).join(' ');
 const active=Math.min(last,selected??Math.max(0,c.elapsed-1));
 const month=(i:number)=>new Date(c.months[i]+'-02T12:00:00').toLocaleDateString('en-US',{month:'short',year:'numeric'});
 useLayoutEffect(()=>{
  const svg=svgRef.current;if(!svg||typeof svg.getScreenCTM!=='function'||typeof ResizeObserver==='undefined')return;
  const update=()=>{const matrix=svg.getScreenCTM();if(!matrix)return;const point=svg.createSVGPoint();point.x=x(active);point.y=0;setTooltipX(point.matrixTransform(matrix).x-svg.parentElement!.getBoundingClientRect().left)};
  update();const observer=new ResizeObserver(update);observer.observe(svg);return()=>observer.disconnect();
 },[active,last]);
 const choose=(event:React.PointerEvent<SVGSVGElement>)=>{
  const svg=event.currentTarget,matrix=svg.getScreenCTM();if(!matrix)return;
  const point=svg.createSVGPoint();point.x=event.clientX;point.y=event.clientY;
  const position=point.matrixTransform(matrix.inverse()).x;
  setSelected(Math.max(0,Math.min(last,Math.round((position-p)/(w-p-15)*(last||1)))));
 };
 const text=`${month(active)}. Budget ${money(c.curve.plan[active])}. Actual ${money(c.curve.actual[active])}. Forecast ${money(c.curve.projected[active])}.`;
 return <div className="spending-chart"><div className="chart-key"><span>— Budget</span><span className="green">— Actual</span><span className="blue">┄ Forecast</span></div>
 <div className="chart-plot"><svg ref={svgRef} className="chart" tabIndex={0} onKeyDown={e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();setSelected(Math.max(0,Math.min(last,active+(e.key==='ArrowRight'?1:-1))))}else if(e.key==='Home'){e.preventDefault();setSelected(0)}else if(e.key==='End'){e.preventDefault();setSelected(last)}else if(e.key==='Escape'){setPinned(false)}else if(e.key==='Enter'||e.key===' '){e.preventDefault();setPinned(v=>!v)}}} viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Cumulative budget, actual expenditure and forecast" onPointerMove={e=>{if(!pinned&&e.pointerType!=='touch')choose(e)}} onPointerDown={e=>{choose(e);setPinned(true)}}>
 <title>Spending over time</title>{[0,1,2,3,4].map(i=><g key={i}><line x1={p} x2={w-15} y1={y(max*i/4)} y2={y(max*i/4)} stroke="#d9e2dc"/><text x={p-6} y={y(max*i/4)+4} textAnchor="end">{Math.round(max*i/4000)}k</text></g>)}
 <path d={path(c.curve.plan)} fill="none" stroke="#84998e" strokeWidth="2"/><path d={path(c.curve.projected)} fill="none" stroke="#246a8a" strokeWidth="3" strokeDasharray="6 4"/><path d={path(c.curve.actual)} fill="none" stroke="#006341" strokeWidth="3"/>
 <line x1={x(active)} x2={x(active)} y1={20} y2={h-45} stroke="#17352a" strokeDasharray="2 3"/>{[['plan','#84998e'],['actual','#006341'],['projected','#246a8a']].map(([key,color])=>c.curve[key][active]!=null&&<circle key={key} cx={x(active)} cy={y(c.curve[key][active])} r={4} fill={color} stroke="white" strokeWidth={2}/>)}
 <text x={p} y={h-8}>{month(0)}</text><text x={w-15} y={h-8} textAnchor="end">{month(last)}</text></svg><div className="chart-tooltip" style={{left:`clamp(96px, ${tooltipX}px, calc(100% - 96px))`}}><strong>{month(active)}</strong><span>Actual <b>{money(c.curve.actual[active])}</b></span><span>Forecast <b>{money(c.curve.projected[active])}</b></span></div></div><div className="chart-controls"><span>Hover to explore · tap to pin</span><Button variant="ghost" aria-pressed={pinned} onClick={()=>setPinned(v=>!v)}>{pinned?<PinOff size={16}/>:<Pin size={16}/>} {pinned?'Unpin month':'Pin month'}</Button><Button variant="ghost" aria-expanded={showData} onClick={()=>setShowData(v=>!v)}><Table2 size={16}/>{showData?'Hide data':'View data'}</Button></div>
 <label className="chart-month">Explore month<input type="range" min={0} max={last} step={1} value={active} aria-label="Chart month" aria-valuetext={text} onChange={e=>setSelected(Number(e.target.value))}/></label>
 <div className="chart-readout"><strong>{month(active)}</strong><dl>{[['Budget',c.curve.plan[active]],['Actual',c.curve.actual[active]],['Forecast',c.curve.projected[active]],['Budget − forecast',c.curve.plan[active]-c.curve.projected[active]]].map(([label,value])=><div key={String(label)}><dt>{label}</dt><dd>{money(value as number)}</dd></div>)}</dl></div>{showData&&<ScrollableTable label="Spending chart data" className="chart-data"><table><caption className="sr-only">Cumulative budget, actual spending and forecast by month</caption><thead><tr><th>Month</th><th>Budget</th><th>Actual</th><th>Forecast</th></tr></thead><tbody>{c.months.map((_,i)=><tr key={i}><th scope="row">{month(i)}</th><td>{money(c.curve.plan[i])}</td><td>{money(c.curve.actual[i])}</td><td>{money(c.curve.projected[i])}</td></tr>)}</tbody></table></ScrollableTable>}</div>;
}
