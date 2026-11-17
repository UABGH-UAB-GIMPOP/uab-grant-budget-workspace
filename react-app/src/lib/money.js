// Round a decimal representation to integer cents, ties away from zero.
// Inputs produced by earlier floating-point arithmetic still require decimal-engine migration.
export function cents(value){
 const n=Number(value);if(!Number.isFinite(n))throw Error('Amount must be finite.');
 const text=String(n),negative=text.startsWith('-'),parts=text.replace(/^[+-]/,'').toLowerCase().split('e'),fraction=parts[0].split('.'),digits=(fraction[0]+(fraction[1]||'')).replace(/^0+/,'')||'0',shift=2+Number(parts[1]||0)-(fraction[1]||'').length;
 let result=BigInt(digits);
 if(shift>=0)result*=10n**BigInt(shift);
 else {const divisor=10n**BigInt(-shift),remainder=result%divisor;result=result/divisor+(remainder*2n>=divisor?1n:0n)}
 if(negative)result=-result;const output=Number(result);if(!Number.isSafeInteger(output))throw Error('Amount exceeds supported precision.');return output;
}
