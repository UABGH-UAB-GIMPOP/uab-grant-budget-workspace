import {cents} from './money.js';
// Validate the original decimal spelling before any Number coercion can erase digits.
// Canonical CSV deliberately excludes exponent notation and grouping separators.
export function exactCsvMoney(raw){
 if(typeof raw!=='string'||! /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(raw.trim()))throw Error('Amount must be a plain decimal number.');
 const text=raw.trim(),negative=text.startsWith('-'),unsigned=text.replace(/^[+-]/,''),[whole='',fraction='']=unsigned.split('.');
 const decimal=fraction.replace(/0+$/,'');
 if(decimal.length>2)throw Error('Amount must use no more than two decimal places.');
 const integer=whole.replace(/^0+/,'')||'0';
 if(integer.length>14)throw Error('Amount exceeds supported precision.');
 const exact=(negative?-1n:1n)*BigInt(integer+decimal.padEnd(2,'0'));
 if(exact>BigInt(Number.MAX_SAFE_INTEGER)||exact< -BigInt(Number.MAX_SAFE_INTEGER))throw Error('Amount exceeds supported precision.');
 const value=Number(text);
 // Numeric storage and the existing decimal calculation engine must preserve every cent.
 if(!Number.isFinite(value)||BigInt(cents(value))!==exact)throw Error('Amount cannot be represented without losing cents.');
 return value===0?0:value;
}
