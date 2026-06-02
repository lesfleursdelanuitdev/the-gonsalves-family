"use client";

import { StoryBlockRenderer } from "@/components/stories/StoryBlockRenderer";
import type { ViewerCoverPage, ViewerChapterOpenerPage, ViewerBodyPage, ViewerEssayPage, ViewerPage, ViewerSectionEntityLink } from "@/lib/stories/story-viewer-utils";
import type { StoryFieldKey } from "@/lib/stories/tiptap/field-keys";

function entityLinkHref(link: ViewerSectionEntityLink): string {
  switch (link.entityType) {
    case "person": return `/individuals/${encodeURIComponent(link.entityId)}`;
    case "family": return `/families/${encodeURIComponent(link.entityId)}`;
    case "event": return `/tree/events/${encodeURIComponent(link.entityId)}`;
    case "place": return `/tree/places/${encodeURIComponent(link.entityId)}`;
  }
}

function SectionEntityChips({ links }: { links: ViewerSectionEntityLink[] }) {
  if (!links.length) return null;
  return (
    <div className="sv-section-entity-links">
      {links.map((link) => (
        <a key={link.entityId} href={entityLinkHref(link)} className="sv-section-entity-chip">
          {link.label}
        </a>
      ))}
    </div>
  );
}

function BlocksSkeleton() {
  return (
    <div className="sv-skeleton" role="status" aria-label="Loading content">
      {/* Paragraph 1 */}
      <div className="sv-skeleton-line sv-skeleton-line--wide" />
      <div className="sv-skeleton-line sv-skeleton-line--wide" />
      <div className="sv-skeleton-line sv-skeleton-line--wide" />
      <div className="sv-skeleton-line sv-skeleton-line--medium" />
      {/* Paragraph break */}
      <div className="sv-skeleton-gap" />
      {/* Paragraph 2 */}
      <div className="sv-skeleton-line sv-skeleton-line--wide" />
      <div className="sv-skeleton-line sv-skeleton-line--wide" />
      <div className="sv-skeleton-line sv-skeleton-line--wide" />
      <div className="sv-skeleton-line sv-skeleton-line--wide" />
      <div className="sv-skeleton-line sv-skeleton-line--narrow" />
    </div>
  );
}

type StoryFields = { title: string; subtitle: string; author: string };
type StoryFieldFn = (field: StoryFieldKey) => string;

function makeFieldFn(fields: StoryFields): StoryFieldFn {
  return (field) => {
    if (field === "title") return fields.title;
    if (field === "subtitle") return fields.subtitle;
    return fields.author;
  };
}

// ── Cover page ───────────────────────────────────────────────────────────────

type CoverMeta = {
  collection: string;
  catalog: string;
  subtitle: string | null;
  edition: string | null;
  pages: number | null;
  coverSrc: string | null;
  coverCaption: string | null;
  credits: { role: string | null; name: string; note?: string | null; personId?: string }[];
};

export function CoverPage({ page, meta }: { page: ViewerCoverPage; meta: CoverMeta }) {
  return (
    <article className="sv-page-card">
      <div className="sv-cover-eyebrow">
        <span>{meta.collection}</span>
        <span className="hl">{meta.catalog}</span>
      </div>

      <figure className="sv-cover-image-wrap">
        {meta.coverSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={meta.coverSrc} alt="" />
        ) : null}
        <div className="sv-cover-image-vignette" aria-hidden />
        {meta.coverCaption ? (
          <div className="sv-cover-caption" aria-hidden>
            <span>Family Portrait</span>
            <span>{meta.coverCaption}</span>
          </div>
        ) : null}
      </figure>

      <div className="sv-cover-collection">Volume I · {meta.collection}</div>
      <h1 className="sv-cover-title" dangerouslySetInnerHTML={{ __html: page.title }} />
      {meta.subtitle ? <p className="sv-cover-subtitle">{meta.subtitle}</p> : null}

      {meta.credits.length > 0 ? (
        <div className="sv-cover-credits">
          {meta.credits.map((c, i) => (
            <div key={i} className="sv-credit">
              {c.role ? <div className="sv-credit-role">{c.role}</div> : null}
              <div className="sv-credit-name">
                {c.personId ? (
                  <a href={`/individuals/${encodeURIComponent(c.personId)}`} className="sv-credit-name--linked">
                    {c.name}
                  </a>
                ) : (
                  c.name
                )}
              </div>
              {c.note ? <div className="sv-credit-note">{c.note}</div> : null}
            </div>
          ))}
        </div>
      ) : null}

      {(meta.edition || meta.pages) ? (
        <div className="sv-cover-edition">
          <span>{meta.edition ?? ""}</span>
          {meta.pages ? <span>{meta.pages} pp.</span> : null}
        </div>
      ) : null}
    </article>
  );
}

// ── Chapter opener page ──────────────────────────────────────────────────────

export function ChapterOpenerPage({ page }: { page: ViewerChapterOpenerPage }) {
  return (
    <article className="sv-page-card sv-chapter-opener-card">
      <div className="sv-running-head">{page.chapterNumber}</div>

      <div className="sv-chapter-body">
        <div className="sv-chapter-num-block">
          <span className="ch-label">{page.chapterNumber.toUpperCase()}</span>
          <span>·</span>
          <span>p. {page.folio}</span>
        </div>

        {!page.hideTitle ? (
          <h2 className="sv-chapter-title" dangerouslySetInnerHTML={{ __html: page.title }} />
        ) : null}

        {page.subtitle && !page.hideSubtitle ? (
          <p className="sv-chapter-dek">{page.subtitle}</p>
        ) : null}
        <SectionEntityChips links={page.entityLinks} />
      </div>

      <div className="sv-folio">— {page.folio} —</div>
    </article>
  );
}

// ── Body page ────────────────────────────────────────────────────────────────

export function BodyPage({
  page,
  fields,
  loading,
}: {
  page: ViewerBodyPage;
  fields: StoryFields;
  loading?: boolean;
}) {
  const storyFieldHtml = makeFieldFn(fields);
  return (
    <article className="sv-page-card">
      <div className="sv-running-head">{page.title}</div>
      <div className="sv-prose">
        {loading ? (
          <BlocksSkeleton />
        ) : (
          page.blocks.map((b, i) => (
            <StoryBlockRenderer key={b.id ?? i} block={b} storyFieldHtml={storyFieldHtml} />
          ))
        )}
      </div>
      <div className="sv-folio">— {page.folio} —</div>
    </article>
  );
}

// ── Essay page ───────────────────────────────────────────────────────────────

export function EssayPage({
  page,
  fields,
  loading,
}: {
  page: ViewerEssayPage;
  fields: StoryFields;
  loading?: boolean;
}) {
  const storyFieldHtml = makeFieldFn(fields);
  return (
    <article className="sv-page-card">
      <div className="sv-running-head">{page.title}</div>

      {page.subtitle && !page.hideSubtitle ? (
        <div className="sv-essay-eyebrow">{page.subtitle}</div>
      ) : null}

      {!page.hideTitle ? (
        <h2 className="sv-essay-title">{page.title}</h2>
      ) : null}
      <SectionEntityChips links={page.entityLinks} />

      <div className="sv-prose">
        {loading ? (
          <BlocksSkeleton />
        ) : (
          page.blocks.map((b, i) => (
            <StoryBlockRenderer key={b.id ?? i} block={b} storyFieldHtml={storyFieldHtml} />
          ))
        )}
      </div>

      <div className="sv-folio">— {page.folio} —</div>
    </article>
  );
}

// ── Page dispatcher ──────────────────────────────────────────────────────────

export function ViewerPageRenderer({
  page,
  meta,
  fields,
  loading,
}: {
  page: ViewerPage;
  meta: CoverMeta;
  fields: StoryFields;
  loading?: boolean;
}) {
  if (page.pageKind === "cover") return <CoverPage page={page} meta={meta} />;
  if (page.pageKind === "chapter-opener") return <ChapterOpenerPage page={page} />;
  if (page.pageKind === "body") return <BodyPage page={page} fields={fields} loading={loading} />;
  if (page.pageKind === "essay") return <EssayPage page={page} fields={fields} loading={loading} />;
  return null;
}

// ── Article view ─────────────────────────────────────────────────────────────

type ArticleSection =
  | { kind: "chapter"; id: string; opener: ViewerChapterOpenerPage; bodies: ViewerBodyPage[] }
  | { kind: "essay"; id: string; page: ViewerEssayPage };

function buildArticleSections(pages: ViewerPage[]): ArticleSection[] {
  const sections: ArticleSection[] = [];
  const seenChapters = new Map<string, ArticleSection & { kind: "chapter" }>();

  for (const p of pages) {
    if (p.pageKind === "cover") continue;

    if (p.pageKind === "chapter-opener") {
      const sec = { kind: "chapter" as const, id: p.chapterId, opener: p, bodies: [] };
      seenChapters.set(p.chapterId, sec);
      sections.push(sec);
    } else if (p.pageKind === "body") {
      seenChapters.get(p.chapterId)?.bodies.push(p);
    } else if (p.pageKind === "essay") {
      sections.push({ kind: "essay", id: p.id, page: p });
    }
  }

  return sections;
}

export function ArticleView({
  pages,
  meta,
  fields,
  loadedSectionIds,
  registerSection,
}: {
  pages: ViewerPage[];
  meta: CoverMeta;
  fields: StoryFields;
  loadedSectionIds?: Set<string>;
  registerSection?: (id: string, el: HTMLElement | null) => void;
}) {
  const storyFieldHtml = makeFieldFn(fields);
  const sections = buildArticleSections(pages);
  const coverPage = pages.find((p) => p.pageKind === "cover");

  return (
    <div className="sv-article">
      {/* Hero */}
      <header
        className="sv-article-hero"
        ref={(el) => registerSection?.("cover", el)}
        id="sv-section-cover"
      >
        <div className="sv-article-eyebrow">
          <span>{meta.collection}</span>
          <span>·</span>
          <span className="hl">{meta.catalog}</span>
        </div>

        <figure className="sv-article-hero-image">
          {meta.coverSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={meta.coverSrc} alt="" />
          ) : null}
          <div className="sv-cover-image-vignette" aria-hidden />
        </figure>

        <h1 className="sv-article-title" dangerouslySetInnerHTML={{ __html: coverPage?.title ?? meta.collection }} />
        {meta.subtitle ? <p className="sv-article-subtitle">{meta.subtitle}</p> : null}

        {meta.credits.length > 0 ? (
          <div className="sv-article-credits">
            {meta.credits.map((c, i) => (
              <div key={i} className="sv-article-credit">
                {c.role ? <span className="sv-credit-role">{c.role}</span> : null}
                <span className="sv-credit-name">{c.name}</span>
                {c.note ? <span className="sv-credit-note">{c.note}</span> : null}
              </div>
            ))}
          </div>
        ) : null}

        <div className="sv-article-meta-strip">
          {meta.edition ? <span>{meta.edition}</span> : null}
          {meta.edition && meta.pages ? <span className="dot-sep">◦</span> : null}
          {meta.pages ? <span>{meta.pages} pp.</span> : null}
          {sections.filter((s) => s.kind === "chapter").length > 0 ? (
            <>
              <span className="dot-sep">◦</span>
              <span>{sections.filter((s) => s.kind === "chapter").length} chapters</span>
            </>
          ) : null}
        </div>
      </header>

      {/* Sections */}
      {sections.map((s) => {
        if (s.kind === "chapter") {
          const isLoading = s.bodies.some((b) => loadedSectionIds && !loadedSectionIds.has(b.sectionId));
          const allBlocks = s.bodies.flatMap((b) => b.blocks);
          return (
            <section
              key={s.id}
              id={`sv-section-${s.id}`}
              className="sv-article-section"
              ref={(el) => registerSection?.(s.id, el)}
            >
              <header className="sv-article-chapter-head">
                <div className="sv-chapter-num-block">
                  <span className="ch-label">{s.opener.chapterNumber.toUpperCase()}</span>
                  <span>·</span>
                  <span>from p. {s.opener.folio}</span>
                </div>
                {!s.opener.hideTitle ? (
                  <h2 className="sv-article-chapter-title" dangerouslySetInnerHTML={{ __html: s.opener.title }} />
                ) : null}
                {s.opener.subtitle && !s.opener.hideSubtitle ? (
                  <p className="sv-article-chapter-dek">{s.opener.subtitle}</p>
                ) : null}
              </header>
              <div className="sv-prose">
                {isLoading ? (
                  <BlocksSkeleton />
                ) : (
                  allBlocks.map((b, i) => (
                    <StoryBlockRenderer key={b.id ?? i} block={b} storyFieldHtml={storyFieldHtml} />
                  ))
                )}
              </div>
            </section>
          );
        }

        const p = s.page;
        const isLoading = loadedSectionIds ? !loadedSectionIds.has(p.sectionId) : false;
        return (
          <section
            key={s.id}
            id={`sv-section-${s.id}`}
            className="sv-article-section"
            ref={(el) => registerSection?.(s.id, el)}
          >
            <header className="sv-article-section-head">
              {p.subtitle && !p.hideSubtitle ? <div className="sv-essay-eyebrow">{p.subtitle}</div> : null}
              {!p.hideTitle ? <h2 className="sv-article-essay-title">{p.title}</h2> : null}
            </header>
            <div className="sv-prose">
              {isLoading ? (
                <BlocksSkeleton />
              ) : (
                p.blocks.map((b, i) => (
                  <StoryBlockRenderer key={b.id ?? i} block={b} storyFieldHtml={storyFieldHtml} />
                ))
              )}
            </div>
          </section>
        );
      })}

      {/* Coda */}
      <footer className="sv-article-coda">
        <div className="sv-coda-rule" aria-hidden />
        <div className="sv-coda-mark" aria-hidden>W</div>
        <div className="sv-coda-meta">
          End of {meta.collection} · {meta.catalog}
          {meta.edition ? ` · ${meta.edition}` : ""}
        </div>
      </footer>
    </div>
  );
}
