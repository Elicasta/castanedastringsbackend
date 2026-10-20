import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { exchangeGoogleCode, encryptRefreshToken, isGoogleConfigured } from "@/lib/google-calendar";
export const runtime="nodejs";
function redirectTo(request:NextRequest,message:string,success=false){
 const u=new URL("/calendar",request.url);
 u.searchParams.set(success?"connected":"error",message);
 const response=NextResponse.redirect(u);
 response.cookies.set("cs_google_oauth_state","",{httpOnly:true,path:"/api/google-calendar/callback",maxAge:0});
 return response;
}
export async function GET(request:NextRequest){
 const state=request.nextUrl.searchParams.get("state");
 const expected=request.cookies.get("cs_google_oauth_state")?.value;
 const code=request.nextUrl.searchParams.get("code");
 if(!state||!expected||!code)return redirectTo(request,"Google sign-in was cancelled or expired.");
 const a=Buffer.from(state);const b=Buffer.from(expected);
 if(a.length!==b.length||!timingSafeEqual(a,b))return redirectTo(request,"Google security check failed.");
 if(!isGoogleConfigured())return redirectTo(request,"Google OAuth credentials are missing.");
 const session=createClient();
 const {data:{user}}=await session.auth.getUser();
 if(!user)return redirectTo(request,"Admin session expired. Sign in again.");
 const {data:member}=await session.from("cs_admin_members").select("role").eq("auth_user_id",user.id).maybeSingle();
 if(!member||!["owner","admin"].includes(member.role))return redirectTo(request,"Admin permission required.");
 try{
   const account=await exchangeGoogleCode(code);
   const db=createAdminClient();
   const {error}=await db.from("cs_google_connections").upsert({
    auth_user_id:user.id,account_email:account.email,calendar_id:"primary",
    encrypted_refresh_token:encryptRefreshToken(account.refreshToken),
    updated_at:new Date().toISOString()
   },{onConflict:"auth_user_id"});
   if(error)throw new Error("Could not save Google connection.");
   return redirectTo(request,account.email,true);
 }catch(err){return redirectTo(request,err instanceof Error?err.message:"Could not connect Google Calendar.");}
}
