import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy | The Gonsalves Family",
  description: "How The Gonsalves Family website handles submitted information and family archive data.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Privacy"
      title="Privacy Policy"
      intro="This family archive is built to preserve stories with care. This policy explains what information we collect, why we collect it, and how we handle it."
      sections={[
        {
          title: "Information We Collect",
          body: [
            "We may collect information you choose to share, including account requests, contact messages, contributions, names, email addresses, memories, corrections, recipes, language notes, folklore, and uploaded media.",
            "For security and abuse prevention, we may also record basic technical details such as IP address, browser user agent, and submission timestamps.",
          ],
        },
        {
          title: "How We Use Information",
          body: [
            "We use submitted information to review account requests, respond to messages, moderate contributions, improve the family archive, and preserve family history.",
            "Public contributions are reviewed before they are added to the visible archive. Submitting something does not guarantee that it will be published.",
          ],
        },
        {
          title: "Family Tree And Living People",
          body: [
            "Genealogy data can include sensitive family context. We try to treat living people and private family details with care and may limit, edit, or remove information when appropriate.",
            "If you believe something should be corrected, hidden, or removed, please contact us through the contact page.",
          ],
        },
        {
          title: "Sharing And Retention",
          body: [
            "We do not sell family archive submissions or contact details. Information may be visible to site maintainers who help review, administer, or preserve the archive.",
            "We retain submitted information as long as needed for review, archival, security, or family-history purposes unless removal is requested and appropriate.",
          ],
        },
        {
          title: "Contact",
          body: [
            "For privacy questions, corrections, or removal requests, use the Contact Us page and include enough detail for us to identify the record or submission.",
          ],
        },
      ]}
    />
  );
}
