import type { Metadata } from "next";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import {
  CalendarDays,
  FileText,
  HelpCircle,
  Home,
  Image,
  MapPin,
  Type,
  User,
  Users,
} from "lucide-react";
import { ResearchPageShell } from "@/components/research/ResearchPageShell";
import { STATS_ENTITIES } from "@/lib/stats-entities";

export const metadata: Metadata = {
  title: "Statistics notebook · Research · The Gonsalves Family",
  description: "Explore charts and counts across the published family tree, organised by topic.",
};

const ENTITY_ICONS: Record<string, LucideIcon> = {
  names:            Type,
  individuals:      User,
  families:         Home,
  events:           CalendarDays,
  places:           MapPin,
  dates:            CalendarDays,
  media:            Image,
  "open-questions": HelpCircle,
  notes:            FileText,
};

export default function StatisticsNotebookLandingPage() {
  return (
    <ResearchPageShell
      title="Statistics notebook"
      description="Explore the Gonsalves family tree through numbers. Pick a topic below to see charts and summaries for that part of the archive."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Research", href: "/research" },
        { label: "Statistics notebook" },
      ]}
    >
      <div className="space-y-10">
        {/* Intro */}
        <div className="max-w-2xl space-y-3">
          <h2 className="font-heading text-heading text-2xl font-semibold tracking-tight">
            What would you like to explore?
          </h2>
          <p className="font-body text-muted leading-relaxed">
            Each section below answers a different research question about the tree. Choose one to see
            charts, counts, and patterns for that topic — or browse them all.
          </p>
        </div>

        {/* Entity cards grid */}
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="list">
          {STATS_ENTITIES.map((entity) => {
            const Icon = ENTITY_ICONS[entity.slug] ?? Users;
            return (
            <li key={entity.slug}>
              <Link
                href={`/research/statistics-notebook/${entity.slug}`}
                className="group flex h-full flex-col rounded-xl border border-border-subtle bg-surface-elevated p-5 shadow-sm transition hover:border-link/40 hover:shadow-md"
              >
                <div className="mb-3 flex items-center gap-3">
                  <Icon className="size-5 shrink-0 text-link/70" aria-hidden />
                  <span className="font-body text-xs font-semibold uppercase tracking-widest text-subtle">
                    {entity.name}
                  </span>
                </div>
                <h3 className="font-accent text-heading mb-2 text-lg font-semibold leading-snug tracking-tight group-hover:text-link sm:text-xl">
                  {entity.question}
                </h3>
                <p className="font-body text-muted mt-auto text-sm leading-relaxed">
                  {entity.description}
                </p>
                <div className="mt-4 pt-3 border-t border-border-subtle/60">
                  <ul className="space-y-0.5">
                    {entity.toc.slice(0, 3).map((item) => (
                      <li key={item.id} className="font-body text-xs text-subtle truncate">
                        · {item.label}
                      </li>
                    ))}
                    {entity.toc.length > 3 && (
                      <li className="font-body text-xs text-subtle/60">
                        + {entity.toc.length - 3} more
                      </li>
                    )}
                  </ul>
                </div>
              </Link>
            </li>
            );
          })}
        </ul>
      </div>
    </ResearchPageShell>
  );
}
