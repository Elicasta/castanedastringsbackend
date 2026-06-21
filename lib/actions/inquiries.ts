"use server";

import { createClient } from "@/lib/supabase/server";
import { generatePublicId } from "@/lib/ids";
import { logActivity } from "@/lib/activity";
import { newInquirySchema } from "@/lib/schemas";
import { canTransitionInquiry, InvalidTransitionError } from "@/lib/status";
import type { InquiryStatus } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createInquiryAction(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = newInquirySchema.safeParse(raw);

  if (!parsed.success) {
    redirect(`/inquiries/new?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Check the form and try again.")}`);
  }

  const data = parsed.data;
  const supabase = await createClient();

  // find or create client by email
  let clientId: string | null = null;
  if (data.email) {
    const { data: existing } = await supabase
      .from("clients")
      .select("id")
      .eq("email", data.email)
      .maybeSingle();
    if (existing) clientId = existing.id;
  }
  if (!clientId) {
    const { data: client, error } = await supabase
      .from("clients")
      .insert({
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email || null,
        phone: data.phone || null,
      })
      .select("id")
      .single();
    if (error) redirect(`/inquiries/new?error=${encodeURIComponent("Couldn't save the client. " + error.message)}`);
    clientId = client!.id;
  }

  const { data: inquiry, error } = await supabase
    .from("inquiries")
    .insert({
      public_id: generatePublicId("inq"),
      client_id: clientId,
      source: data.source || "manual",
      event_type: data.event_type || null,
      event_date: data.event_date || null,
      event_start_time: data.event_start_time || null,
      event_end_time: data.event_end_time || null,
      location_name: data.location_name || null,
      location_address: data.location_address || null,
      guest_count: data.guest_count || null,
      requested_services: data.requested_services || null,
      message: data.message || null,
      internal_notes: data.internal_notes || null,
    })
    .select("id")
    .single();

  if (error) redirect(`/inquiries/new?error=${encodeURIComponent("Couldn't create the inquiry. " + error.message)}`);

  await logActivity({
    action: "created",
    entity_type: "inquiry",
    entity_id: inquiry.id,
    description: `Inquiry created for ${data.first_name} ${data.last_name}`,
  });

  revalidatePath("/inquiries");
  redirect(`/inquiries/${inquiry.id}`);
}

export async function updateInquiryStatusAction(
  inquiryId: string,
  from: InquiryStatus,
  to: InquiryStatus
) {
  if (!canTransitionInquiry(from, to)) {
    throw new InvalidTransitionError("inquiry", from, to);
  }
  const supabase = await createClient();
  const { error } = await supabase.from("inquiries").update({ status: to }).eq("id", inquiryId);
  if (error) throw error;

  await logActivity({
    action: "status_changed",
    entity_type: "inquiry",
    entity_id: inquiryId,
    description: `Inquiry moved from ${from} to ${to}`,
  });

  revalidatePath("/inquiries");
  revalidatePath(`/inquiries/${inquiryId}`);
  revalidatePath("/dashboard");
}

export async function updateInquiryNotesAction(inquiryId: string, internal_notes: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("inquiries").update({ internal_notes }).eq("id", inquiryId);
  if (error) throw error;
  revalidatePath(`/inquiries/${inquiryId}`);
}
