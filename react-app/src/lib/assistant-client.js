// Cloudflare Access session is an HttpOnly cookie. Never read/store an auth token in JavaScript.
export function createSameOriginAssistantClient(fetchImpl=fetch){let pending;return{cancel(){pending?.abort()},async ask({question,projectId,revision,snapshot,syntheticOnly,conversation=[]}){pending?.abort();const c=new AbortController();pending=c;const body=JSON.stringify({question,projectId,revision,snapshot,syntheticOnly,conversation});if(new TextEncoder().encode(body).byteLength>262144)throw Error('This saved project is too large for the protected AI preview.');const r=await fetchImpl('/api/budget-assistant',{method:'POST',credentials:'same-origin',redirect:'error',headers:{'Content-Type':'application/json'},body,signal:c.signal});if(!r.ok)throw Error(r.status===409?'Saved budget changed. Close and reopen the assistant.':'Assistant unavailable or sign-in expired. You can retry; no budget was changed.');const x=await r.json();if(pending!==c||c.signal.aborted||x.projectId!==projectId||x.revision!==revision)throw Error('Stale response');return x;}}}
export function validateAssistantResponse(x,scope){
 const bad=()=>{throw Error('Assistant returned an invalid or stale result. No budget changed.');};
 if(x?.projectId!==scope.projectId||x?.revision!==scope.revision)bad();
 if(x.kind==='clarification'){if(x.reason!==undefined&&x.reason!=='unsupported-scenario')bad();return x;}
 if(x.kind!=='result'||!['budget_summary','budget_issues','scenario_preview'].includes(x.tool)||!x.result)bad();
 if(x.answer!==undefined&&(typeof x.answer!=='string'||!x.answer.trim()||x.answer.length>1200))bad();
 const source=(s,{requestHash=true}={})=>{if(s?.projectId!==scope.projectId||s?.revision!==scope.revision||s?.engine!==scope.engine||typeof s?.snapshotHash!=='string'||!/^[a-f0-9]{64}$/.test(s.snapshotHash)||(requestHash&&s.snapshotHash!==scope.revision)||!/^\d{4}-\d{2}$/.test(s.knownThrough))bad();};
 const summary=(r,options)=>{source(r?.source,options);if(!r?.totals||!['plan','actual','proj','variance'].every(k=>Number.isFinite(r.totals[k]))||!Array.isArray(r.categories)||!r.categories.every(c=>typeof c.c==='string'&&['plan','actual','proj','variance'].every(k=>Number.isFinite(c[k]))))bad();};
 if(x.tool==='budget_summary')summary(x.result);
 if(x.tool==='budget_issues'){source(x.result.source);if(!Array.isArray(x.result.flags)||!x.result.flags.every(f=>typeof f.code==='string'&&(f.amountCents===undefined||Number.isSafeInteger(f.amountCents))))bad();}
 if(x.tool==='scenario_preview'){source(x.result.requestSource);summary(x.result.before);summary(x.result.after,{requestHash:false});if(x.result.previewOnly!==true||x.result.baselineUnchanged!==true||!Number.isSafeInteger(x.result.deltaCents))bad();}
 return x;
}
