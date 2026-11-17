const clone=value=>JSON.parse(JSON.stringify(value));
// A draft never writes storage. The caller supplies the existing validated,
// compare-and-swap archive writer only at explicit Save.
export function createEditSession(){
 let session=null;
 return {
  get active(){return session!==null},
  begin(archive){if(session)throw Error('Finish the current edit first.');session={original:clone(archive),draft:clone(archive)};return clone(session.draft)},
  update(change,validate){if(!session)throw Error('Choose Edit before changing the budget.');const next=clone(session.draft);change(next);const issues=validate(next.project).filter(x=>x.level==='error');if(issues.length)throw Error(issues.map(x=>x.message).join(' '));session.draft=next;return clone(next)},
  snapshot(){return session?clone(session.draft):null},
  cancel(){if(!session)return null;const original=clone(session.original);session=null;return original},
  save(write){if(!session)throw Error('There are no edits to save.');const current=session;const result=write(clone(current.draft),clone(current.original));if(result===false)throw Error('Changes were not saved.');session=null;return result},
 };
}
