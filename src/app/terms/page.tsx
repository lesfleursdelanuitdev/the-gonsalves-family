import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Use | The Gonsalves Family",
  description: "Terms for using and contributing to The Gonsalves Family website.",
};

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Terms"
      title="Terms of Use"
      intro="These terms set expectations for using the family archive and contributing material to it."
      sections={[
        {
          title: "Use Of The Site",
          body: [
            "This website is intended for family history, research, remembrance, education, and community connection.",
            "Please use the site respectfully. Do not attempt to misuse forms, disrupt the service, access restricted areas, or submit harmful content.",
          ],
        },
        {
          title: "Contributions",
          body: [
            "When you submit memories, information, recipes, language notes, folklore, photos, documents, audio, or video, you confirm that you have the right to share that material with the family archive.",
            "You allow the site maintainers to review, store, edit for clarity or formatting, decline, publish, or remove submitted material as appropriate for the archive.",
          ],
        },
        {
          title: "Accuracy",
          body: [
            "Family history can contain incomplete, conflicting, or evolving information. We make reasonable efforts to present information carefully, but the archive may contain errors.",
            "Corrections and additional context are welcome through the contribution or contact forms.",
          ],
        },
        {
          title: "Respect For Family Members",
          body: [
            "Do not submit content that is abusive, invasive, intentionally misleading, or harmful to living people.",
            "The maintainers may remove or restrict content that raises privacy, safety, copyright, or family-sensitivity concerns.",
          ],
        },
        {
          title: "Changes",
          body: [
            "These terms may be updated as the archive grows and new contribution features are added. Continued use of the site means you accept the current terms.",
          ],
        },
      ]}
    />
  );
}
