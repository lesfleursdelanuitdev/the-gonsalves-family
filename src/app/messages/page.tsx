import { Suspense } from "react";
import { PublicMessagesInboxPage } from "@/components/messages/PublicMessagesInboxPage";

export default function MessagesPage() {
  return (
    <Suspense fallback={<p className="px-4 pt-28 text-muted">Loading messages…</p>}>
      <PublicMessagesInboxPage />
    </Suspense>
  );
}
