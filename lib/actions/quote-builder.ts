"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/** New records are always created through the signed-in session, never the service role. */
export async function createQuoteContactAction(input: {first_name: string; last_name: string; email: string}) {
  const first = input.first_name?.trim();
  const last = input.last_name?.trim();
  const email = input.email?.trim().toLowerCase();
  if (!first || !last || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return {error:"Enter a name and valid email."};
  const supabase = createClient();
  const {data:{user}} = await supabase.auth.getUser();
  if (!user) return {error:"Sign in before adding clients."};
  const {data: existing} = await supabase.from("clients").select("id,first_name,last_name,full_name,email").ilike("email",email).limit(1).maybeSingle();
  if (existing) return {client:existing};
  const {data,error} = await supabase.from("clients").insert({first_name:first,last_name:last,email}).select("id,first_name,last_name,full_name,email").single();
  if (error || !data) return {error:error?.message ?? "Could not create contact."};
  revalidatePath("/clients");
  return {client:data};
}

export async function createQuoteProjectAction(input: {client_id: string; name: string}) {
  const name = input.name?.trim();
  if (!name || name.length > 160 || !/^[0-9a-f-]{36}$/i.test(input.client_id)) return {error:"Choose a client and enter a project name."};
  const supabase = createClient();
  const {data:{user}} = await supabase.auth.getUser();
  if (!user) return {error:"Sign in before adding projects."};
  const {data: client} = await supabase.from("clients").select("id").eq("id",input.client_id).maybeSingle();
  if (!client) return {error:"Client not found."};
  const {data,error} = await supabase.from("cs_quote_projects").insert({client_id:input.client_id,name}).select("id,client_id,name").single();
  if (error || !data) return {error:error?.message ?? "Could not create project."};
  return {project:data};
}
