import {describe,it,expect} from "vitest";
import {renderTemplate,brandedHtml} from "./templates";
describe("Castaneda email templates",()=>{
 it("merges repeated allowed customer fields without changing unrelated text",()=>{
  expect(renderTemplate("Hi {{client_first_name}}. Bye {{client_first_name}}.",{client_first_name:"Jordan"}))
   .toBe("Hi Jordan. Bye Jordan.");
 });
 it("leaves absent values blank",()=>{
  expect(renderTemplate("Total: {{total}}",{})).toBe("Total: ");
 });
 it("escapes client content before rendering HTML",()=>{
  const html=brandedHtml('Hello "quoted"',"<script>alert('x')</script>\nHello");
  expect(html).not.toContain("<script>");
  expect(html).toContain("&lt;script&gt;");
  expect(html).toContain("&quot;quoted&quot;");
 });
 it("renders a secure quote URL as a clickable button",()=>{
  const html=brandedHtml("Quote","https://example.com/q/test");
  expect(html).toContain('href="https://example.com/q/test"');
 });
});
