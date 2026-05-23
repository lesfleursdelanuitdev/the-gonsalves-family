import { EventsPage } from "@/components/events/EventsPage";
import { loadPublicEvents } from "@/lib/events/load-public-events";

export default async function EventsRoutePage() {
  const events = await loadPublicEvents();
  return <EventsPage events={events} />;
}
