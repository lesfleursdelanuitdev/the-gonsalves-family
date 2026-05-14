import Link from "next/link";
import { Footer } from "@/components/homepage";
import { Navbar } from "@/components/homepage/HeroAndMenu/Navbar";
import { PageContainer, Section } from "@/components/wireframe";

type LegalSection = {
  title: string;
  body: string[];
};

type LegalPageProps = {
  eyebrow: string;
  title: string;
  intro: string;
  sections: LegalSection[];
};

export function LegalPage({ eyebrow, title, intro, sections }: LegalPageProps) {
  return (
    <div className="flex min-h-screen min-w-0 max-w-full flex-col overflow-x-hidden bg-bg text-text">
      <Navbar />
      <main className="min-w-0 flex-1 overflow-x-hidden">
        <Section className="relative min-w-0 overflow-hidden pb-12 pt-14 md:pb-16 md:pt-32">
          <div className="absolute inset-0 min-w-0 max-w-full" aria-hidden>
            <div
              className="absolute inset-0 opacity-[0.14] mix-blend-multiply"
              style={{
                backgroundImage: "url(/images/agedpaperbg.png)",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-bg/82 via-bg/94 to-bg" />
          </div>

          <div className="relative z-10 min-w-0 max-w-full">
            <PageContainer narrow>
              <div className="mx-auto max-w-3xl space-y-8">
                <nav
                  aria-label="Breadcrumb"
                  className="flex min-w-0 flex-wrap items-center gap-2 text-xs uppercase tracking-[0.14em] text-muted"
                >
                  <Link href="/" className="transition hover:text-link">
                    Home
                  </Link>
                  <span className="text-subtle">/</span>
                  <span className="text-heading">{title}</span>
                </nav>

                <header className="space-y-4">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[#8b2e2e]">
                    {eyebrow}
                  </p>
                  <h1 className="font-heading text-4xl font-semibold leading-[1.05] tracking-tight text-heading sm:text-5xl md:text-6xl">
                    {title}
                  </h1>
                  <p className="text-base leading-relaxed text-muted sm:text-lg">{intro}</p>
                  <p className="text-xs uppercase tracking-[0.14em] text-muted">Last updated May 13, 2026</p>
                </header>

                <div className="space-y-5 rounded-2xl border border-border/80 bg-surface/92 p-5 shadow-[0_10px_26px_rgba(60,45,25,0.08)] sm:p-7">
                  {sections.map((section) => (
                    <section key={section.title} className="space-y-2 border-b border-border-subtle pb-5 last:border-b-0 last:pb-0">
                      <h2 className="font-heading text-2xl font-semibold text-heading">{section.title}</h2>
                      {section.body.map((paragraph) => (
                        <p key={paragraph} className="text-sm leading-7 text-text/85 sm:text-base">
                          {paragraph}
                        </p>
                      ))}
                    </section>
                  ))}
                </div>
              </div>
            </PageContainer>
          </div>
        </Section>
      </main>
      <Footer />
    </div>
  );
}
