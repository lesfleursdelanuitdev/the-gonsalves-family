import Link from "next/link";
import { PageContainer, Section } from "@/components/wireframe";

export function DiasporaSection() {
  return (
    <Section className="relative overflow-hidden pb-16 bg-[radial-gradient(circle_at_100%_0%,#f4efe7,transparent),linear-gradient(to_bottom,white_0%,white_50%,transparent_100%)]">
      <div className="relative z-10 py-8">
        <PageContainer narrow>
          <p className="section-subtitle mb-2">Maps</p>
          <h2 className="mb-12 font-heading text-4xl font-semibold tracking-tight text-black">
            <span className="italic">The</span> Gonsalves Around the World
          </h2>
          <p className="font-body -mt-[15px] mb-8 max-w-2xl text-xl leading-relaxed text-text">
            <span className="drop-shadow-sm">
              Rooted in Madeira. Grown in Guyana. Connected worldwide.
            </span>
          </p>
          <p className="mt-4 text-left">
            <Link
              href="/maps"
              className="font-body inline-block rounded-lg bg-primary px-8 py-4 text-base font-semibold text-primary-foreground shadow-sm hover:bg-primary-hover hover:shadow focus:outline-none focus:ring-2 focus:ring-focus-ring transition-shadow"
            >
              See more maps…
            </Link>
          </p>
        </PageContainer>
      </div>
    </Section>
  );
}
