import { redirect } from "next/navigation";

export default async function StoryViewerRedirect(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  redirect(`/stories/${encodeURIComponent(slug)}`);
}
