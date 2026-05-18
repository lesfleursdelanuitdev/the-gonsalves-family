import { NotesPage } from "@/components/notes/NotesPage";
import { loadPublicNotes } from "@/lib/notes/load-public-notes";

export const metadata = {
  title: "Notes | The Gonsalves Family",
  description: "Research notes and remarks from our family tree.",
};

export default async function ArchiveNotesRoutePage() {
  const notes = await loadPublicNotes();
  return <NotesPage notes={notes} />;
}
