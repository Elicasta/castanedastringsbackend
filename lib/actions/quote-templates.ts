"use server";

import { createClient } from "@/lib/supabase/server";
import { updateQuoteTemplateSchema } from "@/lib/schemas";
import { revalidatePath } from "next/cache";

export async function updateQuoteTemplateAction(input: unknown) {
  const parsed = updateQuoteTemplateSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const { id, ...rest } = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.from("quote_templates").update(rest).eq("id", id);
  if (error) return { error: "Couldn't save the template." };

  revalidatePath("/quotes/templates");
  revalidatePath("/quotes/new");
  return { success: true };
}

export async function toggleQuoteTemplateStatusAction(id: string, status: "active" | "archived") {
  const supabase = await createClient();
  const { error } = await supabase.from("quote_templates").update({ status }).eq("id", id);
  if (error) return { error: "Couldn't update the template." };

  revalidatePath("/quotes/templates");
  revalidatePath("/quotes/new");
  return { success: true };
}
