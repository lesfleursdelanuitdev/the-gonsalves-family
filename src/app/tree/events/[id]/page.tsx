import { notFound } from "next/navigation";
import { EventProfilePage } from "@/components/events/EventProfilePage";
import { loadPublicEventById } from "@/lib/events/load-public-events";

type Params = Promise<{ id: string }>;

export default async function EventProfileRoute({ params }: { params: Params }) {
  const { id } = await params;
  const event = await loadPublicEventById(id);
  if (!event) return notFound();
  return <EventProfilePage event={event} />;
}
