"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Send } from "lucide-react";
import { Navbar } from "@/components/homepage/HeroAndMenu/Navbar";
import { PageContainer, Section } from "@/components/wireframe";
import { usePublicMessageRecipients, useSendPublicMessage } from "@/hooks/usePublicMessages";

export function PublicMessageComposePage() {
  const router = useRouter();
  const [recipientId, setRecipientId] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { data: recipients = [], isPending: recipientsPending } = usePublicMessageRecipients(search);
  const send = useSendPublicMessage();

  const selectedRecipient = useMemo(
    () => recipients.find((r) => r.id === recipientId),
    [recipients, recipientId],
  );

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!recipientId || !content.trim()) return;
    setError(null);
    try {
      await send.mutateAsync({
        recipientId,
        subject: subject.trim() || undefined,
        content: content.trim(),
      });
      router.push("/messages?folder=sent");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send message");
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <Navbar />
      <PageContainer className="pt-28 pb-16">
        <Section>
          <Link href="/messages" className="text-sm text-link underline">
            ← Back to messages
          </Link>
          <h1 className="mt-4 font-heading text-3xl font-semibold text-heading">New message</h1>

          <form onSubmit={handleSubmit} className="mt-8 max-w-xl space-y-4">
            <div>
              <label htmlFor="recipient-search" className="mb-1 block text-sm font-medium text-heading">
                To
              </label>
              <input
                id="recipient-search"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search community members…"
                className="mb-2 w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm"
              />
              <select
                id="recipient"
                value={recipientId}
                onChange={(e) => setRecipientId(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm"
                required
              >
                <option value="">
                  {recipientsPending ? "Loading members…" : "Select a recipient"}
                </option>
                {recipients.map((recipient) => (
                  <option key={recipient.id} value={recipient.id}>
                    {recipient.displayName} (@{recipient.username})
                  </option>
                ))}
              </select>
              {selectedRecipient ? (
                <p className="mt-1 text-xs text-muted">Sending to {selectedRecipient.displayName}</p>
              ) : null}
            </div>

            <div>
              <label htmlFor="subject" className="mb-1 block text-sm font-medium text-heading">
                Subject
              </label>
              <input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm"
                placeholder="Optional subject"
              />
            </div>

            <div>
              <label htmlFor="content" className="mb-1 block text-sm font-medium text-heading">
                Message
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={8}
                required
                className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm"
                placeholder="Write your message…"
              />
            </div>

            {error ? <p className="text-sm text-red-700">{error}</p> : null}

            <button
              type="submit"
              disabled={send.isPending || !recipientId || !content.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              <Send className="h-4 w-4" aria-hidden />
              {send.isPending ? "Sending…" : "Send message"}
            </button>
          </form>
        </Section>
      </PageContainer>
    </div>
  );
}
