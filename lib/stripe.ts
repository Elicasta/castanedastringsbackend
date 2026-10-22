import Stripe from "stripe";

let cached: Stripe | undefined;

/** Do not construct clients during static Next.js builds without environment credentials. */
export function getStripe(): Stripe {
  if (!cached) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("Stripe is not configured on this environment.");
    cached = new Stripe(key, { apiVersion: "2024-06-20" });
  }
  return cached;
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);
}
