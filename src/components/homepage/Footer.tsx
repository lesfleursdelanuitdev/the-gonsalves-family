import { PageContainer, Crest, TextBlock } from "@/components/wireframe";

const FOOTER_LINKS = [
  "Home",
  "Tree",
  "Stories",
  "Archive",
  "Culture",
];

export function Footer() {
  return (
    <footer className="font-body border-t border-border py-8 bg-surface">
      <PageContainer>
        <div className="flex flex-col items-center gap-4 text-center">
          <Crest size="sm" />
          <nav className="flex flex-wrap justify-center gap-4">
            {FOOTER_LINKS.map((link) => (
              <a key={link} href="#" className="text-link hover:underline">
                {link}
              </a>
            ))}
          </nav>
          <TextBlock>
            The Gonsalves Family — Rooted in Madeira. Grown in Guyana.
          </TextBlock>
        </div>
      </PageContainer>
    </footer>
  );
}
