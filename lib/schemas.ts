import { z } from "zod";

// Centralized server-side validation. Every server action parses input through one of these.

export const lineItemSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Item name is required"),
  description: z.string().optional().nullable(),
  quantity: z.coerce.number().positive("Quantity must be greater than 0"),
  unit_price_cents: z.coerce.number().int().min(0, "Price can't be negative"),
});

export const newInquirySchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  source: z.string().optional(),
  event_type: z.string().optional(),
  event_date: z.string().optional(),
  event_start_time: z.string().optional(),
  event_end_time: z.string().optional(),
  location_name: z.string().optional(),
  location_address: z.string().optional(),
  guest_count: z.coerce.number().int().positive().optional().or(z.literal("")),
  requested_services: z.string().optional(),
  message: z.string().optional(),
  internal_notes: z.string().optional(),
});

export const newQuoteSchema = z.object({
  inquiry_id: z.string().uuid().optional().nullable(),
  client_id: z.string().uuid(),
  title: z.string().min(1, "Title is required"),
  event_type: z.string().optional(),
  event_date: z.string().optional(),
  location_name: z.string().optional(),
  valid_until: z.string().optional(),
  notes_to_client: z.string().optional(),
  internal_notes: z.string().optional(),
  discount_cents: z.coerce.number().int().min(0).default(0),
  tax_cents: z.coerce.number().int().min(0).default(0),
  items: z.array(lineItemSchema).min(1, "Add at least one line item"),
  send: z.boolean().optional(),
});

export const newContractTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  body: z.string().min(1, "Template body can't be empty"),
});

export const markZellePaidSchema = z.object({
  invoice_id: z.string().uuid(),
  amount_paid_cents: z.coerce.number().int().positive("Enter the amount received"),
  paid_at: z.string().min(1, "Pick the date it was paid"),
  zelle_reference: z.string().optional(),
});

export const signContractSchema = z.object({
  contract_public_id: z.string().min(1),
  signer_name: z.string().min(2, "Type your full legal name"),
  signer_email: z.string().email("Enter a valid email"),
  signature_image: z
    .string()
    .startsWith("data:image/", "Invalid signature image")
    .max(500_000, "Signature image is too large")
    .optional(),
});

export const manualNoteSchema = z.object({
  client_id: z.string().uuid().optional().nullable(),
  body: z.string().min(1, "Note can't be empty"),
});

export const settingsSchema = z.object({
  business_name: z.string().min(1),
  business_email: z.string().email().optional().or(z.literal("")),
  business_phone: z.string().optional(),
  business_address: z.string().optional(),
  zelle_name: z.string().optional(),
  zelle_email: z.string().optional(),
  zelle_phone: z.string().optional(),
  default_invoice_due_days: z.coerce.number().int().positive().default(7),
});

// Used by the PUBLIC intake endpoint (/api/public/inquiries), called from the
// separate marketing site's inquiry form. Deliberately looser/simpler than the
// admin-side newInquirySchema since we don't control the form's exact fields.
export const publicInquiryIntakeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("A valid email is required"),
  phone: z.string().optional(),
  event_type: z.string().optional(),
  event_date: z.string().optional(),
  location_name: z.string().optional(),
  guest_count: z.coerce.number().int().positive().optional(),
  message: z.string().optional(),
  source: z.string().optional(),
});

export const updateQuoteTemplateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Name is required"),
  price_cents: z.coerce.number().int().min(0),
  performance_time: z.string().optional(),
  description: z.string().optional(),
  includes: z.string().optional(),
  recommended_for: z.string().optional(),
});

export const contractDetailsSchema = z.object({
  contract_id: z.string().uuid(),
  service_ceremony: z.boolean().default(false),
  service_cocktail_hour: z.boolean().default(false),
  service_reception: z.boolean().default(false),
  service_proposal: z.boolean().default(false),
  service_corporate: z.boolean().default(false),
  service_custom_song: z.boolean().default(false),
  deposit_amount_cents: z.coerce.number().int().min(0).optional(),
  balance_due_cents: z.coerce.number().int().min(0).optional(),
  planner_name: z.string().optional(),
  planner_phone: z.string().optional(),
  song_requests: z.string().optional(),
});
