/** UI preflight. The SQL cs_confirm_booking RPC is the authority at save time. */
export function canConfirmBooking(quoteStatus:string, invoiceStatus:string|null, contractStatus:string|null):boolean{
 return quoteStatus==="accepted"&&invoiceStatus==="paid"&&(contractStatus===null||contractStatus==="signed");
}
export function validBookingRange(start:string,end:string):boolean{
 const re=/^([01]\d|2[0-3]):[0-5]\d$/;
 return re.test(start)&&re.test(end)&&end>start;
}
export function timesOverlap(aStart:string,aEnd:string,bStart:string,bEnd:string):boolean{
 return aStart<bEnd&&aEnd>bStart;
}
