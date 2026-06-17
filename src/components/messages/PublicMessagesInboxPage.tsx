"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { MailPlus } from "lucide-react";
import { Navbar } from "@/components/homepage/HeroAndMenu/Navbar";
import { PageContainer, Section } from "@/components/wireframe";
import { usePublicSession } from "@/hooks/usePublicSession";
import { usePublicMessages, type PublicMessageListItem } from "@/hooks/usePublicMessages";

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}

function peerLabel(message: PublicMessageListItem, userId: string, folder: "inbox" | "sent"): string {
  if (folder === "sent") return message.recipient?.displayName ?? "Recipient";
  return message.sender.displayName;
}

export function PublicMessagesInboxPage() {
  const searchParams = useSearchParams();
  const folder = searchParams.get("folder") === "sent" ? "sent" : "inbox";
  const { user } = usePublicSession();
  const { data, isPending, error } = usePublicMessages(folder);

  const messages = useMemo(() => data?.messages ?? [], [data?.messages]);

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <Navbar />
      <PageContainer className="pt-28 pb-16">
        <Section>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="section-subtitle mb-2">Members</p>
              <h1 className="font-heading text-3xl font-semibold text-heading">Messages</h1>
            </div>
            <Link
              href="/messages/compose"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
            >
              <MailPlus className="h-4 w-4" aria-hidden />
              New message
            </Link>
          </div>

          <div className="mt-6 flex gap-2">
            <Link
              href="/messages"
              className={`rounded-lg px-4 py-2 text-sm font-medium ${folder === "inbox" ? "bg-primary text-primary-foreground" : "bg-surface-elevated text-heading"}`}
            >
              Inbox
            </Link>
            <Link
              href="/messages?folder=sent"
              className={`rounded-lg px-4 py-2 text-sm font-medium ${folder === "sent" ? "bg-primary text-primary-foreground" : "bg-surface-elevated text-heading"}`}
            >
              Sent
            </Link>
          </div>

          {isPending ? <p className="mt-8 text-muted">Loading…</p> : null}
          {error ? <p className="mt-8 text-muted">Unable to load messages.</p> : null}

          {!isPending && !error && messages.length === 0 ? (
            <p className="mt-8 text-muted">
              No messages yet.{" "}
              <Link href="/messages/compose" className="text-link underline">
                Send one
              </Link>
              .
            </p>
          ) : null}

          <ul className="mt-6 divide-y divide-border-subtle rounded-2xl border border-border/80 bg-surface-elevated">
            {user
              ? messages.map((message) => (
                  <li key={message.id}>
                    <Link
                      href={`/messages/${encodeURIComponent(message.id)}`}
                      className="flex items-start justify-between gap-4 px-4 py-4 transition hover:bg-surface"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-heading">
                          {!message.isRead && folder === "inbox" ? (
                            <span className="mr-2 inline-block h-2 w-2 rounded-full bg-link align-middle" aria-hidden />
                          ) : null}
                          {peerLabel(message, user.id, folder)}
                        </p>
                        <p className="truncate text-sm text-heading">
                          {message.subject?.trim() || message.contentPreview}
                        </p>
                        <p className="mt-1 line-clamp-2 text-xs text-muted">{message.contentPreview}</p>
                      </div>
                      <time className="shrink-0 text-xs text-muted">{formatWhen(message.createdAt)}</time>
                    </Link>
                  </li>
                ))
              : null}
          </ul>
        </Section>
      </PageContainer>
    </div>
  );
}
