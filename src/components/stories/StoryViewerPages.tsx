"use client";

import { StoryBlockRenderer } from "@/components/stories/StoryBlockRenderer";
import type { ViewerCoverPage, ViewerChapterOpenerPage, ViewerBodyPage, ViewerEssayPage, ViewerPage } from "@/lib/stories/story-viewer-utils";
import type { StoryFieldKey } from "@/lib/stories/tiptap/field-keys";

type StoryFields = { title: string; subtitle: string; author: string };
type StoryFieldFn = (field: StoryFieldKey) => string;

function makeFieldFn(fields: StoryFields): StoryFieldFn {
  return (field) => {
    if (field === "title") return fields.title;
    if (field === "subtitle") return fields.subtitle;
    return fields.author;
  };
}

// ── Registration marks ───────────────────────────────────────────────────────

function RegMarks() {
  return (
    <>
      <span className="sv-reg tl" aria-hidden />
      <span className="sv-reg tr" aria-hidden />
      <span className="sv-reg bl" aria-hidden />
      <span className="sv-reg br" aria-hidden />
    </>
  );
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
  credits: { role: string | null; name: string; note?: string | null }[];
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
              <div className="sv-credit-name">{c.name}</div>
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
    <article className="sv-page-card">
      <RegMarks />
      <div className="sv-running-head">{page.chapterNumber}</div>

      <div className="sv-chapter-body">
        <div className="sv-chapter-num-block">
          <span className="ch-label">{page.chapterNumber.toUpperCase()}</span>
          <span>·</span>
          <span>p. {page.folio}</span>
        </div>

        <h2 className="sv-chapter-title" dangerouslySetInnerHTML={{ __html: page.title }} />

        {page.subtitle ? (
          <p className="sv-chapter-dek">{page.subtitle}</p>
        ) : null}
      </div>

      <div className="sv-folio">— {page.folio} —</div>
    </article>
  );
}

// ── Body page ────────────────────────────────────────────────────────────────

export function BodyPage({
  page,
  fields,
}: {
  page: ViewerBodyPage;
  fields: StoryFields;
}) {
  const storyFieldHtml = makeFieldFn(fields);
  return (
    <article className="sv-page-card">
      <RegMarks />
      <div className="sv-running-head">{page.title}</div>
      <div className="sv-prose">
        {page.blocks.map((b, i) => (
          <StoryBlockRenderer key={b.id ?? i} block={b} storyFieldHtml={storyFieldHtml} />
        ))}
      </div>
      <div className="sv-folio">— {page.folio} —</div>
    </article>
  );
}

// ── Essay page ───────────────────────────────────────────────────────────────

export function EssayPage({
  page,
  fields,
}: {
  page: ViewerEssayPage;
  fields: StoryFields;
}) {
  const storyFieldHtml = makeFieldFn(fields);
  return (
    <article className="sv-page-card">
      <RegMarks />
      <div className="sv-running-head">{page.title}</div>

      {page.subtitle ? (
        <div className="sv-essay-eyebrow">{page.subtitle}</div>
      ) : null}

      <h2 className="sv-essay-title">{page.title}</h2>

      <div className="sv-prose">
        {page.blocks.map((b, i) => (
          <StoryBlockRenderer key={b.id ?? i} block={b} storyFieldHtml={storyFieldHtml} />
        ))}
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
}: {
  page: ViewerPage;
  meta: CoverMeta;
  fields: StoryFields;
}) {
  if (page.pageKind === "cover") return <CoverPage page={page} meta={meta} />;
  if (page.pageKind === "chapter-opener") return <ChapterOpenerPage page={page} />;
  if (page.pageKind === "body") return <BodyPage page={page} fields={fields} />;
  if (page.pageKind === "essay") return <EssayPage page={page} fields={fields} />;
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
  registerSection,
}: {
  pages: ViewerPage[];
  meta: CoverMeta;
  fields: StoryFields;
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
                <h2 className="sv-article-chapter-title" dangerouslySetInnerHTML={{ __html: s.opener.title }} />
                {s.opener.subtitle ? (
                  <p className="sv-article-chapter-dek">{s.opener.subtitle}</p>
                ) : null}
              </header>
              <div className="sv-prose">
                {allBlocks.map((b, i) => (
                  <StoryBlockRenderer key={b.id ?? i} block={b} storyFieldHtml={storyFieldHtml} />
                ))}
              </div>
            </section>
          );
        }

        const p = s.page;
        return (
          <section
            key={s.id}
            id={`sv-section-${s.id}`}
            className="sv-article-section"
            ref={(el) => registerSection?.(s.id, el)}
          >
            <header className="sv-article-section-head">
              {p.subtitle ? <div className="sv-essay-eyebrow">{p.subtitle}</div> : null}
              <h2 className="sv-article-essay-title">{p.title}</h2>
            </header>
            <div className="sv-prose">
              {p.blocks.map((b, i) => (
                <StoryBlockRenderer key={b.id ?? i} block={b} storyFieldHtml={storyFieldHtml} />
              ))}
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
