"use server";
import {z} from "zod";
import {createClient} from "@/lib/supabase/server";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
const paymentSchema=z.object({
 zelle_name:z.string().trim().max(120).default(""),
 zelle_email:z.union([z.string().trim().email(),z.literal("")]),
 zelle_phone:z.string().trim().max(30).refine(s=>!s||/^[+()\d\s.-]{7,30}$/.test(s),"Enter a valid phone number."),
 default_invoice_due_days:z.coerce.number().int().min(1).max(365),
});
export async function updatePaymentSettingsAction(formData:FormData){
 const parsed=paymentSchema.safeParse(Object.fromEntries(formData.entries()));
 if(!parsed.success)redirect("/settings/payments?error="+encodeURIComponent(parsed.error.issues[0]?.message??"Invalid payment settings"));
 const s=createClient();
 const {data:{user}}=await s.auth.getUser();
 const {data:role}=user?await s.from("cs_admin_members").select("role").eq("auth_user_id",user.id).maybeSingle():{data:null};
 if(!role||!["owner","admin"].includes(role.role))redirect("/settings/payments?error=Permission+denied");
 const {data:current}=await s.from("settings").select("id").limit(1).maybeSingle();
 if(!current)redirect("/settings/payments?error=Settings+row+missing");
 const {error}=await s.from("settings").update(parsed.data).eq("id",current.id);
 if(error)redirect("/settings/payments?error="+encodeURIComponent(error.message));
 revalidatePath("/settings/payments");revalidatePath("/settings");revalidatePath("/invoices");
 redirect("/settings/payments?saved=1");
}
