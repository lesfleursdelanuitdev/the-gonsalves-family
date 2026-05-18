import { FamilyCard } from "@/components/families/FamilyCard";
import { PersonCard } from "@/components/individuals/PersonCard";
import type { CardOccasionHighlight } from "@/components/cards/card-occasion";
import type { UpcomingAnniversaryItem } from "@/lib/upcoming-anniversaries/group-upcoming-anniversaries";

function toCardOccasion(item: UpcomingAnniversaryItem): CardOccasionHighlight {
  return {
    eventType: item.eventType,
    title: item.occasionTitle,
    subtitle: item.occasionSubtitle,
    calendarDayLabel: item.calendarDayLabel,
  };
}

export function UpcomingAnniversaryOccasionCard({ item }: { item: UpcomingAnniversaryItem }) {
  const occasion = toCardOccasion(item);
  if (item.kind === "person") {
    return <PersonCard person={item.person} occasion={occasion} />;
  }
  return <FamilyCard family={item.family} occasion={occasion} />;
}
