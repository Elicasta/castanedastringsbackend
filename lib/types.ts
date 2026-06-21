// Shared domain types, mirroring the Supabase schema.
// Keep this as the single source of truth for shapes used across server actions + UI.

export type InquiryStatus =
  | "new" | "awaiting_response" | "quoted" | "booked" | "cancelled" | "archived";

export type QuoteStatus =
  | "draft" | "sent" | "pending" | "accepted" | "declined" | "cancelled" | "expired";

export type InvoiceStatus =
  | "draft" | "sent" | "payment_pending" | "paid" | "past_due" | "cancelled" | "refunded";

export type ContractStatus =
  | "draft" | "sent" | "pending" | "signed" | "cancelled";

export type PaymentMethod = "stripe" | "zelle" | "cash" | "check" | "other";

export type CommChannel = "email" | "phone" | "text" | "note" | "system";
export type CommDirection = "inbound" | "outbound" | "internal";
export type CommStatus = "draft" | "sent" | "delivered" | "failed" | "received" | "logged";

export interface Client {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  instagram_handle: string | null;
  notes: string | null;
  portal_public_id: string;
  created_at: string;
  updated_at: string;
}

export interface Inquiry {
  id: string;
  public_id: string;
  client_id: string | null;
  source: string | null;
  status: InquiryStatus;
  event_type: string | null;
  event_date: string | null;
  event_start_time: string | null;
  event_end_time: string | null;
  location_name: string | null;
  location_address: string | null;
  guest_count: number | null;
  requested_services: string | null;
  message: string | null;
  internal_notes: string | null;
  created_at: string;
  updated_at: string;
  client?: Client | null;
}

export interface QuoteItem {
  id: string;
  quote_id: string;
  name: string;
  description: string | null;
  quantity: number;
  unit_price_cents: number;
  total_cents: number;
  sort_order: number;
}

export type QuoteTemplateCategory =
  | "wedding" | "private_celebration" | "corporate" | "proposal" | "lessons";

export interface QuoteTemplate {
  id: string;
  category: QuoteTemplateCategory;
  name: string;
  price_cents: number;
  performance_time: string | null;
  description: string | null;
  includes: string | null;
  recommended_for: string | null;
  status: "active" | "archived";
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Quote {
  id: string;
  public_id: string;
  inquiry_id: string | null;
  client_id: string | null;
  quote_number: string | null;
  status: QuoteStatus;
  title: string;
  event_type: string | null;
  event_date: string | null;
  location_name: string | null;
  subtotal_cents: number;
  discount_cents: number;
  tax_cents: number;
  total_cents: number;
  currency: string;
  valid_until: string | null;
  accepted_at: string | null;
  cancelled_at: string | null;
  notes_to_client: string | null;
  internal_notes: string | null;
  created_at: string;
  updated_at: string;
  client?: Client | null;
  quote_items?: QuoteItem[];
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  name: string;
  description: string | null;
  quantity: number;
  unit_price_cents: number;
  total_cents: number;
  sort_order: number;
}

export interface Invoice {
  id: string;
  public_id: string;
  quote_id: string | null;
  inquiry_id: string | null;
  client_id: string | null;
  invoice_number: string | null;
  status: InvoiceStatus;
  subtotal_cents: number;
  discount_cents: number;
  tax_cents: number;
  total_cents: number;
  amount_paid_cents: number;
  balance_due_cents: number;
  currency: string;
  due_date: string | null;
  paid_at: string | null;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  zelle_reference: string | null;
  payment_method: PaymentMethod | null;
  pdf_url: string | null;
  notes_to_client: string | null;
  internal_notes: string | null;
  created_at: string;
  updated_at: string;
  client?: Client | null;
  invoice_items?: InvoiceItem[];
}

export interface ContractTemplate {
  id: string;
  name: string;
  status: "active" | "archived";
  body: string;
  created_at: string;
  updated_at: string;
}

export interface Contract {
  id: string;
  public_id: string;
  contract_template_id: string | null;
  inquiry_id: string | null;
  quote_id: string | null;
  invoice_id: string | null;
  client_id: string | null;
  status: ContractStatus;
  title: string;
  body: string;
  sent_at: string | null;
  signed_at: string | null;
  signer_name: string | null;
  signer_email: string | null;
  signer_ip: string | null;
  signer_user_agent: string | null;
  signature_text: string | null;
  client_signature: string | null;
  service_ceremony: boolean;
  service_cocktail_hour: boolean;
  service_reception: boolean;
  service_proposal: boolean;
  service_corporate: boolean;
  service_custom_song: boolean;
  deposit_amount_cents: number | null;
  balance_due_cents: number | null;
  planner_name: string | null;
  planner_phone: string | null;
  song_requests: string | null;
  pdf_url: string | null;
  created_at: string;
  updated_at: string;
  client?: Client | null;
}

export interface Communication {
  id: string;
  client_id: string | null;
  inquiry_id: string | null;
  quote_id: string | null;
  invoice_id: string | null;
  contract_id: string | null;
  channel: CommChannel;
  direction: CommDirection;
  subject: string | null;
  body: string | null;
  resend_email_id: string | null;
  status: CommStatus;
  created_at: string;
  client?: Client | null;
}

export interface ActivityLog {
  id: string;
  actor: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  description: string | null;
  created_at: string;
}

export interface Settings {
  id: string;
  business_name: string;
  business_email: string | null;
  business_phone: string | null;
  business_address: string | null;
  zelle_name: string | null;
  zelle_email: string | null;
  zelle_phone: string | null;
  stripe_account_enabled: boolean;
  default_invoice_due_days: number;
  created_at: string;
  updated_at: string;
}
