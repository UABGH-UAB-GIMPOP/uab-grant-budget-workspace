import React,{useEffect,useState} from 'react';
import {PILOT_ORIGIN} from './budget-assistant';

type State={status:'checking'|'verified'|'signed-out'|'failed';email?:string};
export function PilotIdentity({fetchImpl=globalThis.fetch||(()=>Promise.reject(Error('Fetch unavailable'))),origin=typeof window!=='undefined'?window.location.origin:''}:{fetchImpl?:typeof fetch;origin?:string}){
 const [state,setState]=useState<State>({status:'checking'});
 useEffect(()=>{
  const controller=new AbortController();let loggedOut=false;
  const logout=()=>{loggedOut=true;controller.abort();setState({status:'signed-out'})};
  window.addEventListener('budget-assistant:logout',logout);
  if(origin!==PILOT_ORIGIN){setState({status:'failed'});return()=>{controller.abort();window.removeEventListener('budget-assistant:logout',logout)}}
  fetchImpl('/api/pilot-info',{credentials:'same-origin',redirect:'error',cache:'no-store',signal:controller.signal})
   .then(async response=>{if(response.status===401||response.status===403){if(!loggedOut)setState({status:'signed-out'});return null}if(!response.ok)throw Error();return response.json()})
   .then(info=>{if(loggedOut||controller.signal.aborted||!info)return;if(info.syntheticOnly!==true||typeof info.engine!=='string'||!/^[-\w.+]+@uab\.edu$/i.test(info.identity?.email||''))throw Error();setState({status:'verified',email:info.identity.email})})
   .catch(()=>{if(!loggedOut&&!controller.signal.aborted)setState({status:'failed'})});
  return()=>{controller.abort();window.removeEventListener('budget-assistant:logout',logout)}
 },[fetchImpl,origin]);
 const label=state.status==='checking'?'Checking sign-in…':state.status==='verified'?state.email:state.status==='signed-out'?'Sign-in required':'Sign-in could not be verified';
 return <aside className="pilot-identity" aria-label="Account identity">
  <div className="pilot-identity-label">{state.status==='verified'?'Signed in as':'Account'}</div>
  <div className="pilot-identity-value" role="status" aria-live="polite">{label}</div>
  {state.status==='verified'&&<a className="pilot-logout" href={`${PILOT_ORIGIN}/cdn-cgi/access/logout`} onClick={()=>window.dispatchEvent(new Event('budget-assistant:logout'))}>Sign out</a>}
 </aside>;
}
