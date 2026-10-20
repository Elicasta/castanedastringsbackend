import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isGoogleConfigured } from "@/lib/google-calendar";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { GoogleDisconnect, SyncBookingButton } from "@/components/admin/calendar-actions";
export const dynamic="force-dynamic";
type Booking={id:string;quote_id:string;title:string;location:string|null;event_date:string;start_time:string;end_time:string;time_zone:string;sync_status:string;sync_error:string|null;google_event_url:string|null};
function parseMonth(month:string|undefined){
 const now=new Date();
 const fallback=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),1));
 if(!month||!/^(20\d\d)-(0[1-9]|1[0-2])$/.test(month))return fallback;
 const [year,m]=month.split("-").map(Number);
 if(year<2020||year>2100)return fallback;
 return new Date(Date.UTC(year,m-1,1));
}
const asMonth=(d:Date)=>`${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,"0")}`;
const dateKey=(d:Date)=>d.toISOString().slice(0,10);
const displayTime=(t:string)=>{const [h,m]=t.split(":").map(Number);return `${(h%12)||12}:${String(m).padStart(2,"0")} ${h<12?"AM":"PM"}`;};
export default async function CalendarPage({searchParams}:{searchParams:{month?:string;error?:string;connected?:string}}){
 const userSession=createClient();
 const {data:{user}}=await userSession.auth.getUser();
 if(!user)redirect("/login");
 const {data:member}=await userSession.from("cs_admin_members").select("role").eq("auth_user_id",user.id).maybeSingle();
 if(!member)redirect("/login?error=Unauthorized");
 const canConnect=["owner","admin"].includes(member.role);
 const current=parseMonth(searchParams.month);
 const next=new Date(Date.UTC(current.getUTCFullYear(),current.getUTCMonth()+1,1));
 const previous=new Date(Date.UTC(current.getUTCFullYear(),current.getUTCMonth()-1,1));
 const lastDay=new Date(Date.UTC(current.getUTCFullYear(),current.getUTCMonth()+1,0)).getUTCDate();
 const db=createAdminClient();
 const [{data:bookings,error:bookingError},{data:connection}]=await Promise.all([
  userSession.from("cs_bookings").select("id,quote_id,title,location,event_date,start_time,end_time,time_zone,sync_status,sync_error,google_event_url").eq("status","confirmed").gte("event_date",dateKey(current)).lt("event_date",dateKey(next)).order("event_date",{ascending:true}).order("start_time",{ascending:true}).limit(200),
  canConnect?db.from("cs_google_connections").select("account_email,connected_at").eq("auth_user_id",user.id).maybeSingle():Promise.resolve({data:null}),
 ]);
 const records=(bookings??[]) as Booking[];
 const grouped=new Map<string,Booking[]>();
 for(const booking of records){grouped.set(booking.event_date,[...(grouped.get(booking.event_date)??[]),booking]);}
 const emptyDays=current.getUTCDay();
 const days=Array.from({length:emptyDays+lastDay},(_,i)=>{
  const d=i-emptyDays+1;return d>0?{day:d,key:`${asMonth(current)}-${String(d).padStart(2,"0")}`}:null;
 });
 const title=new Intl.DateTimeFormat("en-US",{month:"long",year:"numeric",timeZone:"UTC"}).format(current);
 return <div className="space-y-6">
   <PageHeader title="Bookings Calendar" description="Confirmed Castaneda Strings performances and Google Calendar sync."/>
   {searchParams.error&&<p role="alert" className="rounded-xl bg-red-50 text-red-700 p-3 text-sm">{searchParams.error}</p>}
   {searchParams.connected&&<p className="rounded-xl bg-teal-50 text-teal-800 p-3 text-sm">Connected Google account: {searchParams.connected}</p>}
   <Card>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3"><CalendarDays className="text-brand size-6"/><div><h2 className="font-semibold">Google Calendar</h2><p className="text-xs text-neutral-500">{connection?`Connected to ${connection.account_email}`:"Not connected"}</p></div></div>
      {connection?<GoogleDisconnect/>:canConnect&&isGoogleConfigured()?
        <a href="/api/google-calendar/connect" className="rounded-xl bg-brand text-white px-4 py-2.5 text-sm font-semibold">Connect Google Calendar</a>:
        <span className="text-sm text-amber-700">{canConnect?"OAuth keys needed":"Admin account required"}</span>}
    </div>
    <p className="text-xs text-neutral-500 mt-3">Only confirmed bookings are saved here. Google events are created when you confirm or manually sync a booking. Existing Google events are never imported or deleted automatically.</p>
   </Card>
   <div className="rounded-2xl border border-neutral-200 bg-white p-3 sm:p-5">
     <div className="flex items-center justify-between mb-5">
       <Link href={`/calendar?month=${asMonth(previous)}`} aria-label="Previous month" className="p-2 rounded-lg hover:bg-neutral-100"><ChevronLeft size={22}/></Link>
       <h2 className="text-lg font-semibold">{title}</h2>
       <Link href={`/calendar?month=${asMonth(next)}`} aria-label="Next month" className="p-2 rounded-lg hover:bg-neutral-100"><ChevronRight size={22}/></Link>
     </div>
     <div className="grid grid-cols-7 text-center text-xs text-neutral-500 border-b border-neutral-100 pb-2 mb-2">{["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d=><span key={d}>{d}</span>)}</div>
     <div className="grid grid-cols-7 gap-1">
       {days.map((day,i)=><div key={day?.key??i} className={`min-h-16 sm:min-h-24 rounded-lg p-1 sm:p-2 ${day?"bg-neutral-50":"bg-transparent"}`}>
         {day&&<><span className="text-xs text-neutral-500">{day.day}</span>{(grouped.get(day.key)??[]).slice(0,2).map(b=>
           <Link title={b.title} key={b.id} href={`/quotes/${b.quote_id}`} className="mt-1 block rounded-md bg-teal-100 px-1.5 py-1 text-[10px] sm:text-xs text-teal-900 break-words"><span className="font-medium line-clamp-2">{b.title}</span></Link>)}
           {(grouped.get(day.key)??[]).length>2&&<small className="text-teal-700">+{grouped.get(day.key)!.length-2}</small>}
         </>}
       </div>)}
     </div>
   </div>
   <section className="space-y-3">
     <h2 className="font-semibold text-lg">{records.length} confirmed booking{records.length===1?"":"s"} this month</h2>
     {bookingError&&<p className="text-red-700 text-sm">Booking database is not configured or temporarily unavailable.</p>}
     {records.length===0&&!bookingError&&<p className="text-neutral-500 text-sm">No confirmed performances for this month. Accept a quote, receive payment, and sign the agreement to confirm a booking.</p>}
     {records.map(b=><Card key={b.id}>
       <div className="flex flex-wrap justify-between gap-3">
         <div><Link href={`/quotes/${b.quote_id}`} className="font-semibold hover:text-brand">{b.title}</Link>
           <p className="text-sm text-neutral-600">{b.event_date} · {displayTime(b.start_time)} to {displayTime(b.end_time)}</p>
           {b.location&&<p className="text-sm text-neutral-500">{b.location}</p>}
         </div>
         <div className="text-right space-y-2">
           <p className="text-xs text-neutral-500">{b.sync_status==="synced"?"Synced to Google":b.sync_status==="failed"?"Google sync failed":"Not synced"}</p>
           {b.sync_error&&<p className="text-xs text-red-600">{b.sync_error}</p>}
           {connection&&b.sync_status!=="synced"&&<SyncBookingButton id={b.id}/>}
           {b.google_event_url&&<a href={b.google_event_url} target="_blank" rel="noopener noreferrer" className="text-xs text-teal-700 inline-flex items-center gap-1">Google event<ExternalLink size={13}/></a>}
         </div>
       </div>
     </Card>)}
   </section>
 </div>;
}
