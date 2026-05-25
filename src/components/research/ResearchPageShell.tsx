import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Footer } from "@/components/homepage";
import { Navbar } from "@/components/homepage/HeroAndMenu/Navbar";
import { PageContainer, Section } from "@/components/wireframe";

type Breadcrumb = { label: string; href?: string };

type ResearchPageShellProps = {
  title: string;
  description: string;
  breadcrumbs?: Breadcrumb[];
  children: ReactNode;
};

export function ResearchPageShell({ title, description, breadcrumbs, children }: ResearchPageShellProps) {
  return (
    <div className="flex min-h-screen min-w-0 max-w-full flex-col overflow-x-hidden bg-bg text-text">
      <Navbar />
      <main className="min-w-0 flex-1 overflow-x-hidden">
        <Section noPadding className="relative min-w-0 overflow-hidden pb-4 pt-14 sm:pb-10 md:pb-14 md:pt-32">
          <div className="absolute inset-0 min-w-0 max-w-full">
            <Image
              src="/images/oldMapBackground.png"
              alt=""
              fill
              priority
              className="object-cover object-center opacity-80 sepia-[0.22]"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-bg/96 via-bg/82 to-bg/35 md:from-bg/92 md:via-bg/78 md:to-bg/20" />
            <div className="absolute inset-y-0 left-0 w-[58%] bg-gradient-to-r from-bg to-transparent" />
          </div>

          <div className="relative z-10 min-w-0 max-w-full">
            <PageContainer narrow>
              <div className="min-w-0 max-w-full space-y-5 p-5 backdrop-blur-md [-webkit-backdrop-filter:blur(14px)] [backdrop-filter:blur(14px)] sm:p-6">
                {breadcrumbs && breadcrumbs.length > 0 && (
                  <nav
                    aria-label="Breadcrumb"
                    className="flex min-w-0 flex-wrap items-center gap-2 text-xs tracking-[0.06em] text-muted"
                  >
                    {breadcrumbs.map((crumb, i) => (
                      <span key={i} className="flex min-w-0 items-center gap-2">
                        {i > 0 && <span className="shrink-0 text-subtle">/</span>}
                        {crumb.href ? (
                          <Link href={crumb.href} className="min-w-0 shrink transition hover:text-link">
                            {crumb.label}
                          </Link>
                        ) : (
                          <span className="min-w-0 text-heading">{crumb.label}</span>
                        )}
                      </span>
                    ))}
                  </nav>
                )}

                <h1 className="break-words font-heading text-4xl font-semibold leading-[1.05] tracking-tight text-heading sm:text-5xl md:text-6xl">
                  {title}
                </h1>

                <div className="h-px w-24 bg-gradient-to-r from-link/70 via-link/30 to-transparent" />

                <p className="max-w-2xl text-base leading-relaxed text-muted sm:text-lg md:text-xl">
                  {description}
                </p>
              </div>
            </PageContainer>
          </div>
        </Section>

        <Section noPadding className="py-8 md:py-10">
          <PageContainer narrow>
            {children}
          </PageContainer>
        </Section>
      </main>
      <Footer />
    </div>
  );
}
