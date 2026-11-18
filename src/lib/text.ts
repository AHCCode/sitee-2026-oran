/** Lower-case + strip accents/diacritics, collapse whitespace. */
export function normalizeText(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9@.+\-'\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Split a search query into normalised tokens (max 6, min length 2). */
export function searchTokens(q: string | null | undefined): string[] {
  if (!q) return [];
  return normalizeText(q)
    .split(" ")
    .filter((t) => t.length >= 2)
    .slice(0, 6);
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

export function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => (k in vars ? String(vars[k]) : `{${k}}`));
}

export function toInt(value: string | null | undefined, fallback?: number): number | undefined {
  if (value === null || value === undefined || value === "") return fallback;
  const n = Number(value);
  return Number.isInteger(n) ? n : fallback;
}
