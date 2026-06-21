"use server";

import { createClient } from "@/lib/supabase/server";
import { settingsSchema } from "@/lib/schemas";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updateSettingsAction(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = settingsSchema.safeParse(raw);
  if (!parsed.success) {
    redirect(`/settings?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Check the form and try again.")}`);
  }

  const supabase = await createClient();
  const { data: existing } = await supabase.from("settings").select("id").limit(1).single();
  if (!existing) redirect(`/settings?error=${encodeURIComponent("Settings row missing.")}`);

  const { error } = await supabase.from("settings").update(parsed.data).eq("id", existing!.id);
  if (error) redirect(`/settings?error=${encodeURIComponent("Couldn't save settings.")}`);

  revalidatePath("/settings");
  redirect("/settings?saved=1");
}
