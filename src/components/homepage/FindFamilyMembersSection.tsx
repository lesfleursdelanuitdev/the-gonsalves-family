import Link from "next/link";
import { PageContainer, Section } from "@/components/wireframe";

export function FindFamilyMembersSection() {
  return (
    <Section>
      <PageContainer narrow>
        <p className="section-subtitle mb-2">People</p>
        <h2 className="mb-12 font-heading text-4xl font-semibold tracking-tight text-black">
          <span className="italic">Find</span> Family Members
        </h2>
        <p className="mt-4 text-left">
          <Link
            href="/people"
            className="font-body inline-block rounded-lg bg-primary px-8 py-4 text-base font-semibold text-primary-foreground shadow-sm hover:bg-primary-hover hover:shadow focus:outline-none focus:ring-2 focus:ring-focus-ring transition-shadow"
          >
            Search people
          </Link>
        </p>
      </PageContainer>
    </Section>
  );
}
