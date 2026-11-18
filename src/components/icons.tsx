import {
  Briefcase,
  Building2,
  Flame,
  Gem,
  Hammer,
  Layers,
  Paintbrush,
  Scissors,
  Sparkles,
  Utensils,
  Wrench,
  Zap,
  type LucideProps,
} from "lucide-react";
import clsx from "clsx";
import type { ArtisanStatus, QuoteStatus } from "@/lib/constants";
import type { Dictionary } from "@/lib/i18n";

const ICON_MAP: Record<string, React.ComponentType<LucideProps>> = {
  hammer: Hammer,
  scissors: Scissors,
  building: Building2,
  zap: Zap,
  wrench: Wrench,
  sparkles: Sparkles,
  gem: Gem,
  amphora: Utensils,
  layers: Layers,
  briefcase: Briefcase,
  flame: Flame,
  paintbrush: Paintbrush,
};

export function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICON_MAP[name] ?? Hammer;
  return <Icon className={className} aria-hidden="true" />;
}

const QUOTE_STYLES: Record<QuoteStatus, string> = {
  PENDING: "bg-amber-50 text-amber-800 ring-amber-600/20",
  IN_PROGRESS: "bg-sky-50 text-sky-800 ring-sky-600/20",
  FORWARDED: "bg-indigo-50 text-indigo-800 ring-indigo-600/20",
  PROCESSED: "bg-emerald-50 text-emerald-800 ring-emerald-600/20",
};

const QUOTE_DOTS: Record<QuoteStatus, string> = {
  PENDING: "bg-amber-500",
  IN_PROGRESS: "bg-sky-500",
  FORWARDED: "bg-indigo-500",
  PROCESSED: "bg-emerald-500",
};

export function QuoteStatusBadge({ status, t }: { status: QuoteStatus; t: Dictionary }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        QUOTE_STYLES[status] ?? QUOTE_STYLES.PENDING,
      )}
    >
      <span className={clsx("h-1.5 w-1.5 rounded-full", QUOTE_DOTS[status] ?? QUOTE_DOTS.PENDING)} />
      {t.quoteStatus[status] ?? status}
    </span>
  );
}

const ARTISAN_STYLES: Record<ArtisanStatus, string> = {
  DRAFT: "bg-earth-100 text-earth-800 ring-earth-600/20",
  PUBLISHED: "bg-emerald-50 text-emerald-800 ring-emerald-600/20",
  ARCHIVED: "bg-zinc-100 text-zinc-700 ring-zinc-500/20",
};

export function ArtisanStatusBadge({ status, t }: { status: ArtisanStatus; t: Dictionary }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        ARTISAN_STYLES[status] ?? ARTISAN_STYLES.DRAFT,
      )}
    >
      {t.artisanStatus[status] ?? status}
    </span>
  );
}
