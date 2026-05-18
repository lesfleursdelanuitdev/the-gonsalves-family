import { permanentRedirect } from "next/navigation";

/** Former URL; canonical route is `/more/upcoming-anniversaries`. */
export default function TodaysAnniversariesRedirect() {
  permanentRedirect("/more/upcoming-anniversaries");
}
