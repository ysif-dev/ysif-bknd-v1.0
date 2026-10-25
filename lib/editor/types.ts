export type BlockType =
  | "hero"
  | "intro"
  | "section_heading"
  | "rich_text"
  | "text_and_image"
  | "image_caption"
  | "two_column"
  | "three_column"
  | "card_grid"
  | "stats_metrics"
  | "timeline"
  | "cta_banner"
  | "button_group"
  | "download_resource"
  | "quote_presentation"
  | "faq_accordion"
  | "divider_spacing";

export interface EditorBlock {
  id: string;
  type: BlockType;
  label?: string;
  props: Record<string, any>;
}

export interface PageDocumentData {
  slug: string;
  title: string;
  subtitle?: string | null;
  heroImage?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  schemaVersion: number;
  version: number;
  draftContent: EditorBlock[];
  publishedContent: EditorBlock[] | null;
  publishedAt?: string | null;
  publishedBy?: string | null;
  draftUpdatedAt?: string | null;
  draftUpdatedBy?: string | null;
}

export interface RevisionSnapshot {
  id: string;
  pageSlug: string;
  version: number;
  title: string;
  subtitle?: string | null;
  blocks: EditorBlock[];
  heroImage?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  createdByName?: string | null;
  changeSummary?: string | null;
  createdAt: string;
}

export const SUPPORTED_PAGES = [
  { slug: "about", label: "About Us", path: "/about" },
  { slug: "impact", label: "Impact & Evidence", path: "/impact" },
  { slug: "privacy-policy", label: "Privacy Policy", path: "/privacy-policy" },
  { slug: "terms-of-use", label: "Terms of Use", path: "/terms-of-use" },
  { slug: "accessibility", label: "Accessibility Statement", path: "/accessibility" },
] as const;

export type SupportedPageSlug = (typeof SUPPORTED_PAGES)[number]["slug"];

export function isSupportedPage(slug: string): slug is SupportedPageSlug {
  return SUPPORTED_PAGES.some((p) => p.slug === slug);
}
