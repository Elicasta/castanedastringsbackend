import { NextResponse } from 'next/server';
import { z } from 'zod';
import { submitInquiry, type InquiryType } from '@/lib/server-actions/inquiries';

const allowedInquiryTypes = [
  'maternity',
  'newborn',
  'family',
  'couples',
  'engagement',
  'branding',
  'headshots',
  'wedding',
  'event',
  'custom',
] as const;

const PublicInquirySchema = z.object({
  firstName: z.string().trim().min(1).optional(),
  lastName: z.string().trim().min(1).optional(),
  name: z.string().trim().min(1).optional(),
  email: z.string().trim().email(),
  phone: z.string().trim().optional(),
  instagramHandle: z.string().trim().optional(),
  preferredContactMethod: z.string().trim().optional(),
  inquiryType: z.enum(allowedInquiryTypes).optional(),
  sessionType: z.string().trim().optional(),
  preferredDate: z.string().trim().optional(),
  preferredTimeframe: z.string().trim().optional(),
  locationPreference: z.string().trim().optional(),
  visionText: z.string().trim().optional(),
  pinterestUrl: z.string().trim().url().optional().or(z.literal('')),
  referralSource: z.string().trim().optional(),
  source: z.string().trim().optional(),
  website: z.string().optional(), // honeypot. Real users should leave it blank.
});

function corsHeaders(origin: string | null) {
  const allowedOrigin = process.env.MARKETING_SITE_ORIGIN || 'https://eccreativestudios.com';
  const responseOrigin = origin === allowedOrigin ? allowedOrigin : allowedOrigin;

  return {
    'Access-Control-Allow-Origin': responseOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
  };
}

function splitName(body: z.infer<typeof PublicInquirySchema>) {
  if (body.firstName && body.lastName) {
    return { firstName: body.firstName, lastName: body.lastName };
  }

  const fullName = body.name?.trim() || body.firstName?.trim() || '';
  const parts = fullName.split(/\s+/).filter(Boolean);

  return {
    firstName: parts[0] || 'Client',
    lastName: parts.slice(1).join(' ') || '—',
  };
}

function normalizeInquiryType(value?: string): InquiryType {
  const cleaned = (value || '').toLowerCase().replace(/[^a-z]/g, '');

  if (cleaned.includes('maternity')) return 'maternity';
  if (cleaned.includes('newborn')) return 'newborn';
  if (cleaned.includes('family')) return 'family';
  if (cleaned.includes('couple')) return 'couples';
  if (cleaned.includes('engagement')) return 'engagement';
  if (cleaned.includes('brand')) return 'branding';
  if (cleaned.includes('headshot')) return 'headshots';
  if (cleaned.includes('wedding') || cleaned.includes('elopement')) return 'wedding';
  if (cleaned.includes('event')) return 'event';

  return 'custom';
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}

export async function POST(request: Request) {
  const headers = corsHeaders(request.headers.get('origin'));

  const expectedKey = process.env.PUBLIC_INTAKE_API_KEY;
  const providedKey = request.headers.get('x-api-key');

  if (!expectedKey || providedKey !== expectedKey) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401, headers });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400, headers });
  }

  const parsed = PublicInquirySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message || 'Invalid inquiry data' },
      { status: 422, headers }
    );
  }

  const body = parsed.data;

  // Quietly accept bot submissions without writing to the database.
  if (body.website) {
    return NextResponse.json({ ok: true }, { status: 202, headers });
  }

  const name = splitName(body);
  const inquiryType = body.inquiryType || normalizeInquiryType(body.sessionType);

  const result = await submitInquiry({
    firstName: name.firstName,
    lastName: name.lastName,
    email: body.email,
    phone: body.phone,
    instagramHandle: body.instagramHandle,
    preferredContactMethod: body.preferredContactMethod,
    inquiryType,
    preferredDate: body.preferredDate,
    preferredTimeframe: body.preferredTimeframe,
    locationPreference: body.locationPreference,
    visionText: body.visionText,
    pinterestUrl: body.pinterestUrl || undefined,
    referralSource: body.referralSource || body.source,
  });

  if (!result.ok) {
    return NextResponse.json(result, { status: 500, headers });
  }

  return NextResponse.json({ ok: true }, { status: 201, headers });
}
