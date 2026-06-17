import { redirect } from "next/navigation";

/** Homepage “See more dates…” links here; full list lives on upcoming anniversaries. */
export default function DatesPage() {
  redirect("/more/upcoming-anniversaries");
}
