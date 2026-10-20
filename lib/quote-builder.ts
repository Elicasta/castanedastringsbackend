/** Cents-based quote math. Optional and client-choice lines count only when selected. */
export type ItemKind = "standard" | "optional" | "client_selection";
export type BuilderItem = {
 name:string; description?:string; quantity:number;
 unit_price_cents:number; item_kind:ItemKind;
 selected:boolean; selection_group?:string|null;
 range_max_cents?:number|null; taxable?:boolean;
};
export function quoteSubtotal(items: BuilderItem[]):number {
 return items.reduce((sum,i)=> sum + (i.item_kind==="standard" || i.selected ? Math.round(i.quantity*i.unit_price_cents) : 0),0);
}
export function quoteTotal(items:BuilderItem[],discount:number,tax:number):number {
 const subtotal=quoteSubtotal(items);
 return Math.max(0, subtotal - discount + tax);
}
export function validateSelections(items:BuilderItem[]):string|null {
 if(!items.some(i=>i.item_kind==="standard" || i.selected)) return "Choose at least one item.";
 const chosen=new Set<string>();
 for(const item of items) {
   if(item.selected && item.item_kind==="client_selection"){
     const group=item.selection_group?.trim()||"default";
     if(chosen.has(group)) return "Select only one item per selection group.";
     chosen.add(group);
   }
 }
 return null;
}
