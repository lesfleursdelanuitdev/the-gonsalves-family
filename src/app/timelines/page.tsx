import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/homepage/HeroAndMenu/Navbar";
import { Footer } from "@/components/homepage";
import { PageContainer } from "@/components/wireframe";
import { TimelinesPage } from "@/components/timelines/TimelinesPage";

export const metadata: Metadata = {
  title: "Timelines · The Gonsalves Family",
  description:
    "Explore the life events of Gonsalves family members as an interactive chronological timeline.",
};

export default function TimelinesPageRoute() {
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <Navbar />

      <main className="flex-1 pb-28 sm:pb-20">
        {/* Hero header — matches the calendar page pattern */}
        <section className="relative min-w-0 overflow-x-hidden pb-4 pt-14 sm:pb-10 md:pb-14 md:pt-32">
          <div className="absolute inset-0 min-w-0 max-w-full">
            <Image
              src="/images/oldMapBackground.png"
              alt=""
              fill
              priority
              className="object-cover"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-bg/96 via-bg/82 to-bg/35 md:from-bg/92 md:via-bg/78 md:to-bg/20" />
            <div className="absolute inset-y-0 left-0 w-[58%] bg-gradient-to-r from-bg to-transparent" />
          </div>

          <div className="relative z-10 min-w-0 max-w-full">
            <PageContainer fullWidth>
              <div className="grid min-w-0 max-w-full gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:items-end lg:gap-10">
                <div className="min-w-0 max-w-full space-y-5 p-5 backdrop-blur-md [-webkit-backdrop-filter:blur(14px)] [backdrop-filter:blur(14px)] sm:p-6">
                  <nav
                    aria-label="Breadcrumb"
                    className="flex min-w-0 flex-wrap items-center gap-2 font-body text-xs tracking-[0.06em] text-muted"
                  >
                    <Link href="/" className="min-w-0 shrink transition hover:text-link">
                      Home
                    </Link>
                    <span className="shrink-0 text-subtle">/</span>
                    <span className="min-w-0 text-heading">Timelines</span>
                  </nav>

                  <h1 className="break-words font-heading text-4xl font-semibold leading-[1.05] tracking-tight text-heading sm:text-5xl md:text-6xl">
                    Timelines
                  </h1>

                  <div className="h-px w-24 bg-gradient-to-r from-link/70 via-link/30 to-transparent" />

                  <p className="max-w-2xl font-body text-base leading-relaxed text-muted sm:text-lg md:text-xl">
                    Select a family member to explore their life events in chronological order —
                    births, marriages, relocations, and more.
                  </p>
                </div>

                <div className="relative hidden min-h-[280px] overflow-hidden rounded-2xl border border-white/15 bg-black/10 shadow-[0_20px_50px_rgba(25,18,12,0.35)] lg:block">
                  <Image
                    src="/images/oldMapBackground.png"
                    alt=""
                    fill
                    className="object-cover opacity-90 sepia-[0.25]"
                    sizes="40vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-bg/40 via-transparent to-bg/10" />
                  <div className="absolute inset-y-0 left-0 w-2/5 bg-gradient-to-r from-bg/65 to-transparent" />
                </div>
              </div>
            </PageContainer>
          </div>
        </section>

        {/* Timeline body */}
        <div className="pt-2">
          <PageContainer fullWidth>
            <TimelinesPage />
          </PageContainer>
        </div>
      </main>

      <Footer />
    </div>
  );
}
