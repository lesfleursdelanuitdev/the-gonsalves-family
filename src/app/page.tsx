import { Navbar } from "@/components/navbar";
import {
  Hero,
  PeopleStoriesMediaSection,
  JourneyStrip,
  IdentitySection,
  DiasporaSection,
  ArchivePreview,
  AnniversariesBirthdaysSection,
  TreePreview,
  FindFamilyMembersSection,
  ContributeSection,
  AboutThisSiteSection,
  Footer,
} from "@/components/homepage";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <Navbar />
      <main className="flex-1 overflow-visible">
        <Hero />
        <PeopleStoriesMediaSection />
        <JourneyStrip />
        <IdentitySection />
        <DiasporaSection />
        <ArchivePreview />
        <AnniversariesBirthdaysSection />
        <TreePreview />
        <FindFamilyMembersSection />
        <AboutThisSiteSection />
        <ContributeSection />
      </main>
      <Footer />
    </div>
  );
}
