"use server";

import { createClient } from "@/lib/supabase/server";
import { manualNoteSchema } from "@/lib/schemas";
import { revalidatePath } from "next/cache";

export async function addManualNoteAction(input: unknown) {
  const parsed = manualNoteSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase.from("communications").insert({
    client_id: parsed.data.client_id || null,
    channel: "note",
    direction: "internal",
    body: parsed.data.body,
    status: "logged",
  });
  if (error) return { error: "Couldn't save the note." };

  revalidatePath("/communications");
  return { success: true };
}
