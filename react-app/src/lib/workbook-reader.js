import {verifyWorkbookNumeric} from './workbook-numeric.js';
import * as XLSX from 'xlsx';
import {zipSync} from 'fflate';
import {readSafeWorkbookZip,inspectWorkbookXml} from './workbook-zip.js';
export const WORKBOOK_CELL_LIMITS=Object.freeze({rows:10000,columns:100,cells:250000,text:32767,sheets:32});
const fail=message=>{throw Error('Workbook: '+message)};
function address(ref,limits){if(!/^[A-Z]{1,3}[1-9][0-9]*$/.test(ref))fail('unsupported cell address');const cell=XLSX.utils.decode_cell(ref);if(cell.r>=limits.rows||cell.c>=limits.columns)fail('worksheet dimensions exceed import limits');return cell;}
// Pure bounded parsing stage. Mapping and applying records are separate explicit actions.
export function inspectWorkbook(input,{signal,limits={}}={}){
 const cap={...WORKBOOK_CELL_LIMITS,...limits};if(Object.keys(limits).some(k=>!Object.hasOwn(WORKBOOK_CELL_LIMITS,k))||Object.values(cap).some(v=>!Number.isSafeInteger(v)||v<1))fail('invalid cell limits');
 const checked=readSafeWorkbookZip(input,{signal});let cells=0,sheetCount=0;
 const worksheetIds=new Set();
 inspectWorkbookXml(checked.files['xl/_rels/workbook.xml.rels'],'xl/_rels/workbook.xml.rels',element=>{
  if(element.closing||element.name!=='Relationship')return;const {Type,Target,Id}=element.attrs;
  if(Type?.endsWith('/worksheet')){
   // This import contract supports ordinary worksheet parts only. Never let the parser
   // follow an alternate target that escaped the bounded worksheet preflight below.
   const path=Target?.startsWith('/')?Target.slice(1):'xl/'+Target;
   if(!Id||worksheetIds.has(Id)||!/^xl\/worksheets\/[^/]+\.xml$/.test(path)||!checked.files[path])fail('unsupported worksheet relationship');
   worksheetIds.add(Id);
  }
 });
 let declaredSheets=0;
 inspectWorkbookXml(checked.files['xl/workbook.xml'],'xl/workbook.xml',element=>{
  if(!element.closing&&element.name==='sheet'){
   if(++declaredSheets>cap.sheets)fail('too many worksheets');if(!worksheetIds.has(element.attrs['r:id']))fail('unsupported worksheet mapping');
  }
 });
 if(!declaredSheets)fail('workbook has no supported worksheets');
 for(const [path,bytes] of Object.entries(checked.files))if(/^xl\/worksheets\/[^/]+\.xml$/.test(path)){
  if(++sheetCount>cap.sheets)fail('too many worksheets');const seen=new Set(),seenRows=new Set();let currentRow=null,currentCell=null,currentCellType=null,numericCell=null,valueStart=null,valueSeen=false,valueOpen=false;const ancestors=[];const sourceXml=new TextDecoder('utf-8',{fatal:true}).decode(bytes);
  inspectWorkbookXml(bytes,path,element=>{
   const {name:kind,attrs,closing}=element;
   if(kind==='f')fail('formula cells require a values-only workbook');
   if(closing){
    ancestors.pop();
    if(kind==='v'&&numericCell&&valueStart!==null){const raw=element.start>=valueStart?sourceXml.slice(valueStart,element.start):'';if(raw.trim())try{verifyWorkbookNumeric(raw)}catch(error){fail(numericCell+': '+error.message)}valueStart=null;}
    if(kind==='v')valueOpen=false;
    if(kind==='c'){currentCell=null;numericCell=null;valueStart=null;valueSeen=false;}if(kind==='row')currentRow=null;return;
   }
   const parent=ancestors.at(-1);
   if(valueOpen)fail('cell values cannot contain nested elements');
   if(kind==='c'&&currentCell!==null)fail('nested worksheet cells are unsupported');
   if(kind==='row'&&parent!=='sheetData')fail('worksheet rows must be direct sheetData children');
   if(kind==='c'&&parent!=='row')fail('worksheet cells must be direct row children');
   if(kind==='v'){
    if(!currentCell||currentCellType==='inlineStr'||parent!=='c'||valueSeen)fail('cell values must occur once directly inside a cell');
    valueSeen=true;valueOpen=true;if(numericCell)valueStart=element.end;
   }
   if(currentCell&&parent==='c'&&!['v','is'].includes(kind))fail('unsupported cell content');
   if(kind==='is'&&currentCell){if(parent!=='c'||currentCellType!=='inlineStr'||valueSeen)fail('inline strings must occur once in an inline-string cell');valueSeen=true;}
   ancestors.push(kind);

   const ref=attrs.r;
   if(kind==='row'){if(currentRow!==null||!ref||!/^[1-9][0-9]*$/.test(ref)||Number(ref)>cap.rows||seenRows.has(ref))fail('unsupported worksheet row');currentRow=Number(ref);seenRows.add(ref);}
   if(kind==='c'){currentCell=ref;currentCellType=attrs.t||'n';valueSeen=false;numericCell=!attrs.t||attrs.t==='n'?ref:null;valueStart=null;if(!ref)fail('cell address is required');const position=address(ref,cap);if(currentRow===null||position.r+1!==currentRow)fail('cell and row coordinates do not match');if(seen.has(ref))fail('duplicate worksheet cell');seen.add(ref);if(++cells>cap.cells)fail('too many populated cells');}
   if(kind==='dimension'&&attrs.ref)for(const part of attrs.ref.split(':'))address(part,cap);
  });
 }
 if(signal?.aborted){const error=Error('Workbook parsing cancelled.');error.name='AbortError';throw error;}
 // Rebuild only verified parts; never give the parser the original compressed stream.
 const clean=zipSync(checked.files,{level:0});const book=XLSX.read(clean,{type:'array',dense:false,cellFormula:true,cellHTML:false,cellStyles:false,cellNF:true,cellText:false,cellDates:false,bookDeps:false,bookFiles:false,bookVBA:false,WTF:true});
 if(book.SheetNames.length>cap.sheets)fail('too many worksheets');
 const sheets=book.SheetNames.map(name=>{const sheet=book.Sheets[name],records=[];for(const [ref,cell] of Object.entries(sheet)){
  if(ref.startsWith('!'))continue;const position=address(ref,cap);if(cell.f)fail('formula cells require a values-only workbook');if(cell.t==='e')fail('spreadsheet error cells cannot be imported');if(cell.v===undefined||cell.v===null)continue;if(!['s','n','b','z'].includes(cell.t))fail('unsupported cell type');if(typeof cell.v==='number'&&!Number.isFinite(cell.v))fail('invalid numeric cell');if(typeof cell.v==='string'&&cell.v.length>cap.text)fail('cell text exceeds import limit');
  records.push({address:ref,row:position.r+1,column:position.c+1,type:cell.t,value:cell.v,...(cell.z?{format:String(cell.z)}:{})});
 }records.sort((a,b)=>a.row-b.row||a.column-b.column);return {name,cells:records};});
 return {format:'xlsx',dateSystem:book.Workbook?.WBProps?.date1904?'1904':'1900',sheets,populatedCells:sheets.reduce((n,s)=>n+s.cells.length,0)};
}
