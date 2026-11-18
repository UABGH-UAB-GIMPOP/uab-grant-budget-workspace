// Compare the stored OOXML decimal value, not an already rounded JS number.
function canonicalDecimal(raw){
 const match=String(raw).trim().match(/^([+-]?)(?:(\d+)(?:\.(\d*))?|\.(\d+))(?:[eE]([+-]?\d+))?$/);
 if(!match)throw Error('unsupported numeric cell spelling');
 const fraction=match[3]??match[4]??'',exponent=Number(match[5]||0);
 if(!Number.isSafeInteger(exponent)||Math.abs(exponent)>10000)throw Error('numeric cell exponent exceeds supported limits');
 let digits=((match[2]||'')+fraction).replace(/^0+/,'');if(!digits)return '0';
 const trailing=digits.match(/0*$/)[0].length;digits=digits.slice(0,digits.length-trailing);
 return (match[1]==='-'?'-':'')+digits+'e'+(exponent-fraction.length+trailing);
}
export function verifyWorkbookNumeric(raw){
 if(typeof raw!=='string'||raw.length>32767)throw Error('numeric cell text exceeds supported limits');
 const original=canonicalDecimal(raw),value=Number(raw);
 if(!Number.isFinite(value)||canonicalDecimal(String(value))!==original)throw Error('numeric cell cannot be read without changing its stored decimal value; export this amount as exact text');
 return value;
}
