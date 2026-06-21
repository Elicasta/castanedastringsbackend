import { createAdminClient } from "@/lib/supabase/admin";
import { generatePublicId } from "@/lib/ids";
import { logActivity } from "@/lib/activity";
import { publicInquiryIntakeSchema } from "@/lib/schemas";
import { sendTemplateEmail } from "@/lib/email/resend";
import { NextResponse } from "next/server";

/**
 * Public intake endpoint for the SEPARATE marketing site (castanedastrings.com).
 * Their inquiry form's server-side code POSTs here with a shared secret key.
 *
 * This must be called server-to-server from their site, never directly from
 * a browser — the API key would be exposed in client-side JS otherwise.
 */

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": process.env.MARKETING_SITE_ORIGIN ?? "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-api-key",
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function POST(req: Request) {
  const headers = corsHeaders();

  const apiKey = req.headers.get("x-api-key");
  if (!process.env.PUBLIC_INTAKE_API_KEY || apiKey !== process.env.PUBLIC_INTAKE_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers });
  }

  const parsed = publicInquiryIntakeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid inquiry data" },
      { status: 422, headers }
    );
  }
  const data = parsed.data;

  const supabase = createAdminClient();

  // split "name" into first/last the best we can — marketing forms usually have one field
  const nameParts = data.name.trim().split(/\s+/);
  const first_name = nameParts[0] ?? data.name;
  const last_name = nameParts.slice(1).join(" ") || "—";

  // find or create client by email
  let clientId: string | null = null;
  const { data: existingClient } = await supabase
    .from("clients")
    .select("id")
    .eq("email", data.email)
    .maybeSingle();

  if (existingClient) {
    clientId = existingClient.id;
  } else {
    const { data: newClient, error: clientError } = await supabase
      .from("clients")
      .insert({ first_name, last_name, email: data.email, phone: data.phone || null })
      .select("id")
      .single();
    if (clientError) {
      return NextResponse.json({ error: "Couldn't save client" }, { status: 500, headers });
    }
    clientId = newClient.id;
  }

  const { data: inquiry, error } = await supabase
    .from("inquiries")
    .insert({
      public_id: generatePublicId("inq"),
      client_id: clientId,
      source: data.source || "website",
      event_type: data.event_type || null,
      event_date: data.event_date || null,
      location_name: data.location_name || null,
      guest_count: data.guest_count || null,
      message: data.message || null,
      status: "new",
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: "Couldn't create inquiry" }, { status: 500, headers });
  }

  await logActivity({
    action: "created",
    entity_type: "inquiry",
    entity_id: inquiry.id,
    description: `Inquiry received from website: ${data.name}`,
  });

  // best-effort auto-reply — never block the response on this
  sendTemplateEmail({
    to: data.email,
    template: "inquiry_response",
    vars: {
      client_first_name: first_name,
      event_type: data.event_type || "your event",
      event_date: data.event_date || "your date",
      business_name: "Castaneda Strings",
    },
    client_id: clientId,
    inquiry_id: inquiry.id,
  }).catch(() => {});

  return NextResponse.json({ success: true, inquiry_id: inquiry.id }, { status: 201, headers });
}
