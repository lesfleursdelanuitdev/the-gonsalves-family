import Image from "next/image";
import Link from "next/link";

const FOOTER_COLUMNS = [
  {
    title: "Explore",
    links: [
      { label: "Family Tree", href: "/tree/viewer" },
      { label: "Individuals", href: "/individuals" },
      { label: "Families", href: "/families" },
      { label: "Photos", href: "/archive/photos" },
      { label: "Albums", href: "/albums" },
      { label: "Stories", href: "/stories" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Useful Links", href: "/more/useful-links" },
      { label: "Help", href: "/help" },
    ],
  },
  {
    title: "Connect",
    links: [
      { label: "About Creators", href: "/more/about-creators" },
      { label: "Contact Us", href: "/contact" },
      { label: "Contribute", href: "/contribute" },
    ],
  },
] as const;

const LEGAL_LINKS = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Accessibility", href: "/accessibility" },
] as const;

export function Footer() {
  return (
    <footer
      className="relative min-w-0 w-full overflow-x-clip overflow-y-visible bg-[linear-gradient(180deg,#f4ecd6_0%,#efe5c8_100%)] font-body text-text [box-shadow:0_-16px_48px_-16px_rgba(45,36,24,0.14)]"
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.14]" aria-hidden>
        <Image src="/images/agedpaperbg.png" alt="" fill className="object-cover" sizes="100vw" />
      </div>
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 60% 80% at 50% 0%, rgba(255,250,235,0.55) 0%, transparent 65%), radial-gradient(ellipse 40% 50% at 100% 100%, rgba(195,164,90,0.08) 0%, transparent 70%)",
        }}
      />

      <div className="relative flex h-9 items-center justify-center" aria-hidden>
        <div className="absolute inset-x-0 top-1/2 h-px bg-[rgba(94,33,28,0.22)]" />
        <div className="relative flex items-center justify-center px-3.5 text-[rgba(94,33,28,0.55)]">
          <svg
            viewBox="0 0 24 24"
            className="h-6 w-6 shrink-0 opacity-90"
            fill="currentColor"
            aria-hidden
          >
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </div>
      </div>

      <div className="relative z-10 mx-auto grid w-full min-w-0 max-w-[min(100%,1680px)] grid-cols-1 items-start gap-8 px-5 pb-8 pt-9 sm:px-6 md:px-8 lg:grid-cols-[1.1fr_1.6fr_1fr] lg:gap-14 lg:px-10 lg:pb-10 lg:pt-14">
        <section className="mx-auto max-w-sm text-center lg:mx-0 lg:text-left">
          <div className="relative mx-auto mb-5 h-36 max-w-[200px] lg:mx-0 lg:mb-6 lg:h-44 lg:max-w-[240px]" aria-hidden>
            <Image
              src="/images/stackedPhotosFooter.png?v=transparent-1"
              alt=""
              fill
              unoptimized
              className="object-contain drop-shadow-[0_8px_18px_rgba(0,0,0,0.18)]"
              sizes="(max-width: 1024px) 200px, 240px"
            />
          </div>

          <div className="mb-[18px] flex items-center justify-center gap-4 lg:justify-start">
            <Image
              src="/images/crest.png"
              alt=""
              width={48}
              height={58}
              className="h-auto w-12 object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.12)]"
            />
            <div>
              <p className="m-0 mb-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-accent-muted">
                The
              </p>
              <p className="m-0 font-heading text-[26px] font-semibold leading-none tracking-[-0.01em] text-heading">
                Gonsalves Family
              </p>
              <div className="mt-1.5 flex items-center gap-2 text-[9px] font-medium uppercase tracking-[0.18em] text-accent-muted/85">
                <span className="h-px flex-1 bg-current opacity-40" />
                Est. 1890
                <span className="h-px flex-1 bg-current opacity-40" />
              </div>
            </div>
          </div>

          <p className="m-0 border-l-2 border-[rgba(139,46,46,0.4)] pl-[18px] font-accent text-lg italic leading-[1.6] text-text">
            &quot;A family&apos;s story is a legacy that lives on in the hearts of those who remember.&quot;
          </p>
          <p className="mt-3.5 pl-[18px] font-accent text-sm italic text-muted">- the family</p>
        </section>

        <nav
          aria-label="Footer navigation"
          className="grid grid-cols-2 gap-8 border-y border-[rgba(139,94,60,0.15)] py-6 text-left sm:grid-cols-3 lg:border-x lg:border-y-0 lg:px-8 lg:py-0"
        >
          {FOOTER_COLUMNS.map((column) => (
            <div key={column.title}>
              <h2 className="m-0 mb-4 border-b border-[rgba(139,46,46,0.18)] pb-2.5 font-body text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--crimson)]">
                {column.title}
              </h2>
              <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="inline-block text-sm text-text no-underline transition hover:translate-x-[3px] hover:text-crimson"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <section>
          <h2 className="m-0 mb-4 border-b border-[rgba(139,46,46,0.18)] pb-2.5 font-body text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--crimson)]">
            Contribute
          </h2>
          <div className="rounded-md border border-[rgba(31,90,56,0.16)] bg-[rgba(31,90,56,0.05)] px-4 py-3.5">
            <p className="m-0 font-accent text-sm italic text-text">
              Have a photo, story, or correction?
              <Link href="/contribute" className="ml-1 font-semibold text-link no-underline hover:underline">
                Send it -&gt;
              </Link>
            </p>
          </div>
        </section>
      </div>

      <div className="relative z-10 mx-auto w-full min-w-0 max-w-[min(100%,1680px)] px-5 sm:px-6 md:px-8 lg:px-10">
        <div className="flex w-full max-w-full flex-col items-center gap-[18px] border-t border-[rgba(139,94,60,0.2)] py-5 text-center text-[11px] font-medium tracking-[0.08em] text-muted lg:flex-row lg:items-center lg:justify-between lg:text-left">
          <div>&copy; 2026 &middot; The Gonsalves Family</div>
          <nav
            aria-label="Legal links"
            className="flex w-full max-w-full flex-wrap justify-center gap-[18px] lg:w-auto lg:max-w-none lg:justify-start"
          >
            {LEGAL_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="text-inherit no-underline hover:text-text">
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="font-accent text-sm italic tracking-normal">made with love &middot; today &amp; always</div>
        </div>
      </div>

      <div className="bg-crimson py-3.5 text-center font-heading text-[17px] font-medium italic tracking-[0.01em] text-[#f3ecd9]">
        The Gonsalves of Guyana
        <span className="mx-2 opacity-55">&middot;</span>
        a living archive
      </div>
    </footer>
  );
}
