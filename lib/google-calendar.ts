import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

function cryptoKey(){
 const raw=process.env.GOOGLE_TOKEN_ENCRYPTION_KEY;
 if(!raw)throw new Error("GOOGLE_TOKEN_ENCRYPTION_KEY is missing.");
 const key=Buffer.from(raw,"base64");
 if(key.length!==32)throw new Error("GOOGLE_TOKEN_ENCRYPTION_KEY must decode to exactly 32 bytes.");
 return key;
}
export function isGoogleConfigured(){
 return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET &&
   process.env.GOOGLE_CALENDAR_REDIRECT_URI && process.env.GOOGLE_TOKEN_ENCRYPTION_KEY);
}
export function encryptRefreshToken(token:string):string{
 const iv=randomBytes(12);const cipher=createCipheriv("aes-256-gcm",cryptoKey(),iv);
 const data=Buffer.concat([cipher.update(token,"utf8"),cipher.final()]);
 return [iv.toString("base64url"),cipher.getAuthTag().toString("base64url"),data.toString("base64url")].join(".");
}
function decryptRefreshToken(value:string){
 const [iv,tag,data]=value.split(".");
 if(!iv||!tag||!data)throw new Error("Invalid encrypted token.");
 const decipher=createDecipheriv("aes-256-gcm",cryptoKey(),Buffer.from(iv,"base64url"));
 decipher.setAuthTag(Buffer.from(tag,"base64url"));
 return Buffer.concat([decipher.update(Buffer.from(data,"base64url")),decipher.final()]).toString("utf8");
}
export function googleConsentUrl(state:string){
 if(!isGoogleConfigured())throw new Error("Google Calendar OAuth is not configured.");
 const q=new URLSearchParams({
  client_id:process.env.GOOGLE_CLIENT_ID!,redirect_uri:process.env.GOOGLE_CALENDAR_REDIRECT_URI!,
  response_type:"code",access_type:"offline",prompt:"consent",
  scope:"https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/userinfo.email",
  state
 });
 return `https://accounts.google.com/o/oauth2/v2/auth?${q}`;
}
export async function exchangeGoogleCode(code:string){
 const response=await fetch("https://oauth2.googleapis.com/token",{
  method:"POST",cache:"no-store",headers:{"Content-Type":"application/x-www-form-urlencoded"},
  body:new URLSearchParams({
   code, client_id:process.env.GOOGLE_CLIENT_ID!,client_secret:process.env.GOOGLE_CLIENT_SECRET!,
   redirect_uri:process.env.GOOGLE_CALENDAR_REDIRECT_URI!,grant_type:"authorization_code",
  }),
 });
 const data=await response.json() as {access_token?:string;refresh_token?:string;error?:string};
 if(!response.ok||!data.access_token||!data.refresh_token)throw new Error("Google did not provide an offline refresh token. Disconnect and approve access again.");
 const identity=await fetch("https://www.googleapis.com/oauth2/v2/userinfo",{
  headers:{Authorization:`Bearer ${data.access_token}`},cache:"no-store"
 });
 const user=await identity.json() as {email?:string};
 if(!identity.ok||!user.email)throw new Error("Could not read connected Google account email.");
 return {email:user.email,refreshToken:data.refresh_token};
}
async function getAccessToken(encrypted:string){
 const response=await fetch("https://oauth2.googleapis.com/token",{
  method:"POST",cache:"no-store",headers:{"Content-Type":"application/x-www-form-urlencoded"},
  body:new URLSearchParams({
    client_id:process.env.GOOGLE_CLIENT_ID!,client_secret:process.env.GOOGLE_CLIENT_SECRET!,
    refresh_token:decryptRefreshToken(encrypted),grant_type:"refresh_token",
  }),
 });
 const data=await response.json() as {access_token?:string;error?:string};
 if(!response.ok||!data.access_token)throw new Error("Google Calendar permission expired. Reconnect the account.");
 return data.access_token;
}
type Booking={id:string;quote_id:string;title:string;location:string|null;event_date:string;start_time:string;end_time:string;time_zone:string;google_event_id:string|null;status:string;google_calendar_owner:string|null};
export async function syncBookingToGoogle(authUserId:string,bookingId:string){
 const db=createAdminClient();
 const {data:connection,error:connError}=await db.from("cs_google_connections")
   .select("auth_user_id,calendar_id,encrypted_refresh_token").eq("auth_user_id",authUserId).maybeSingle();
 if(connError||!connection)return {error:"Connect your Google Calendar first."};
 const {data:booking,error:bookingError}=await db.from("cs_bookings").select("*").eq("id",bookingId).maybeSingle();
 if(bookingError||!booking)return {error:"Booking not found."};
 const b=booking as Booking;
 if(b.status!=="confirmed")return {error:"Only confirmed bookings can be synced."};
 if(b.google_calendar_owner && b.google_calendar_owner!==authUserId)return {error:"This booking is already linked to another calendar owner."};
 try{
   const token=await getAccessToken(connection.encrypted_refresh_token);
   const eventId=b.google_event_id || "cs"+b.id.replace(/-/g,"");
   const data={
    id:eventId,
    summary:`Castaneda Strings | ${b.title}`,
    description:`Confirmed performance. Quote record: ${b.quote_id}\nManaged by Castaneda Strings admin.`,
    location:b.location || undefined,
    start:{dateTime:`${b.event_date}T${b.start_time}`,timeZone:b.time_zone},
    end:{dateTime:`${b.event_date}T${b.end_time}`,timeZone:b.time_zone},
    extendedProperties:{private:{castaneda_booking_id:b.id}},
   };
   const base=`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(connection.calendar_id)}/events`;
   const headers={"Content-Type":"application/json",Authorization:`Bearer ${token}`};
   let response=await fetch(base,{method:"POST",headers,body:JSON.stringify(data),cache:"no-store"});
   if(response.status===409){
     const {id:_id,...patch}=data;
     response=await fetch(`${base}/${encodeURIComponent(eventId)}`,{method:"PATCH",headers,body:JSON.stringify(patch),cache:"no-store"});
   }
   const event=await response.json().catch(()=>({})) as {id?:string;htmlLink?:string;error?:{message?:string}};
   if(!response.ok||!event.id)throw new Error(event.error?.message||"Google Calendar could not save this event.");
   await db.from("cs_bookings").update({
    google_event_id:event.id,google_event_url:event.htmlLink||null,google_calendar_owner:authUserId,
    sync_status:"synced",sync_error:null,updated_at:new Date().toISOString()
   }).eq("id",b.id);
   return {success:true,url:event.htmlLink||null};
 }catch(err){
   const msg=err instanceof Error?err.message:"Unknown Google Calendar error";
   await db.from("cs_bookings").update({sync_status:"failed",sync_error:msg.slice(0,400)}).eq("id",b.id);
   return {error:msg};
 }
}
