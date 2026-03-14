import { redirect } from "next/navigation";

/**
 * Legacy search route. Redirects to the tree viewer search database page.
 */
export default function SearchPage() {
  redirect("/tree/viewer/searchDatabase");
}
