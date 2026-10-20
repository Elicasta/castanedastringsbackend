"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncBookingToGoogle } from "@/lib/google-calendar";
import { validBookingRange } from "@/lib/booking-rules";
const confirmSchema=z.object({
  quoteId:z.string().uuid(),eventDate:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime:z.string().regex(/^\d{2}:\d{2}$/),endTime:z.string().regex(/^\d{2}:\d{2}$/),
  timeZone:z.enum(["America/New_York","America/Chicago","America/Denver","America/Los_Angeles"]).default("America/New_York"),
});
async function getAdmin(){
 const session=createClient();
 const {data:{user}}=await session.auth.getUser();
 if(!user)return null;
 const {data:member}=await session.from("cs_admin_members").select("role").eq("auth_user_id",user.id).maybeSingle();
 if(!member||member.role==="viewer")return null;
 return {session,user};
}
export async function confirmBookingAction(input:unknown){
 const parsed=confirmSchema.safeParse(input);
 if(!parsed.success)return {error:parsed.error.issues[0]?.message||"Enter event date and times."};
 const d=parsed.data;
 if(!validBookingRange(d.startTime,d.endTime))return {error:"Use valid times, with end after start."};
 const auth=await getAdmin();if(!auth)return {error:"Admin authorization required."};
 const {data:id,error}=await auth.session.rpc("cs_confirm_booking",{
  p_quote_id:d.quoteId,p_event_date:d.eventDate,p_start_time:d.startTime,p_end_time:d.endTime,p_time_zone:d.timeZone
 });
 if(error||!id)return {error:error?.message||"Could not confirm booking."};
 const bookingId=String(id);
 const db=createAdminClient();
 const {data:connection}=await db.from("cs_google_connections").select("auth_user_id").eq("auth_user_id",auth.user.id).maybeSingle();
 let syncMessage="Connect Google Calendar to sync this booking.";
 if(connection){
   const sync=await syncBookingToGoogle(auth.user.id,bookingId);
   syncMessage=sync.error||"Synced to Google Calendar.";
 }
 revalidatePath("/calendar");revalidatePath(`/quotes/${d.quoteId}`);
 return {success:true,bookingId,syncMessage};
}
export async function syncConfirmedBookingAction(bookingId:string){
 if(!z.string().uuid().safeParse(bookingId).success)return {error:"Invalid booking"};
 const auth=await getAdmin();if(!auth)return {error:"Admin authorization required."};
 const result=await syncBookingToGoogle(auth.user.id,bookingId);
 revalidatePath("/calendar");
 return result;
}
export async function disconnectGoogleCalendarAction(){
 const auth=await getAdmin();if(!auth)return {error:"Admin authorization required."};
 const db=createAdminClient();
 const {error}=await db.from("cs_google_connections").delete().eq("auth_user_id",auth.user.id);
 if(error)return {error:"Unable to disconnect Google Calendar."};
 revalidatePath("/calendar");
 return {success:true};
}
