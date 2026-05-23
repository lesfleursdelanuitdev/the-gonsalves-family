import Image from "next/image";
import Link from "next/link";
import { Calendar, FileText, MapPin, User } from "lucide-react";
import { Footer } from "@/components/homepage";
import { Navbar } from "@/components/homepage/HeroAndMenu/Navbar";
import { PageContainer, Section } from "@/components/wireframe";
import { MarkdownNote } from "@/components/shared/MarkdownNote";
import type { PublicEventProfile } from "./types";

function MetadataRow({
  icon: Icon,
  label,
  value,
  href,
  markdown,
}: {
  icon: typeof Calendar;
  label: string;
  value: string;
  href?: string;
  markdown?: boolean;
}) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-xl border border-border-subtle/70 bg-surface/80 px-3 py-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-link" aria-hidden />
      <div className="min-w-0">
        <p className="font-body text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted">{label}</p>
        {href ? (
          <Link href={href} className="mt-0.5 break-words font-body text-sm font-medium text-link transition hover:underline">
            {value}
          </Link>
        ) : markdown ? (
          <MarkdownNote content={value} className="mt-0.5 break-words font-body text-sm font-medium text-heading" />
        ) : (
          <p className="mt-0.5 break-words font-body text-sm font-medium text-heading">{value}</p>
        )}
      </div>
    </div>
  );
}

export function EventProfilePage({ event }: { event: PublicEventProfile }) {
  return (
    <div className="flex min-h-screen min-w-0 max-w-full flex-col overflow-x-hidden bg-bg text-text">
      <Navbar />
      <main className="min-w-0 flex-1 overflow-x-hidden">
        <Section noPadding className="relative min-w-0 overflow-x-hidden pb-4 pt-14 sm:pb-10 md:pb-14 md:pt-32">
          <div className="absolute inset-0 min-w-0 max-w-full">
            <Image src="/images/vintageTime2.png" alt="" fill priority className="object-cover" sizes="100vw" />
            <div className="absolute inset-0 bg-gradient-to-r from-bg/96 via-bg/82 to-bg/35 md:from-bg/92 md:via-bg/78 md:to-bg/20" />
            <div className="absolute inset-y-0 left-0 w-[58%] bg-gradient-to-r from-bg to-transparent" />
          </div>
          <div className="relative z-10 min-w-0 max-w-full">
            <PageContainer narrow>
              <div className="min-w-0 max-w-full space-y-5 p-5 backdrop-blur-md [-webkit-backdrop-filter:blur(14px)] [backdrop-filter:blur(14px)] sm:p-6">
                <nav aria-label="Breadcrumb" className="flex min-w-0 flex-wrap items-center gap-2 font-body text-xs tracking-[0.06em] text-muted">
                  <Link href="/" className="min-w-0 shrink transition hover:text-link">Home</Link>
                  <span className="shrink-0 text-subtle">/</span>
                  <Link href="/tree" className="min-w-0 shrink transition hover:text-link">Family Tree</Link>
                  <span className="shrink-0 text-subtle">/</span>
                  <Link href="/tree/events" className="min-w-0 shrink transition hover:text-link">Events</Link>
                  <span className="shrink-0 text-subtle">/</span>
                  <span className="min-w-0 text-heading">{event.typeLabel}</span>
                </nav>

                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-full border border-link/20 bg-link/10 px-3 py-1 font-body text-xs font-semibold text-link">
                      {event.typeLabel}
                    </span>
                    {event.year ? (
                      <span className="font-body text-sm text-muted">{event.year}</span>
                    ) : null}
                  </div>
                  <h1 className="break-words font-heading text-4xl font-semibold leading-[1.05] tracking-tight text-heading sm:text-5xl">
                    {event.subjectName ?? event.typeLabel}
                  </h1>
                </div>

                <div className="h-px w-24 bg-gradient-to-r from-link/70 via-link/30 to-transparent" />

                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {event.subjectName && event.subjectHref ? (
                    <MetadataRow icon={User} label="Person / Family" value={event.subjectName} href={event.subjectHref} />
                  ) : null}
                  {event.dateLabel ? (
                    <MetadataRow icon={Calendar} label="Date" value={event.dateLabel} />
                  ) : null}
                  {event.placeLabel ? (
                    <MetadataRow icon={MapPin} label="Place" value={event.placeLabel} href={event.placeHref ?? undefined} />
                  ) : null}
                  {event.value ? (
                    <MetadataRow icon={FileText} label="Value" value={event.value} markdown />
                  ) : null}
                  {event.cause ? (
                    <MetadataRow icon={FileText} label="Cause" value={event.cause} markdown />
                  ) : null}
                  {event.eventLabel ? (
                    <MetadataRow icon={FileText} label="Label" value={event.eventLabel} />
                  ) : null}
                </div>
              </div>
            </PageContainer>
          </div>
        </Section>

        {event.notes.length > 0 ? (
          <Section noPadding className="min-w-0 overflow-x-hidden pb-10 pt-4 md:pt-8">
            <PageContainer narrow>
              <div className="rounded-2xl border border-border/80 bg-surface/90 shadow-[0_10px_26px_rgba(60,45,25,0.06)]">
                <div className="border-b border-border-subtle/70 px-5 py-4">
                  <h2 className="font-heading text-base font-semibold text-heading">Notes</h2>
                </div>
                <ul className="divide-y divide-border-subtle/50">
                  {event.notes.map((note, i) => (
                    <li key={i} className="px-5 py-4">
                      <MarkdownNote content={note} className="font-body text-sm leading-relaxed text-text" />
                    </li>
                  ))}
                </ul>
              </div>
            </PageContainer>
          </Section>
        ) : null}
      </main>
      <Footer />
    </div>
  );
}
