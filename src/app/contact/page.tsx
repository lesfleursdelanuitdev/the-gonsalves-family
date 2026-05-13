import { Navbar } from "@/components/homepage/HeroAndMenu/Navbar";
import { ContactView } from "@/components/contact/ContactView";

export const dynamic = "force-dynamic";

export default function ContactPage() {
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <Navbar />
      <ContactView />
    </div>
  );
}
