import type { ReactNode } from "react";
import { Footer } from "@/components/homepage";
import { Navbar } from "@/components/homepage/HeroAndMenu/Navbar";
import { PageContainer, Section } from "@/components/wireframe";

type ResearchPageShellProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function ResearchPageShell({
  title,
  description,
  children,
}: ResearchPageShellProps) {
  return (
    <div className="bg-bg min-h-screen text-text">
      <Navbar />
      <main className="pb-16 pt-[var(--mobile-nav-height)] sm:pt-20">
        <PageContainer>
          <Section className="pt-8 md:pt-12">
            <header className="mx-auto max-w-3xl text-center">
              <h1 className="font-heading text-heading text-3xl font-semibold tracking-tight md:text-4xl">
                {title}
              </h1>
              <p className="text-muted mt-3 text-base leading-relaxed md:text-lg">
                {description}
              </p>
            </header>
            <div className="mx-auto mt-10 max-w-4xl">{children}</div>
          </Section>
        </PageContainer>
      </main>
      <Footer />
    </div>
  );
}
