import LZString from 'lz-string';
import {validateScenarioBaseline} from './scenarios.js';
import {ensureCostIds} from './record-ids.js';
export function normalizeArchive(value, validate) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error('Invalid project file.');
  const project = ensureCostIds(value.project ?? value);
  const baseline = ensureCostIds(value.project ? (value.baseline ?? project) : project);
  const scenario = value.project ? (value.scenario ?? 'Working budget') : 'Working budget';
  if (typeof scenario !== 'string' || !scenario.trim() || scenario.length > 120) throw Error('Invalid scenario name.');
  for (const item of [project, baseline]) {
    const errors = validate(item).filter(x => x.level === 'error');
    if (errors.length) throw Error(errors.map(x => x.message).join(' '));
  }
  validateScenarioBaseline(project,baseline);
  return JSON.parse(JSON.stringify({project, baseline, scenario}));
}
export function loadArchive(storage, key, fresh, validate) {
  let raw = null;
  try {
    raw = storage.getItem(key);
    return raw === null ? {project:fresh(),raw:null} : {...normalizeArchive(decodeStoredArchive(raw), validate),raw};
  } catch (error) {
    return {project:fresh(), recovery:true, raw, message:error.message};
  }
}
function packArrays(value){
 const chunks=[],refs=[],seen=new Map();let expanded=0;
 function visit(item,path){
  if(Array.isArray(item)&&item.length>=100){if(refs.length>=10000||path.some(k=>['__proto__','constructor','prototype'].includes(String(k))))throw Error('Archive exceeds supported reference limits. Download the project to preserve it.');const json=JSON.stringify(item);expanded+=json.length;if(expanded>50000000)throw Error('Archive exceeds supported size.');let id=seen.get(json);if(id===undefined){id=chunks.length;seen.set(json,id);chunks.push(json)}refs.push({path,id});return null;}
  if(Array.isArray(item))return item.map((v,i)=>visit(v,[...path,i]));
  if(item&&typeof item==='object')return Object.fromEntries(Object.entries(item).map(([k,v])=>[k,visit(v,[...path,k])]));
  return item;
 }
 return {root:visit(value,[]),chunks,refs};
}
function unpackArrays(value){
 if(!value||!Array.isArray(value.chunks)||!Array.isArray(value.refs)||value.refs.length>10000)throw Error('Invalid packed archive.');
 let expanded=0;for(const ref of value.refs){if(!ref||!Number.isInteger(ref.id)||typeof value.chunks[ref.id]!=='string')throw Error('Invalid archive reference.');expanded+=value.chunks[ref.id].length;if(expanded>50000000)throw Error('Archive exceeds supported size.');}
 const chunks=value.chunks.map(s=>{if(typeof s!=='string')throw Error('Invalid archive chunk.');const a=JSON.parse(s);if(!Array.isArray(a))throw Error('Invalid archive array.');return a});
 for(const ref of value.refs){if(!ref||!Array.isArray(ref.path)||!ref.path.length||!Number.isInteger(ref.id)||!chunks[ref.id])throw Error('Invalid archive reference.');let node=value.root;
  for(const [i,key] of ref.path.entries()){if((typeof key!=='string'&&typeof key!=='number')||['__proto__','constructor','prototype'].includes(String(key))||!node||!Object.hasOwn(node,key))throw Error('Invalid archive path.');if(i===ref.path.length-1){if(node[key]!==null)throw Error('Overlapping archive reference.');node[key]=JSON.parse(JSON.stringify(chunks[ref.id]));}else node=node[key];}
 }
 return value.root;
}
export function encodeStoredArchive(archive){
 const json=JSON.stringify(archive);if(json.length>50000000)throw Error('Archive exceeds supported size. Download the project to preserve it.');if(json.length<250000)return json;
 const packed=JSON.stringify(packArrays(archive));if(packed.length>50000000)throw Error('Archive exceeds supported size.');const data=LZString.compressToUTF16(packed);if(data.length>5000000)throw Error('Compressed archive exceeds supported size.');
 return JSON.stringify({storageFormat:'uab-budget-lz-2',length:packed.length,data});
}
export function decodeStoredArchive(raw){
 const value=JSON.parse(raw);if(!['uab-budget-lz-1','uab-budget-lz-2'].includes(value?.storageFormat))return value;
 if(!Number.isSafeInteger(value.length)||value.length<1||value.length>50000000||typeof value.data!=='string'||value.data.length>5000000)throw Error('Invalid compressed archive.');
 const json=LZString.decompressFromUTF16(value.data);if(typeof json!=='string'||json.length!==value.length)throw Error('Compressed archive is incomplete or damaged.');
 const parsed=JSON.parse(json);return value.storageFormat==='uab-budget-lz-2'?unpackArrays(parsed):parsed;
}
export function persistArchive(storage,key,value,validate,expectedRaw=undefined){
 const archive=normalizeArchive(value,validate),raw=encodeStoredArchive(archive);
 if(expectedRaw!==undefined&&storage.getItem(key)!==expectedRaw)throw Error('This budget changed in another tab. Download this version if needed, then reload before editing.');
 storage.setItem(key,raw);return {archive,raw};
}
export function replaceArchive(storage,key,value,validate,expectedRaw=undefined){return persistArchive(storage,key,value,validate,expectedRaw).archive;}

// Access itself can throw in restricted/private browser contexts.
export function browserStorage(getStorage) {
  try { return getStorage(); }
  catch (error) {
    return {
      getItem(){throw error},
      setItem(){throw error},
      removeItem(){throw error}
    };
  }
}
