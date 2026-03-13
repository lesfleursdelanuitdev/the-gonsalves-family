import Link from "next/link";
import {
  PageContainer,
  Section,
  Grid,
} from "@/components/wireframe";

const CONTRIBUTE_ACTIONS = [
  { label: "Add Photo", href: "/contribute/add-photo" },
  { label: "Share Story", href: "/contribute/share-story" },
  { label: "Upload Document", href: "/contribute/upload-document" },
  { label: "Add Recipe", href: "/contribute/add-recipe" },
];

const buttonClassName =
  "font-body inline-block rounded-lg bg-primary px-8 py-4 text-base font-semibold text-primary-foreground shadow-sm hover:bg-primary-hover hover:shadow focus:outline-none focus:ring-2 focus:ring-focus-ring transition-shadow";

export function ContributeSection() {
  return (
    <Section>
      <PageContainer narrow>
        <p className="section-subtitle mb-2">living heritage</p>
        <h2 className="mb-12 font-heading text-4xl font-semibold tracking-tight text-black">
          Contribute <span className="italic">to the</span> Archive
        </h2>
        <Grid cols={4}>
          {CONTRIBUTE_ACTIONS.map(({ label, href }) => (
            <Link key={label} href={href} className={buttonClassName}>
              {label}
            </Link>
          ))}
        </Grid>
      </PageContainer>
    </Section>
  );
}
