import {validateCsvRecord} from './import-validation.js';
export function parseCsv(text){
 text=text.replace(/^\uFEFF/,'');const rows=[];let row=[],field='',quoted=false,closed=false;
 const finish=()=>{row.push(field);if(row.some(v=>v.trim()))rows.push(row);row=[];field='';closed=false};
 for(let i=0;i<text.length;i++){const ch=text[i];
  if(quoted){if(ch==='"'){if(text[i+1]==='"'){field+='"';i++}else{quoted=false;closed=true}}else field+=ch;continue}
  if(ch===','){row.push(field);field='';closed=false;continue}
  if(ch==='\n'||ch==='\r'){if(ch==='\r'&&text[i+1]==='\n')i++;finish();continue}
  if(closed)throw Error('Unexpected text after a quoted CSV field.');
  if(ch==='"'){if(field!=='')throw Error('Quote inside an unquoted CSV field.');quoted=true}else field+=ch;
 }
 if(quoted)throw Error('Unclosed quoted CSV field.');finish();return rows;
}
export function csvRecords(text){
 const rows=parseCsv(text);if(!rows.length)throw Error('CSV is empty.');const heads=rows.shift().map(h=>h.trim());
 if(heads.some(h=>!h)||new Set(heads).size!==heads.length)throw Error('CSV headers must be nonempty and unique.');
 for(const h of ['month','category','amount','reference'])if(!heads.includes(h))throw Error('Missing column: '+h);
 if(!rows.length)throw Error('CSV contains no entries.');
 return rows.map((row,i)=>{if(row.length!==heads.length)throw Error(`Row ${i+2}: column count does not match the header.`);const record=Object.fromEntries(heads.map((h,j)=>[h,row[j]]));for(const key of ['month','category','amount','reference','personId','commitmentId'])if(record[key]!==undefined)record[key]=record[key].trim();validateCsvRecord(record,i+2);return record});
}
