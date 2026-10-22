"use server";
import {createClient} from "@/lib/supabase/server";
import {redirect} from "next/navigation";
import {revalidatePath} from "next/cache";

/** Explicitly invalidates the old client quote, then opens a new revision draft. */
export async function beginQuoteRevisionAction(quoteId:string){
 if(!/^[0-9a-f-]{36}$/i.test(quoteId))return {error:"Invalid quote."};
 const supabase=createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)return {error:"Sign in required."};
 const {data:newId,error}=await supabase.rpc("cs_begin_quote_revision",{p_quote_id:quoteId});
 if(error||!newId)return {error:error?.message??"Revision failed."};
 revalidatePath("/quotes");revalidatePath(`/quotes/${quoteId}`);
 return {success:true,id:String(newId)};
}
