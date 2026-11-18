import {inspectWorkbook} from './workbook-reader.js';
self.onmessage=event=>{const {id,bytes}=event.data??{};try{const result=inspectWorkbook(bytes);self.postMessage({id,result});}catch(error){self.postMessage({id,error:error instanceof Error?error.message:'Unable to read workbook.'});}};
