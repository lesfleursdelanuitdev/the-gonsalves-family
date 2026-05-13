import { permanentRedirect } from "next/navigation";

/** Legacy URL: curated public albums live at `/media/album/[albumId]`. */
export default async function LegacyAlbumsIdRedirect(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  permanentRedirect(`/media/album/${encodeURIComponent(id)}`);
}
