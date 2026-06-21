import { createAdminClient } from "./supabase/admin";

export async function logActivity(params: {
  actor?: string;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  description?: string;
}) {
  const supabase = createAdminClient();
  await supabase.from("activity_logs").insert({
    actor: params.actor ?? "admin",
    action: params.action,
    entity_type: params.entity_type,
    entity_id: params.entity_id ?? null,
    description: params.description ?? null,
  });
}
