"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const requestedNext = String(formData.get("next") ?? "/dashboard");
  const next = requestedNext.startsWith("/") && !requestedNext.startsWith("//") && !requestedNext.includes("\\") ? requestedNext : "/dashboard";

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent("Email or password is wrong.")}&next=${encodeURIComponent(next)}`);
  }

  const {data: {user}} = await supabase.auth.getUser();
  if (!user) redirect("/login?error=Session%20not%20established.");
  const {data:member} = await supabase.from("cs_admin_members").select("auth_user_id").eq("auth_user_id",user.id).maybeSingle();
  if(!member){
    await supabase.auth.signOut();
    redirect("/login?error=This%20account%20is%20not%20an%20admin.");
  }
  redirect(next);
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
