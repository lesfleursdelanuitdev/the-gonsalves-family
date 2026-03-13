import Link from "next/link";
import { PageContainer, Section, Grid, Card } from "@/components/wireframe";
import { HeritageTextRotate } from "./Identity";

export function IdentitySection({
  variant,
}: {
  variant?: "default" | "no-background";
}) {
  return (
    <Section
      className={
        variant === "no-background"
          ? ""
          : "bg-[radial-gradient(circle_at_100%_0%,#efe8dd,transparent),linear-gradient(to_bottom,#e8dfd3,white)]"
      }
    >
      <PageContainer narrow>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-10 md:items-start">
          <div>
            <p className="section-subtitle mb-2">culture</p>
            <h2 className="mb-12 font-heading text-4xl font-semibold tracking-tight text-black">
              Many Backgrounds, <span className="italic">One</span> Family
            </h2>
            <p className="font-body -mt-2.5 mb-4 max-w-2xl text-xl leading-loose text-text md:text-2xl">
              Our story carries the legacy of <HeritageTextRotate /> heritage,
              woven into one family over time.
            </p>
            <p className="mt-4 text-left">
              <Link
                href="/culture"
                className="font-body inline-block rounded-lg bg-primary px-8 py-4 text-base font-semibold text-primary-foreground shadow-sm hover:bg-primary-hover hover:shadow focus:outline-none focus:ring-2 focus:ring-focus-ring transition-shadow"
              >
                Explore culture…
              </Link>
            </p>
          </div>
          <div>
            <p className="section-subtitle mb-2">Culture</p>
            <h2 className="mb-12 font-heading text-4xl font-semibold tracking-tight text-black">
              Family <span className="italic">Culture</span>
            </h2>
            <Grid cols={2}>
              <Card title="Recipes" />
              <Card title="Language" />
            </Grid>
          </div>
        </div>
      </PageContainer>
    </Section>
  );
}
