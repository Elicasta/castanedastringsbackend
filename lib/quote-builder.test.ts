import {describe,it,expect} from "vitest";
import {quoteSubtotal,quoteTotal,validateSelections, type BuilderItem} from "./quote-builder";
const make=(over:Partial<BuilderItem>):BuilderItem=>({
 name:"Service",quantity:1,unit_price_cents:10000,item_kind:"standard",selected:true,...over
});
describe("quote calculations",()=>{
 it("does not include unselected optional items",()=>{
  const items=[make({}),make({item_kind:"optional",selected:false,unit_price_cents:5000})];
  expect(quoteSubtotal(items)).toBe(10000);
  expect(quoteTotal(items,1500,750)).toBe(9250);
 });
 it("includes selected extras and excludes unselected choices",()=>{
  expect(quoteSubtotal([make({}),make({item_kind:"optional",selected:true,unit_price_cents:5000})])).toBe(15000);
 });
 it("enforces one selection per group",()=>{
  expect(validateSelections([make({item_kind:"client_selection",selection_group:"music",selected:true}),
    make({item_kind:"client_selection",selection_group:"music",selected:true})])).toMatch(/one/i);
  expect(validateSelections([make({item_kind:"standard",selected:true})])).toBeNull();
 });
});
