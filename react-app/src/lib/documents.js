export const DOCUMENT_CATEGORIES=['Award terms','Budget','Report','Correspondence','Other'];
export function validateDocuments(items){
 if(items===undefined)return [];const error=()=>[{level:'error',message:'Documents require unique IDs, a title, an HTTPS link without credentials, a valid category and archive status.'}];
 if(!Array.isArray(items)||items.length>500)return error();const ids=new Set();
 for(const d of items){if(!d||typeof d.id!=='string'||!d.id.trim()||d.id.length>200||ids.has(d.id)||typeof d.title!=='string'||!d.title.trim()||d.title!==d.title.trim()||d.title.length>200||typeof d.url!=='string'||d.url.length>2048||d.url!==d.url.trim()||!DOCUMENT_CATEGORIES.includes(d.category)||typeof d.archived!=='boolean'||d.note!==undefined&&(typeof d.note!=='string'||d.note.length>1000))return error();try{const u=new URL(d.url);if(u.protocol!=='https:'||u.username||u.password)return error()}catch{return error()}ids.add(d.id)}return [];
}
