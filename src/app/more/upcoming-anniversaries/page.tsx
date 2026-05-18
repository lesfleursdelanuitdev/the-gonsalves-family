import type { Metadata } from "next";
import { UpcomingAnniversariesPage } from "@/components/upcoming-anniversaries/UpcomingAnniversariesPage";
import { loadUpcomingAnniversariesPageData } from "@/lib/upcoming-anniversaries/load-upcoming-anniversaries-page-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Upcoming anniversaries · The Gonsalves Family",
  description:
    "Upcoming birthdays, death anniversaries, and marriage anniversaries from our family tree in the next three months.",
};

export default async function UpcomingAnniversariesRoute() {
  const data = await loadUpcomingAnniversariesPageData();

  if (!data) {
    return (
      <div className="flex min-h-screen flex-col bg-bg">
        <p className="px-4 pb-8 pt-28 text-sm text-muted-foreground">Tree not available.</p>
      </div>
    );
  }

  return <UpcomingAnniversariesPage data={data} />;
}
