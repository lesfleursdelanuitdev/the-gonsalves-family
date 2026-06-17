import { PublicMessageDetailView } from "@/components/messages/PublicMessageDetailView";

type Params = Promise<{ id: string }>;

export default async function MessageDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  return <PublicMessageDetailView messageId={id} />;
}
