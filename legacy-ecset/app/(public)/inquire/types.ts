// ─── Form Data ───────────────────────────────────────────────────────────────
//
// Ported from the EC-Creative-Client-Experience-v1 reference build, with one
// real fix: the original FormData had no fullName, phone, instagramHandle,
// sessionType, or preferredDates — meaning the wired-up flow (page.tsx ->
// FinalSection) only ever captured an email address. ContactSection.tsx
// existed in that repo with the right fields but was never plugged into
// SECTION_ORDER, so it silently did nothing. Fixed here by adding those
// fields to FormData and merging ContactSection's fields into the final
// step (see components/inquire/sections/FinalSection.tsx).

export interface FormData {
  fullName: string;
  email: string;
  phone: string;
  instagramHandle: string;
  sessionType: string; // one of SESSION_TYPES[].id, maps directly to the inquiry_type enum
  preferredDates: string;

  sessionFeelings: string[];
  momentsThatMatter: string[];
  avoidFeelings: string[];
  avoidOther: string;
  environments: string[];
  colorsTextures: string[];
  inspirationLinks: string;
  uploadedFiles: File[];
  uploadedFileNames: string[];
  stylingGuidance: string;
  wardrobeDirection: string[];
  movementPreference: string;
  nervousAbout: string[];
  meaningfulSeason: string;
  rememberYearsFromNow: string;
  oneImageFeeling: string;
  whyECCreative: string;
}

export const defaultFormData: FormData = {
  fullName: "",
  email: "",
  phone: "",
  instagramHandle: "",
  sessionType: "",
  preferredDates: "",

  sessionFeelings: [],
  momentsThatMatter: [],
  avoidFeelings: [],
  avoidOther: "",
  environments: [],
  colorsTextures: [],
  inspirationLinks: "",
  uploadedFiles: [],
  uploadedFileNames: [],
  stylingGuidance: "",
  wardrobeDirection: [],
  movementPreference: "",
  nervousAbout: [],
  meaningfulSeason: "",
  rememberYearsFromNow: "",
  oneImageFeeling: "",
  whyECCreative: "",
};

// id values match the inquiry_type enum in supabase/migrations/0003 exactly,
// so submitting this form can write straight into inquiries.inquiry_type
// with no separate mapping table to keep in sync.
export const SESSION_TYPES = [
  { id: "maternity", label: "Maternity" },
  { id: "newborn", label: "Newborn" },
  { id: "family", label: "Family" },
  { id: "couples", label: "Couples" },
  { id: "engagement", label: "Engagement" },
  { id: "branding", label: "Branding" },
  { id: "headshots", label: "Headshots" },
  { id: "wedding", label: "Wedding" },
  { id: "event", label: "Event" },
  { id: "custom", label: "Something else" },
];

export const SESSION_FEELINGS = [
  { id: "soft-intimate", label: "Soft & Intimate", description: "Quiet, close, emotionally present" },
  { id: "cinematic-emotional", label: "Cinematic & Emotional", description: "Dramatic light, intentional moments" },
  { id: "playful-candid", label: "Playful & Candid", description: "Real laughter, unscripted movement" },
  { id: "airy-minimal", label: "Airy & Minimal", description: "Clean light, open space, simplicity" },
  { id: "warm-nostalgic", label: "Warm & Nostalgic", description: "Golden tones, timeless feeling" },
  { id: "editorial-timeless", label: "Editorial & Timeless", description: "Intentional, striking, fashion-aware" },
];

export const MOMENTS_THAT_MATTER = [
  "Connection", "Quietness", "Laughter", "Anticipation", "Movement", "Storytelling", "Celebration",
];

export const AVOID_FEELINGS = [
  "Stiff", "Overly posed", "Trendy", "Cheesy", "Dark and moody", "Forced", "Overly glam",
];

export const ENVIRONMENTS = [
  { id: "beach", label: "Beach", description: "Open horizon, soft natural light" },
  { id: "dunes", label: "Dunes", description: "Sand textures, golden warmth" },
  { id: "home", label: "At-home", description: "Intimate, personal, lived-in" },
  { id: "studio", label: "Studio", description: "Controlled light, clean space" },
  { id: "architecture", label: "Architecture", description: "Lines, texture, geometry" },
  { id: "nature-trails", label: "Nature", description: "Filtered light, organic surroundings" },
  { id: "city", label: "City", description: "Energy, texture, urban layers" },
  { id: "minimal-interiors", label: "Minimal Interiors", description: "Curated, simple, architectural" },
];

export const COLORS_TEXTURES = [
  "Linen", "Warm neutrals", "Soft whites", "Sand tones", "Earth tones",
  "Black and cream", "Natural wood", "Stone", "Soft florals", "Clean minimal",
];

export const STYLING_GUIDANCE = [
  { id: "full-guide", label: "Guide us completely", description: "We want your full creative direction" },
  { id: "some-guide", label: "A little guidance helps", description: "We have ideas, but welcome input" },
  { id: "no-guide", label: "We have a clear vision", description: "We know exactly what we want" },
];

export const WARDROBE_DIRECTION = [
  "Cream dress + linen", "Soft neutrals", "Elevated casual", "Formal editorial",
  "Barefoot beach", "Cozy home textures", "Minimal black and white", "Flowy movement",
];

export const MOVEMENT_PREFERENCE = [
  { id: "natural", label: "Natural movement", description: "We follow instinct, you capture it" },
  { id: "mix", label: "Candid and guided", description: "Some direction, plenty of freedom" },
  { id: "guided", label: "More direction, please", description: "We want to know exactly where to stand" },
  { id: "unsure", label: "We trust your process", description: "Guide us completely" },
];

export const NERVOUS_ABOUT = [
  "Feeling awkward", "Not knowing how to pose", "Partner dislikes photos",
  "Kids not cooperating", "Body insecurities", "Choosing outfits", "Weather uncertainty",
];

export const INTERSTITIALS = {
  beforeVisual: "Beautiful sessions are less about perfect posing and more about honest connection.",
  beforeStyling: "The details fade. The feeling remains.",
  beforeStory: "These photographs become part of your family history.",
  beforeFinal: "You've told us everything we need to begin.",
};

export const SECTIONS = [
  { id: "hero", label: "Begin" },
  { id: "feeling", label: "The Feeling" },
  { id: "interstitial-1", label: "The Feeling" },
  { id: "visual", label: "Visual Direction" },
  { id: "interstitial-2", label: "Visual Direction" },
  { id: "styling", label: "Styling" },
  { id: "interstitial-3", label: "Styling" },
  { id: "story", label: "Your Story" },
  { id: "interstitial-4", label: "Your Story" },
  { id: "final", label: "Final Details" },
] as const;

export type SectionId = (typeof SECTIONS)[number]["id"];

export const SECTION_ORDER: SectionId[] = [
  "hero", "feeling", "interstitial-1", "visual", "interstitial-2",
  "styling", "interstitial-3", "story", "interstitial-4", "final",
];

export const PROGRESS_SECTIONS = ["feeling", "visual", "styling", "story", "final"] as const;
