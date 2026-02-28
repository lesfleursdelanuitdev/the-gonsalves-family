import { Navbar } from "@/components/Navbar";
import {
  Hero,
  JourneyStrip,
  DiasporaSection,
  IdentitySection,
  ArchivePreview,
  CulturePreview,
  TreePreview,
  ContributeSection,
  Footer,
} from "@/components/homepage";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <JourneyStrip />
        <DiasporaSection />
        <IdentitySection />
        <ArchivePreview />
        <CulturePreview />
        <TreePreview />
        <ContributeSection />
      </main>
      <Footer />
    </div>
  );
}
