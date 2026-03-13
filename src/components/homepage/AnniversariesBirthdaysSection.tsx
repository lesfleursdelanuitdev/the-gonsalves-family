import Link from "next/link";
import {
  PageContainer,
  Section,
  Grid,
  Card,
} from "@/components/wireframe";

export function AnniversariesBirthdaysSection() {
  return (
    <Section>
      <PageContainer narrow>
        <p className="section-subtitle mb-2">Events</p>
        <h2 className="mb-12 font-heading text-4xl font-semibold tracking-tight text-black">
          Anniversaries & Birthdays
        </h2>
        <Grid cols={2}>
          <Card title="Upcoming Anniversaries" />
          <Card title="Upcoming Birthdays" />
        </Grid>
        <p className="mt-4 text-left">
          <Link
            href="/events"
            className="font-body inline-block rounded-lg bg-primary px-8 py-4 text-base font-semibold text-primary-foreground shadow-sm hover:bg-primary-hover hover:shadow focus:outline-none focus:ring-2 focus:ring-focus-ring transition-shadow"
          >
            View upcoming events
          </Link>
        </p>
      </PageContainer>
    </Section>
  );
}
