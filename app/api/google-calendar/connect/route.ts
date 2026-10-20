import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { googleConsentUrl, isGoogleConfigured } from "@/lib/google-calendar";
export const runtime="nodejs";
export async function GET(request:NextRequest){
 const supabase=createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)return NextResponse.redirect(new URL("/login",request.url));
 const {data:member}=await supabase.from("cs_admin_members").select("role").eq("auth_user_id",user.id).maybeSingle();
 if(!member||!["owner","admin"].includes(member.role))return NextResponse.redirect(new URL("/calendar?error=Admin+permission+required",request.url));
 if(!isGoogleConfigured())return NextResponse.redirect(new URL("/calendar?error=Google+OAuth+credentials+not+configured",request.url));
 const state=randomBytes(32).toString("base64url");
 const result=NextResponse.redirect(googleConsentUrl(state));
 result.cookies.set("cs_google_oauth_state",state,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/api/google-calendar/callback",maxAge:600});
 return result;
}
