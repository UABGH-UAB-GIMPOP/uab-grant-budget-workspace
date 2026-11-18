import {effectiveRate} from './rates.js';
// Salary is compensation for the actual appointment; FTE must not scale it twice.
// Missing legacy FTE retains the assumed full-time model, not institutional verification.
export const validAppointmentFte=value=>typeof value==='number'&&Number.isFinite(value)&&value>0&&value<=1;
export function effectiveAppointmentFte(project,person,month){
 const value=effectiveRate(project,'appointmentFte',month,person.appointmentFte===undefined?1:person.appointmentFte,person.id);
 if(!validAppointmentFte(value))throw Error('Appointment FTE must be a finite fraction greater than zero and at most one.');
 return value;
}
export function validateAppointmentFte(person){return person.appointmentFte===undefined||validAppointmentFte(person.appointmentFte)?[]:[{level:'error',message:'Appointment FTE must be a finite fraction greater than zero and at most one.'}];}

export function appointmentFteAssumed(project,person,month){return person.appointmentFte===undefined&&!(project.rateChanges||[]).some(r=>r.kind==='appointmentFte'&&r.personId===person.id&&r.month<=month);}
