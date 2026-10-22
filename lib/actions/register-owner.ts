"use server";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {previewLoginEnabled} from "@/lib/temporary-preview-auth";

const OWNER_EMAIL="castanedaeli0@gmail.com";

/** Bootstrap requires direct email control and manual admin approval.
 * No auth signup (or temporary preview session) grants admin privileges.
 */
export async function registerOwnerAccountAction(formData:FormData){
 if(!previewLoginEnabled())redirect("/login");
 const password=String(formData.get("password")??"");
 const confirm=String(formData.get("confirm")??"");
 if(password.length<12||password.length>128||password!==confirm){
  redirect("/register?error="+encodeURIComponent("Use a matching, unique password with at least 12 characters."));
 }
 const supabase=createClient();
 const {error}=await supabase.auth.signUp({email:OWNER_EMAIL,password});
 // Do not leave a newly created but not-yet-authorized session active.
 await supabase.auth.signOut();
 if(error){
  redirect("/register?error="+encodeURIComponent(error.message));
 }
 redirect("/register?status=check-email");
}
