import { Navbar } from "@/components/homepage/HeroAndMenu/Navbar";
import { RequestAccountView } from "@/components/auth/RequestAccountView";

export const dynamic = "force-dynamic";

export default function RequestAccountPage() {
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <Navbar />
      <RequestAccountView />
    </div>
  );
}
