import 'server-only';
import { sendTransactionalEmail } from '@/lib/email/send';
import type { FormData } from '@/app/(public)/inquire/types';
import { SESSION_FEELINGS, ENVIRONMENTS, STYLING_GUIDANCE, MOVEMENT_PREFERENCE, SESSION_TYPES } from '@/app/(public)/inquire/types';

function list(arr: string[] | undefined): string {
  if (!arr || arr.length === 0) return "<em style='color:#b5a898;'>Not specified</em>";
  return arr.join(', ');
}

function val(v: string | undefined): string {
  if (!v || v.trim() === '') return "<em style='color:#b5a898;'>Not specified</em>";
  return v.replace(/\n/g, '<br>');
}

function labelFor(options: { id: string; label: string }[], id: string | undefined): string {
  return options.find((o) => o.id === id)?.label ?? '';
}

function buildEmailHtml(data: Omit<FormData, 'uploadedFiles'>): string {
  const feelings = data.sessionFeelings.map((id) => labelFor(SESSION_FEELINGS, id) || id);
  const environments = data.environments.map((id) => labelFor(ENVIRONMENTS, id) || id);
  const styling = labelFor(STYLING_GUIDANCE, data.stylingGuidance);
  const movement = labelFor(MOVEMENT_PREFERENCE, data.movementPreference);
  const sessionTypeLabel = labelFor(SESSION_TYPES, data.sessionType) || data.sessionType;

  const section = (title: string, content: string) => `
    <tr><td style="padding:0 0 28px 0;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td style="padding:0 0 10px 0;border-bottom:1px solid #e8ddd0;">
          <p style="margin:0;font-family:Arial,sans-serif;font-size:9px;letter-spacing:0.22em;text-transform:uppercase;color:#8a7968;">${title}</p>
        </td></tr>
        <tr><td style="padding:14px 0 0 0;">${content}</td></tr>
      </table>
    </td></tr>`;

  const row = (label: string, value: string) => `
    <p style="margin:0 0 12px 0;font-family:Georgia,serif;font-size:13px;color:#4a4540;">
      <span style="font-family:Arial,sans-serif;font-size:9px;letter-spacing:0.12em;text-transform:uppercase;color:#b5a898;display:block;margin-bottom:3px;">${label}</span>
      ${value}
    </p>`;

  const storyBlock = (value: string) =>
    `<div style="font-family:Georgia,serif;font-size:13px;color:#2d2926;line-height:1.8;font-style:italic;padding:14px 18px;background:#f9f3e8;border-left:2px solid #c8b49a;margin-top:4px;">${val(value)}</div>`;

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f5ede0;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5ede0;padding:40px 20px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#fdfaf6;border:1px solid #e8ddd0;">

  <tr><td style="background:#2d2926;padding:36px 40px;">
    <p style="margin:0 0 4px 0;font-family:Arial,sans-serif;font-size:9px;letter-spacing:0.3em;text-transform:uppercase;color:#c8b49a;">EC Creative Studios</p>
    <h1 style="margin:8px 0 0 0;font-family:Georgia,serif;font-size:22px;font-weight:300;color:#f5ede0;line-height:1.2;">Session Vision Intake</h1>
    <p style="margin:8px 0 0 0;font-family:Arial,sans-serif;font-size:11px;color:#8a7968;">${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
  </td></tr>

  <tr><td style="padding:36px 40px;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0">

    ${section('Contact', `
      ${row('Name', val(data.fullName))}
      ${row('Email', val(data.email))}
      ${data.phone ? row('Phone', val(data.phone)) : ''}
      ${data.instagramHandle ? row('Instagram', val('@' + data.instagramHandle)) : ''}
      ${row('Session Type', val(sessionTypeLabel))}
      ${data.preferredDates ? row('Preferred Dates', val(data.preferredDates)) : ''}
    `)}

    ${section('Emotional Direction', `
      ${row('Session Feeling', list(feelings))}
      ${row('Moments That Matter', list(data.momentsThatMatter))}
      ${row('What to Avoid', list(data.avoidFeelings))}
      ${data.avoidOther ? row('Avoidance Notes', val(data.avoidOther)) : ''}
    `)}

    ${section('Visual Direction', `
      ${row('Environments', list(environments))}
      ${row('Colors & Textures', list(data.colorsTextures))}
      ${data.inspirationLinks ? row('Inspiration Links', `<div style="font-family:Arial,sans-serif;font-size:12px;color:#4a4540;word-break:break-all;">${val(data.inspirationLinks)}</div>`) : ''}
      ${data.uploadedFileNames?.length ? row('Uploaded Files', list(data.uploadedFileNames)) : ''}
    `)}

    ${section('Styling', `
      ${row('Styling Guidance', styling ? val(styling) : "<em style='color:#b5a898;'>Not specified</em>")}
      ${row('Wardrobe Direction', list(data.wardrobeDirection))}
      ${row('Movement Preference', movement ? val(movement) : "<em style='color:#b5a898;'>Not specified</em>")}
      ${row('Nervous About', list(data.nervousAbout))}
    `)}

    ${section('Their Story', `
      ${row('What makes this season meaningful', storyBlock(data.meaningfulSeason))}
      ${row('What they want to remember', storyBlock(data.rememberYearsFromNow))}
      ${data.oneImageFeeling ? row('The one image they hope exists', storyBlock(data.oneImageFeeling)) : ''}
      ${data.whyECCreative ? row('Why they chose EC Creative', storyBlock(data.whyECCreative)) : ''}
    `)}

  </table>
  </td></tr>

  <tr><td style="background:#f2e8d5;padding:18px 40px;border-top:1px solid #e8ddd0;">
    <p style="margin:0;font-family:Arial,sans-serif;font-size:9px;color:#b5a898;letter-spacing:0.08em;">
      EC Creative Studios &nbsp;&middot;&nbsp; Session Vision Intake &nbsp;&middot;&nbsp; eccreativestudios.com
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body></html>`;
}

export async function sendSessionVisionNotification(args: {
  studioId: string;
  toEmail: string;
  formData: Omit<FormData, 'uploadedFiles'>;
  relatedIds: { client_id: string; inquiry_id: string };
}) {
  return sendTransactionalEmail({
    studioId: args.studioId,
    triggerKey: 'inquiry_received',
    toEmail: args.toEmail,
    data: {},
    relatedIds: args.relatedIds,
    rawSubject: `Session Vision — ${args.formData.fullName || args.formData.email}`,
    rawHtml: buildEmailHtml(args.formData),
  });
}
