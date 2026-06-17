"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MailPlus, Send } from "lucide-react";
import { Navbar } from "@/components/homepage/HeroAndMenu/Navbar";
import { PageContainer, Section } from "@/components/wireframe";
import { usePublicSession } from "@/hooks/usePublicSession";
import {
  useMarkPublicMessageRead,
  usePublicMessage,
  useSendPublicMessage,
} from "@/hooks/usePublicMessages";

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export function PublicMessageDetailView({ messageId }: { messageId: string }) {
  const router = useRouter();
  const { user } = usePublicSession();
  const { data: message, isPending, error } = usePublicMessage(messageId);
  const markRead = useMarkPublicMessageRead();
  const send = useSendPublicMessage();
  const [reply, setReply] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);

  useEffect(() => {
    if (!message || !user || message.recipient?.id !== user.id || message.isRead) return;
    void markRead.mutate({ id: message.id, isRead: true });
  }, [message, user, markRead]);

  async function handleReply(event: React.FormEvent) {
    event.preventDefault();
    if (!message || !user) return;
    const content = reply.trim();
    if (!content) return;

    const recipientId =
      message.sender.id === user.id ? message.recipient?.id : message.sender.id;
    if (!recipientId) return;

    setSendError(null);
    try {
      await send.mutateAsync({
        recipientId,
        subject: message.subject ? `Re: ${message.subject.replace(/^Re:\s*/i, "")}` : undefined,
        content,
        conversationId: message.conversationId,
      });
      setReply("");
      router.push("/messages?folder=sent");
      router.refresh();
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Could not send reply");
    }
  }

  if (isPending) {
    return (
      <div className="flex min-h-screen flex-col bg-bg">
        <Navbar />
        <PageContainer className="pt-28">
          <p className="text-muted">Loading message…</p>
        </PageContainer>
      </div>
    );
  }

  if (error || !message) {
    return (
      <div className="flex min-h-screen flex-col bg-bg">
        <Navbar />
        <PageContainer className="pt-28">
          <p className="text-muted">Message not found.</p>
          <Link href="/messages" className="mt-4 inline-block text-link underline">
            Back to inbox
          </Link>
        </PageContainer>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <Navbar />
      <PageContainer className="pt-28 pb-16">
        <Section>
          <Link href="/messages" className="text-sm text-link underline">
            ← Back to messages
          </Link>
          <article className="mt-6 max-w-2xl rounded-2xl border border-border/80 bg-surface-elevated p-6 shadow-sm">
            <header className="space-y-1 border-b border-border-subtle pb-4">
              <h1 className="font-heading text-2xl font-semibold text-heading">
                {message.subject?.trim() || "Message"}
              </h1>
              <p className="text-sm text-muted">
                From <span className="font-medium text-heading">{message.sender.displayName}</span>
                {message.recipient ? (
                  <>
                    {" "}
                    to <span className="font-medium text-heading">{message.recipient.displayName}</span>
                  </>
                ) : null}
              </p>
              <p className="text-xs text-muted">{formatWhen(message.createdAt)}</p>
            </header>
            <div className="mt-4 max-w-none whitespace-pre-wrap text-sm leading-relaxed text-heading">
              {message.content}
            </div>
          </article>

          <form onSubmit={handleReply} className="mt-8 max-w-2xl space-y-3">
            <h2 className="font-heading text-lg font-semibold text-heading">Reply</h2>
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              rows={5}
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-heading"
              placeholder="Write your reply…"
              required
            />
            {sendError ? <p className="text-sm text-red-700">{sendError}</p> : null}
            <button
              type="submit"
              disabled={send.isPending || !reply.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              <Send className="h-4 w-4" aria-hidden />
              {send.isPending ? "Sending…" : "Send reply"}
            </button>
          </form>
        </Section>
      </PageContainer>
    </div>
  );
}
