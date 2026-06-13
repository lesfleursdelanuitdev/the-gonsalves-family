import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/homepage/HeroAndMenu/Navbar";
import { Footer } from "@/components/homepage";
import { Section, PageContainer } from "@/components/wireframe";

/**
 * Placeholder for a Culture section that has no content yet. Keeps the hub's
 * links resolving (no 404s) with a page consistent with the rest of the site.
 */
export function CultureSectionStub({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-screen min-w-0 max-w-full flex-col overflow-x-hidden bg-bg pb-32 text-text sm:pb-0">
      <Navbar />
      <main className="min-w-0 flex-1 overflow-x-hidden">
        <Section noPadding className="min-w-0 overflow-x-hidden pt-14 pb-16 md:pt-28 md:pb-24">
          <PageContainer narrow>
            <nav aria-label="Breadcrumb" className="flex min-w-0 flex-wrap items-center gap-2 text-xs tracking-[0.06em] text-muted">
              <Link href="/" className="transition hover:text-link">
                Home
              </Link>
              <span className="text-subtle">/</span>
              <Link href="/culture" className="transition hover:text-link">
                Culture
              </Link>
              <span className="text-subtle">/</span>
              <span className="text-heading">{title}</span>
            </nav>

            <p className="section-subtitle mt-5">Culture &amp; Heritage</p>
            <h1 className="mt-2 break-words font-heading text-4xl font-semibold leading-[1.05] tracking-tight text-heading sm:text-5xl">
              {title}
            </h1>
            <div className="mt-4 h-px w-24 bg-gradient-to-r from-link/70 via-link/30 to-transparent" />
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
              {description}
            </p>

            <div className="mt-10 rounded-2xl border border-border/80 bg-surface-elevated p-8 text-center shadow-[0_8px_24px_rgba(60,45,25,0.08)]">
              <p className="font-heading text-xl font-semibold text-heading">Coming soon</p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
                We&apos;re preparing this part of the family&apos;s culture and heritage.
                Check back soon.
              </p>
              <Link
                href="/culture"
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-link"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden />
                Back to Culture
              </Link>
            </div>
          </PageContainer>
        </Section>
      </main>
      <Footer />
    </div>
  );
}
