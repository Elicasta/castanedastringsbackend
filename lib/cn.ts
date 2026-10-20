import {clsx,type ClassValue} from "clsx";
/** Uses already-installed clsx; no undeclared runtime dependency. */
export function cn(...inputs:ClassValue[]) {return clsx(inputs);}
