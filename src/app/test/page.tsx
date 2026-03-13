import Link from "next/link";

/**
 * Index of all component test pages.
 * Visit /test to access isolated component views for debugging.
 */
export default function TestIndexPage() {
  const tests = [
    { href: "/hero-test", label: "Hero (HeroV2)" },
    { href: "/hero-and-menu-test", label: "Hero & Menu" },
    { href: "/homepage-test", label: "Homepage (Hero + Pillars + Journey)" },
    { href: "/pillars-test", label: "Pillars" },
    { href: "/journey-test", label: "Journey Strip" },
    { href: "/upcoming-dates-test", label: "Upcoming dates" },
  ];

  return (
    <div className="min-h-screen bg-bg">
      <main className="mx-auto max-w-2xl px-6 py-16">
        <p className="pb-6 text-sm text-muted">
          <Link href="/" className="underline hover:text-text">
            ← Back to home
          </Link>
        </p>
        <h1 className="font-heading text-2xl font-semibold text-heading mb-6">
          Component test pages
        </h1>
        <ul className="space-y-3">
          {tests.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className="text-link underline hover:text-link-hover"
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
