export function numericFieldValue(draft,nullable=false){
 if(String(draft).trim()===''){if(nullable)return null;throw Error('Enter a number; use 0 for zero.');}
 const value=Number(draft);if(!Number.isFinite(value))throw Error('Enter a finite number.');return value;
}
