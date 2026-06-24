import Link from "next/link";
import type { AlbumMediaLinkedIndividual } from "@ligneous/album-view";
import { countFeaturedPeople } from "@/lib/auth/living-person-privacy";

type FeaturedPerson = Pick<AlbumMediaLinkedIndividual, "id" | "displayName" | "isLivingSummary">;

export function FeaturedPeopleLinks({
  people,
  totalCount,
  linkClassName = "font-medium text-link hover:text-link-hover hover:underline",
}: {
  people: FeaturedPerson[];
  totalCount?: number;
  linkClassName?: string;
}) {
  if (people.length === 0) return null;
  const count = totalCount ?? countFeaturedPeople(people);

  return (
    <p className="mt-2 text-sm leading-relaxed text-text">
      {people.map((person, index) => (
        <span key={person.id} className="inline">
          {index > 0 ? <span aria-hidden>, </span> : null}
          {person.isLivingSummary ? (
            <span className="font-medium text-muted">{person.displayName}</span>
          ) : (
            <Link
              href={`/media/album-view?kind=generated&type=individual&id=${encodeURIComponent(person.id)}`}
              className={linkClassName}
            >
              {person.displayName}
            </Link>
          )}
        </span>
      ))}
      <span className="sr-only"> ({count} people featured)</span>
    </p>
  );
}

export function FeaturedPeopleHeading({ count }: { count: number }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8b2e2e]">
      People Featured ({count})
    </p>
  );
}
