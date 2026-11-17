// One active import owns the UI. Late file reads/digests cannot reopen a canceled
// dialog or replace a different working archive, baseline, or scenario.
export function createImportSession(readArchive){
 let active=null;
 return {
  begin(){active={snapshot:JSON.stringify(readArchive())};return active;},
  isActive(token){return active===token;},
  check(token){if(active!==token)throw Error('Import canceled or superseded.');if(JSON.stringify(readArchive())!==token.snapshot)throw Error('Budget or comparison changed; review the import again.');},
  cancel(){active=null;}
 };
}
