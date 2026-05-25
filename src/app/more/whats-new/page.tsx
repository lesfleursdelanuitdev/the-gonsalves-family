import type { Metadata } from "next";
import { generateHTML } from "@tiptap/core";
import type { JSONContent } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { prisma } from "@/lib/database/prisma";
import { ResearchPageShell } from "@/components/research/ResearchPageShell";

export const metadata: Metadata = {
  title: "What's New · The Gonsalves Family",
  description: "Latest announcements and updates from the Gonsalves Family Archive.",
};

export const revalidate = 60;

function renderBody(body: unknown): string {
  if (!body || typeof body !== "object") return "";
  try {
    return generateHTML(body as JSONContent, [
      StarterKit,
      Link.configure({
        HTMLAttributes: { rel: "noopener noreferrer nofollow", target: "_blank" },
      }),
    ]);
  } catch {
    return "";
  }
}

export default async function WhatsNewPage() {
  let posts: {
    id: string;
    title: string;
    body: unknown;
    publishedAt: Date | null;
    author: { name: string | null; username: string };
  }[] = [];

  try {
    posts = await prisma.whatsNew.findMany({
      where: { status: "published" },
      orderBy: { publishedAt: "desc" },
      select: {
        id: true,
        title: true,
        body: true,
        publishedAt: true,
        author: { select: { name: true, username: true } },
      },
    });
  } catch {
    // non-fatal — show empty state
  }

  return (
    <ResearchPageShell
      title="What's New"
      description="Latest announcements and updates from the Gonsalves Family Archive."
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "What's New" }]}
    >
      {posts.length === 0 ? (
        <p className="font-body text-sm text-muted">No updates have been published yet.</p>
      ) : (
        <div className="space-y-10">
          {posts.map((post) => {
            const html = renderBody(post.body);
            const dateStr = post.publishedAt
              ? new Date(post.publishedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : null;
            const authorLabel = post.author.name ?? post.author.username;

            return (
              <article
                key={post.id}
                className="rounded-xl border border-border-subtle bg-surface/40 px-6 py-6"
              >
                <header className="mb-4 space-y-1">
                  <h2 className="font-body text-xl font-semibold text-heading">{post.title}</h2>
                  {(dateStr || authorLabel) && (
                    <p className="font-body text-xs text-muted">
                      {dateStr ? `${dateStr}` : ""}
                      {dateStr && authorLabel ? " · " : ""}
                      {authorLabel ? `By ${authorLabel}` : ""}
                    </p>
                  )}
                </header>
                {html ? (
                  <div
                    className="prose prose-sm max-w-none font-body text-text [&_a]:text-link [&_a]:underline [&_a:hover]:text-link-hover"
                    dangerouslySetInnerHTML={{ __html: html }}
                  />
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </ResearchPageShell>
  );
}
