export const LOCALES = ["fr", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "fr";
export const LOCALE_COOKIE = "afm_locale";

export const SESSION_COOKIE = "afm_session";

export const ROLES = ["ADMIN", "VIEWER"] as const;
export type Role = (typeof ROLES)[number];

export const ARTISAN_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
export type ArtisanStatus = (typeof ARTISAN_STATUSES)[number];

export const QUOTE_STATUSES = ["PENDING", "IN_PROGRESS", "FORWARDED", "PROCESSED"] as const;
export type QuoteStatus = (typeof QUOTE_STATUSES)[number];

export const QUOTE_EVENT_TYPES = [
  "CREATED",
  "STATUS_CHANGED",
  "NOTE_UPDATED",
  "FORWARDED",
  "UNFORWARDED",
] as const;
export type QuoteEventType = (typeof QUOTE_EVENT_TYPES)[number];

export const ARTISAN_SORTS = ["relevance", "recent", "name", "experience"] as const;
export type ArtisanSort = (typeof ARTISAN_SORTS)[number];

export const PUBLIC_PAGE_SIZE = 12;
export const ADMIN_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 50;

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_PHOTOS = 8;
export const MAX_SERVICES = 15;
