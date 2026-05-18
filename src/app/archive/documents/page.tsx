import { permanentRedirect } from "next/navigation";

/** Archive entry point for document media; lands on the Media hub documents collection. */
export default function ArchiveDocumentsPage() {
  permanentRedirect("/media?collection=documents");
}
