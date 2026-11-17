export function monthRanges(months){
 const keys=[...new Set(months)].sort();const ranges=[];let first,last;
 const index=m=>Number(m.slice(0,4))*12+Number(m.slice(5))-1;
 for(const key of keys){if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(key))throw Error('Invalid month');if(last&&index(key)===index(last)+1){last=key;continue}if(first)ranges.push({start:first,end:last});first=last=key;}
 if(first)ranges.push({start:first,end:last});return ranges;
}
