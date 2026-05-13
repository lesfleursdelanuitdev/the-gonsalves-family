import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Accessibility | The Gonsalves Family",
  description: "Accessibility statement for The Gonsalves Family website.",
};

export default function AccessibilityPage() {
  return (
    <LegalPage
      eyebrow="Access"
      title="Accessibility"
      intro="We want this family archive to be usable by as many relatives, researchers, and visitors as possible."
      sections={[
        {
          title: "Our Commitment",
          body: [
            "We aim to provide a website that is readable, navigable, and usable across devices, screen sizes, and assistive technologies.",
            "Accessibility is ongoing work. As the archive grows, we will continue improving structure, contrast, keyboard support, labels, and responsive layouts.",
          ],
        },
        {
          title: "What We Prioritize",
          body: [
            "We try to use meaningful headings, descriptive links, readable text, keyboard-accessible controls, form labels, and image alternatives where appropriate.",
            "Some historical images, documents, and media may be difficult to describe fully. We welcome additional context from family members and visitors.",
          ],
        },
        {
          title: "Known Limits",
          body: [
            "Interactive family-tree views, archival media, and older records may present accessibility challenges because of their visual or historical nature.",
            "When possible, we provide alternative ways to browse people, media, stories, and family details outside of complex visual interfaces.",
          ],
        },
        {
          title: "Feedback",
          body: [
            "If you encounter an accessibility barrier, please contact us and describe the page, device, browser, assistive technology if applicable, and what was difficult to use.",
            "We will review accessibility feedback and prioritize practical fixes that make the archive easier to use.",
          ],
        },
      ]}
    />
  );
}
