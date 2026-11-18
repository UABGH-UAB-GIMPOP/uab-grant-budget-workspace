// One bounded parsing task per worker. Cancellation/timeout terminates the parser.
export function inspectWorkbookTask(bytes,{signal=null,timeoutMs=15000,createWorker=()=>new Worker(new URL('./workbook-worker.js',import.meta.url),{type:'module'})}={}){
 if(!(bytes instanceof Uint8Array)||bytes.byteLength>10*1024*1024)return Promise.reject(Error('Choose an XLSX workbook no larger than 10 MiB.'));
 if(!Number.isSafeInteger(timeoutMs)||timeoutMs<1||timeoutMs>60000)return Promise.reject(Error('Invalid workbook timeout.'));
 const cancelled=()=>Object.assign(Error('Workbook import cancelled.'),{name:'AbortError'});
 if(signal?.aborted)return Promise.reject(cancelled());
 return new Promise((resolve,reject)=>{
  let worker,timer,settled=false;
  const finish=(error,result)=>{
   if(settled)return;
   settled=true;clearTimeout(timer);signal?.removeEventListener('abort',abort);
   // Detach callbacks as well as terminating: a late queued event must never apply
   // a result after the owner has cancelled or the resource deadline has elapsed.
   if(worker){worker.onmessage=null;worker.onerror=null;worker.onmessageerror=null;worker.terminate();}
   error?reject(error):resolve(result);
  };
  const abort=()=>finish(cancelled());
  try{
   worker=createWorker();
   worker.onmessage=event=>{if(event.data?.id!==1)return;event.data.error?finish(Error(event.data.error)):finish(null,event.data.result);};
   worker.onerror=()=>finish(Error('Unable to read workbook. Try a values-only XLSX file.'));
   worker.onmessageerror=()=>finish(Error('Unable to receive workbook data. Try a smaller values-only XLSX file.'));
   signal?.addEventListener('abort',abort,{once:true});
   // A caller/worker factory can cancel between the initial check and subscription.
   if(signal?.aborted){abort();return;}
   timer=setTimeout(()=>finish(Error('Workbook reading timed out. Use a smaller workbook.')),timeoutMs);
   const copy=bytes.slice();worker.postMessage({id:1,bytes:copy},[copy.buffer]);
  }catch(error){finish(error);}
 });
}
