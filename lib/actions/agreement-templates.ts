"use server";
import {z} from "zod";
import {createClient} from "@/lib/supabase/server";
import {revalidatePath} from "next/cache";
const schema=z.object({id:z.string().uuid(),name:z.string().trim().min(3).max(150),body:z.string().trim().min(100).max(30000)});
async function adminSession(){
 const s=createClient();const {data:{user}}=await s.auth.getUser();
 if(!user)return null;
 const {data:member}=await s.from("cs_admin_members").select("role").eq("auth_user_id",user.id).maybeSingle();
 return member && ["owner","admin"].includes(member.role)?s:null;
}
export async function updateAgreementTemplateAction(input:unknown){
 const parsed=schema.safeParse(input);if(!parsed.success)return {error:parsed.error.issues[0]?.message||"Invalid agreement"};
 const s=await adminSession();if(!s)return {error:"Admin permission required."};
 const {error}=await s.from("contract_templates").update({name:parsed.data.name,body:parsed.data.body}).eq("id",parsed.data.id);
 if(error)return {error:error.message};
 revalidatePath("/contracts/templates");return {success:true};
}
export async function selectDefaultAgreementAction(id:string){
 if(!z.string().uuid().safeParse(id).success)return {error:"Invalid agreement"};
 const s=await adminSession();if(!s)return {error:"Admin permission required."};
 const {error}=await s.rpc("cs_select_default_contract_template",{p_id:id});
 if(error)return {error:error.message};
 revalidatePath("/contracts/templates");return {success:true};
}
