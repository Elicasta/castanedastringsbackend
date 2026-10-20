import {timingSafeEqual} from "node:crypto";
import {NextResponse} from "next/server";
import {createAdminClient} from "@/lib/supabase/admin";
import {publicInquiryIntakeSchema} from "@/lib/schemas";
import {generatePublicId} from "@/lib/ids";
export const runtime="nodejs";
function headers(origin:string|null){
 const allowed=process.env.MARKETING_SITE_ORIGIN;
 return {
  "Access-Control-Allow-Origin":allowed&&origin===allowed?allowed:"null",
  "Access-Control-Allow-Methods":"POST,OPTIONS",
  "Access-Control-Allow-Headers":"Content-Type,x-api-key"
 };
}
export async function OPTIONS(req:Request){
 return new NextResponse(null,{status:204,headers:headers(req.headers.get("origin"))});
}
export async function POST(req:Request){
 const responseHeaders=headers(req.headers.get("origin"));
 const expected=process.env.PUBLIC_INTAKE_API_KEY||"";
 const provided=req.headers.get("x-api-key")||"";
 const e=Buffer.from(expected),p=Buffer.from(provided);
 if(!expected||e.length!==p.length||!timingSafeEqual(e,p))
  return NextResponse.json({ok:false,error:"Unauthorized"},{status:401,headers:responseHeaders});
 const maxLength=30_000;
 if(Number(req.headers.get("content-length")||0)>maxLength)return NextResponse.json({ok:false,error:"Payload too large"},{status:413,headers:responseHeaders});
 let raw:unknown;try{
  const body=await req.text();if(body.length>maxLength)throw new Error("Payload too large");
  raw=JSON.parse(body);
 }catch{return NextResponse.json({ok:false,error:"Invalid request body"},{status:400,headers:responseHeaders});}
 const parsed=publicInquiryIntakeSchema.safeParse(raw);
 if(!parsed.success)return NextResponse.json({ok:false,error:parsed.error.issues[0]?.message||"Invalid inquiry"},{status:422,headers:responseHeaders});
 const data=parsed.data;
 const email=data.email.trim().toLowerCase();
 const pieces=data.name.trim().split(/\s+/);
 const first=pieces.shift()||"Client",last=pieces.join(" ")||"Contact";
 const db=createAdminClient();
 let {data:client}=await db.from("clients").select("id").ilike("email",email).limit(1).maybeSingle();
 if(!client){
  const inserted=await db.from("clients").insert({first_name:first,last_name:last,email,phone:data.phone||null}).select("id").single();
  if(inserted.error||!inserted.data)return NextResponse.json({ok:false,error:"Could not save client"},{status:500,headers:responseHeaders});
  client=inserted.data;
 }
 const {data:inquiry,error}=await db.from("inquiries").insert({
  public_id:generatePublicId("inq"),client_id:client.id,source:(data.source||"website").slice(0,80),status:"new",
  event_type:data.event_type||null,event_date:data.event_date||null,location_name:data.location_name||null,
  guest_count:data.guest_count||null,message:data.message||null
 }).select("id").single();
 if(error||!inquiry)return NextResponse.json({ok:false,error:"Could not save inquiry"},{status:500,headers:responseHeaders});
 await db.from("communications").insert({
  client_id:client.id,inquiry_id:inquiry.id,channel:"email",direction:"inbound",
  from_email:email,subject:`New inquiry: ${data.event_type||"Event"}`,
  body:(data.message||`New inquiry received from ${data.name}`).slice(0,30000),
  status:"received"
 });
 return NextResponse.json({ok:true,id:inquiry.id},{status:201,headers:responseHeaders});
}
