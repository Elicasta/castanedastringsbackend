// Centralized URL helpers. NEVER build a public-facing link with raw
// process.env access scattered around the codebase — if an env var is
// missing in production, that's how "undefined/q/..." ends up in a real
// client email. These always fall back to the real production domain.

const FALLBACK_APP_URL = "https://admin.castanedastrings.com";

export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL?.trim() || FALLBACK_APP_URL;
}

export function getAdminUrl(): string {
  return process.env.ADMIN_APP_URL?.trim() || FALLBACK_APP_URL;
}

export function quoteUrl(publicId: string): string {
  return `${getAppUrl()}/q/${publicId}`;
}

export function invoiceUrl(publicId: string): string {
  return `${getAppUrl()}/i/${publicId}`;
}

export function contractUrl(publicId: string): string {
  return `${getAppUrl()}/c/${publicId}`;
}

export function portalUrl(portalPublicId: string | null | undefined): string | null {
  if (!portalPublicId) return null;
  return `${getAppUrl()}/portal/${portalPublicId}`;
}

export function adminInvoiceUrl(id: string): string {
  return `${getAdminUrl()}/invoices/${id}`;
}

export function adminQuoteUrl(id: string): string {
  return `${getAdminUrl()}/quotes/${id}`;
}

export function adminContractUrl(id: string): string {
  return `${getAdminUrl()}/contracts/${id}`;
}
