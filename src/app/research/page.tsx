import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAV_GROUPS } from "@/components/homepage/HeroAndMenu/Navbar/site-nav/navConfig";
import { resolveNavIcon } from "@/components/homepage/HeroAndMenu/Navbar/site-nav/navIcons";
import { ResearchPageShell } from "@/components/research/ResearchPageShell";

const researchGroup = SITE_NAV_GROUPS.find((g) => g.id === "research");

export const metadata: Metadata = {
  title: "Research · The Gonsalves Family",
  description: "Open questions, sources, repositories, statistics, and analytics search.",
};

export default function ResearchHubPage() {
  const items = researchGroup?.items ?? [];

  return (
    <ResearchPageShell
      title="Research"
      description="Evidence, gaps, and analytics for the published family tree."
    >
      <ul className="divide-y divide-border-subtle rounded-xl border border-border-subtle bg-surface/40">
        {items.map((item) => {
          const Icon = resolveNavIcon(item.icon);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className="hover:bg-link/5 flex gap-4 px-5 py-4 no-underline transition"
              >
                <span className="bg-link/10 text-link inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                  <Icon size={18} strokeWidth={2} aria-hidden />
                </span>
                <span className="min-w-0 text-left">
                  <span className="text-heading block font-medium">{item.label}</span>
                  <span className="text-muted mt-0.5 block text-sm">{item.description}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </ResearchPageShell>
  );
}
