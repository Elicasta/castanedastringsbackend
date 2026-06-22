/**
 * Deliberately not AI. Per spec: "Do not use AI for this first version."
 * Plain rules, easy for a non-engineer to read and extend by adding another
 * `if` block. Lives here, not buried in a component, so the admin inquiry
 * page can call it and so it's testable on its own.
 */

export type InquiryForAdvisor = {
  inquiryType: string;
  locationPreference: string | null;
  visionText: string | null;
};

export type QuoteAdvice = {
  suggestedQuoteTemplateName: string;
  suggestedFollowUp: string;
  tags: string[];
};

export function suggestQuoteApproach(inquiry: InquiryForAdvisor): QuoteAdvice {
  const vision = (inquiry.visionText ?? '').toLowerCase();
  const location = (inquiry.locationPreference ?? '').toLowerCase();

  if (inquiry.inquiryType === 'maternity' && location.includes('studio')) {
    return {
      suggestedQuoteTemplateName: 'Maternity Session',
      suggestedFollowUp: 'Studio maternity sessions book out a few weeks ahead, mention availability early.',
      tags: ['maternity', 'studio'],
    };
  }

  if (inquiry.inquiryType === 'family' && (vision.includes('laid back') || vision.includes('lifestyle'))) {
    return {
      suggestedQuoteTemplateName: 'Family Lifestyle Session',
      suggestedFollowUp: 'They used lifestyle language, lead with the on-location lifestyle package, not studio.',
      tags: ['family', 'lifestyle'],
    };
  }

  if (inquiry.inquiryType === 'branding') {
    return {
      suggestedQuoteTemplateName: 'Branding Session',
      suggestedFollowUp: 'Ask what the images are for (website, social, both) before quoting deliverable count.',
      tags: ['branding'],
    };
  }

  if (inquiry.inquiryType === 'headshots') {
    return {
      suggestedQuoteTemplateName: 'Headshots',
      suggestedFollowUp: 'Confirm solo vs. team headshots, team sessions need a different time block.',
      tags: ['headshots'],
    };
  }

  if (inquiry.inquiryType === 'wedding' || inquiry.inquiryType === 'event') {
    return {
      suggestedQuoteTemplateName: 'Wedding / Event',
      suggestedFollowUp: 'Get the exact date and guest count before quoting, coverage hours depend on both.',
      tags: ['wedding-or-event'],
    };
  }

  if (inquiry.inquiryType === 'newborn') {
    return {
      suggestedQuoteTemplateName: 'Newborn Session',
      suggestedFollowUp: "Confirm baby's age, newborn sessions are time-sensitive, book within the first 2 weeks if possible.",
      tags: ['newborn'],
    };
  }

  return {
    suggestedQuoteTemplateName: 'Standard Session Invoice',
    suggestedFollowUp: 'No template matched cleanly, review manually before sending a quote.',
    tags: [inquiry.inquiryType],
  };
}
