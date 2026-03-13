import Link from "next/link";
import {
  PageContainer,
  Section,
  Grid,
  PlaceholderBox,
} from "@/components/wireframe";

export function ArchivePreview() {
  return (
    <Section>
      <PageContainer narrow>
        <p className="section-subtitle mb-2">Media</p>
        <h2 className="mb-12 font-heading text-4xl font-semibold tracking-tight text-black">
          <span className="italic">The</span> Gonsalves Archive
        </h2>
        <div className="mb-4">
          <Grid cols={6}>
            {Array.from({ length: 6 }).map((_, i) => (
              <PlaceholderBox key={i} aspectRatio="1" />
            ))}
          </Grid>
        </div>
        <p className="mt-4 text-left">
          <Link
            href="/archive"
            className="font-body inline-block rounded-lg bg-primary px-8 py-4 text-base font-semibold text-primary-foreground shadow-sm hover:bg-primary-hover hover:shadow focus:outline-none focus:ring-2 focus:ring-focus-ring transition-shadow"
          >
            Explore Archive
          </Link>
        </p>
      </PageContainer>
    </Section>
  );
}
