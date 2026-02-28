import { PageContainer, Crest } from "@/components/wireframe";
import { ThemeToggle } from "@/components/ThemeToggle";

const NAV_LINKS = [
  "Home",
  "Tree",
  "Stories",
  "Archive",
  "Culture",
];

export function Header() {
  return (
    <header className="font-body border-b border-border py-0.5 bg-surface">
      <PageContainer>
        <div className="flex items-center gap-8">
          <Crest size="md" />
          <nav className="flex flex-wrap gap-4">
            {NAV_LINKS.map((link) => (
              <a key={link} href="#" className="text-link hover:underline">
                {link}
              </a>
            ))}
          </nav>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>
      </PageContainer>
    </header>
  );
}
