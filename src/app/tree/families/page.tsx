import { redirect } from "next/navigation";

/** Legacy nav URL — public browse lives at `/families`. */
export default function TreeFamiliesRedirectPage() {
  redirect("/families");
}
