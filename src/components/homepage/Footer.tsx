import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { PageContainer, Crest } from "@/components/wireframe";

const FOOTER_COLUMNS = [
  {
    title: "Explore",
    links: [
      { label: "Family Tree", href: "/tree/viewer" },
      { label: "Individuals", href: "/individuals" },
      { label: "Families", href: "/tree/families" },
      { label: "Photos", href: "/archive/photos" },
      { label: "Albums", href: "/albums" },
      { label: "Stories", href: "/stories" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Research Guides", href: "/research" },
      { label: "Historical Records", href: "/records" },
      { label: "Genealogy Tips", href: "/genealogy-tips" },
      { label: "Help Center", href: "/help" },
      { label: "FAQ", href: "/faq" },
    ],
  },
  {
    title: "Connect",
    links: [
      { label: "Contact Us", href: "/contact" },
      { label: "Contribute", href: "/contribute" },
    ],
  },
] as const;

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-border-subtle bg-surface font-body text-text">
      <div className="pointer-events-none absolute inset-0 opacity-[0.124] mix-blend-multiply" aria-hidden>
        <Image src="/images/agedpaperbg.png" alt="" fill className="object-cover" sizes="100vw" />
      </div>
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(circle at 12% 20%, rgba(195,164,90,0.12), transparent 34%), radial-gradient(circle at 86% 18%, rgba(31,90,56,0.07), transparent 32%), linear-gradient(180deg, rgba(247,241,228,0.52), rgba(239,231,214,0.74))",
        }}
      />

      <div className="relative z-10">
        <div className="border-y border-border-subtle/80">
          <PageContainer narrow>
            <div className="grid gap-10 py-10 lg:grid-cols-[1.25fr_1.55fr_1.2fr] lg:items-start">
              <section className="max-w-sm">
                <div className="flex items-center gap-4">
                  <Crest size="md" />
                  <div>
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-muted">
                      The
                    </p>
                    <h2 className="font-heading text-2xl font-semibold tracking-tight text-heading">
                      Gonsalves Family
                    </h2>
                    <div className="mt-1 flex items-center gap-2 text-[0.65rem] uppercase tracking-[0.16em] text-accent-muted">
                      <span className="h-px w-8 bg-accent-muted/55" />
                      Est. 1890
                      <span className="h-px w-8 bg-accent-muted/55" />
                    </div>
                  </div>
                </div>
                <p className="mt-6 text-sm leading-loose text-text/90">
                  Documenting our family&apos;s journey through generations with love, memories, and a shared legacy.
                </p>
              </section>

              <nav
                aria-label="Footer navigation"
                className="grid gap-8 sm:grid-cols-3 lg:border-x lg:border-border-subtle/70 lg:px-8"
              >
                {FOOTER_COLUMNS.map((column) => (
                  <div key={column.title}>
                    <h2 className="font-heading text-sm font-semibold uppercase tracking-[0.14em] text-heading">
                      {column.title}
                    </h2>
                    <ul className="mt-5 space-y-3">
                      {column.links.map((link) => (
                        <li key={link.label}>
                          <Link
                            href={link.href}
                            className="text-sm text-text/85 transition hover:text-link hover:underline hover:underline-offset-4"
                          >
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </nav>

              <section className="relative overflow-hidden rounded-2xl border border-border-subtle/70 bg-surface-elevated/45 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]">
                <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-link/10 blur-3xl" aria-hidden />
                <div className="relative">
                  <h2 className="font-heading text-sm font-semibold uppercase tracking-[0.14em] text-heading">
                    Stay Connected
                  </h2>
                  <p className="mt-5 text-sm leading-loose text-text/90">
                    Subscribe for updates on new stories, albums, and family tree additions.
                  </p>
                  <div className="mt-5 flex flex-col overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-sm sm:flex-row lg:flex-col xl:flex-row">
                    <label className="sr-only" htmlFor="footer-email">
                      Email address
                    </label>
                    <input
                      id="footer-email"
                      type="email"
                      placeholder="Enter your email"
                      className="min-h-12 flex-1 bg-transparent px-4 text-sm text-text outline-none placeholder:text-muted"
                    />
                    <button
                      type="button"
                      className="min-h-12 bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
                    >
                      Subscribe
                    </button>
                  </div>
                </div>
              </section>
            </div>
          </PageContainer>
        </div>

        <PageContainer narrow>
          <div className="relative grid gap-8 py-8 lg:grid-cols-[1fr_1.15fr_1fr] lg:items-center">
            <section className="relative z-10 text-center lg:text-left">
              <p className="mx-auto max-w-xs font-heading text-lg italic leading-loose text-heading lg:mx-0">
                &quot;A family&apos;s story is a legacy that lives on in the hearts of those who remember.&quot;
              </p>
              <div className="mt-4 flex items-center justify-center gap-3 text-sm italic text-muted lg:justify-start">
                <span className="h-px w-10 bg-border-subtle" />
                The Gonsalves Family
              </div>
            </section>

            <div className="relative min-h-[190px] lg:min-h-[230px]" aria-hidden>
              <Image
                src="/images/stackedPhotosFooter.png?v=transparent-1"
                alt=""
                fill
                unoptimized
                className="object-contain"
                sizes="(max-width: 1024px) 90vw, 520px"
              />
            </div>

            <section className="relative z-10 text-sm text-muted lg:text-right">
              <nav aria-label="Legal links" className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-center">
                <Link href="/privacy" className="transition hover:text-link">
                  Privacy Policy
                </Link>
                <Link href="/terms" className="transition hover:text-link">
                  Terms of Use
                </Link>
                <Link href="/accessibility" className="transition hover:text-link">
                  Accessibility
                </Link>
              </nav>
            </section>
          </div>
        </PageContainer>

        <div
          className="relative z-20 border-t border-[#4F1D18]"
          style={{ backgroundColor: "#5E211C", color: "#F8EFE1" }}
        >
          <PageContainer narrow>
            <div className="flex flex-col items-center justify-center gap-2 py-5 text-center text-xs sm:text-sm md:flex-row md:gap-3">
              <p>&copy; 2026 The Gonsalves Family. All rights reserved.</p>
              <p className="inline-flex items-center justify-center gap-1.5">
                Made with <Heart className="h-3.5 w-3.5 fill-[#C3A45A] text-[#C3A45A]" aria-hidden /> for our family, today and always.
              </p>
            </div>
          </PageContainer>
        </div>
      </div>
    </footer>
  );
}
