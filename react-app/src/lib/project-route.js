const ID=/^[A-Za-z0-9_-]{1,120}$/;
export function projectHash(id){if(id===null)return '#/grants';if(!ID.test(id))throw Error('Invalid project link.');return '#/grants/'+id;}
export function resolveProjectHash(hash,portfolio){
 if(!hash||hash==='#/grants')return {id:null,error:null};
 const match=/^#\/grants\/([A-Za-z0-9_-]{1,120})$/.exec(hash);
 if(!match)return {id:null,error:'This project link is not valid.'};
 const item=portfolio?.projects.find(p=>p.id===match[1]&&!p.archived);
 return item?{id:item.id,error:null}:{id:null,error:'This project is not available in this browser. It may be archived or stored on another device.'};
}
