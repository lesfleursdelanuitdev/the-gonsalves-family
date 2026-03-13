import Link from "next/link";
import { PageContainer, Section } from "@/components/wireframe";

export function AboutThisSiteSection() {
  return (
    <Section>
      <PageContainer narrow>
        <p className="section-subtitle mb-2">info</p>
        <h2 className="mb-12 font-heading text-4xl font-semibold tracking-tight text-black">
          About <span className="italic">This</span> Site
        </h2>
        <div className="font-body max-w-2xl space-y-6 text-lg leading-relaxed text-text">
          <p>
            This website began with the work and devotion of{" "}
            <Link
              href="/people/norman-gonsalves"
              className="text-link underline hover:text-link-hover"
            >
              Norman Gonsalves
            </Link>
            , who spent years researching, collecting records, and preserving the
            stories of our family. He created the original version of the site
            so that this history would not be lost.
          </p>
          <p>
            After his passing, his daughter,{" "}
            <Link
              href="/people/monica-gonsalves"
              className="text-link underline hover:text-link-hover"
            >
              Monica Gonsalves
            </Link>
            , continued the work he began. Using the materials he gathered, she
            rebuilt and redesigned the website from the ground up, shaping it
            into a space where our family's story can live, grow, and be
            shared across generations.
          </p>
          <p>
            The family crest was later refreshed by{" "}
            <Link
              href="/people/aaron-peter-gonsalves"
              className="text-link underline hover:text-link-hover"
            >
              Aaron Peter Gonsalves
            </Link>
            , Norman's son and Monica's brother, adding his own
            contribution to the legacy their father began.
          </p>
        </div>
      </PageContainer>
    </Section>
  );
}
