"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, UploadCloud, UserPlus, X } from "lucide-react";
import { Footer } from "@/components/homepage";
import { PageContainer, Section } from "@/components/wireframe";

type ContributionStatus =
  | { type: "idle" }
  | { type: "success" }
  | { type: "error"; message: string };

type ContributeViewProps = {
  relatedIndividualXref?: string | null;
  relatedIndividualName?: string | null;
};

type PickerIndividual = {
  id?: string;
  xref: string;
  fullName: string;
  birthDateLabel: string | null;
  portraitSrc: string | null;
};

const ACCEPTED_MEDIA_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/rtf",
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/ogg",
  "audio/aac",
  "audio/mp4",
  "audio/x-m4a",
  "audio/flac",
  "video/mp4",
  "video/webm",
  "video/quicktime",
].join(",");

export function ContributeView({
  relatedIndividualXref,
  relatedIndividualName,
}: ContributeViewProps) {
  const [pending, setPending] = React.useState(false);
  const [status, setStatus] = React.useState<ContributionStatus>({ type: "idle" });
  const [attachmentFileNames, setAttachmentFileNames] = React.useState<string[]>([]);
  const [isDraggingAttachments, setIsDraggingAttachments] = React.useState(false);
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [selectedPeople, setSelectedPeople] = React.useState<PickerIndividual[]>(() =>
    relatedIndividualXref
      ? [
          {
            xref: relatedIndividualXref,
            fullName: relatedIndividualName ?? relatedIndividualXref,
            birthDateLabel: null,
            portraitSrc: null,
          },
        ]
      : [],
  );
  const attachmentInputRef = React.useRef<HTMLInputElement>(null);

  const updateAttachmentFileNames = (files: FileList | null) => {
    setAttachmentFileNames(Array.from(files ?? []).map((file) => file.name));
  };

  const handleAttachmentDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingAttachments(false);
    if (!attachmentInputRef.current) return;

    const transfer = new DataTransfer();
    Array.from(event.dataTransfer.files)
      .slice(0, 8)
      .forEach((file) => transfer.items.add(file));

    attachmentInputRef.current.files = transfer.files;
    updateAttachmentFileNames(transfer.files);
  };

  const addPerson = (person: PickerIndividual) => {
    setSelectedPeople((current) =>
      current.some((item) => item.xref === person.xref) ? current : [...current, person],
    );
  };

  const removePerson = (xref: string) => {
    setSelectedPeople((current) => current.filter((person) => person.xref !== xref));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const currentForm = event.currentTarget;
    setStatus({ type: "idle" });
    setPending(true);

    const form = new FormData(currentForm);
    form.delete("individualXrefs");
    form.delete("individualXrefs[]");
    form.delete("relatedIndividualXref");
    selectedPeople.forEach((person) => form.append("individualXrefs", person.xref));

    try {
      const response = await fetch("/api/public-intake/contributions", {
        method: "POST",
        body: form,
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error || "Could not submit contribution.");
      }
      currentForm.reset();
      setAttachmentFileNames([]);
      setStatus({ type: "success" });
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Could not submit contribution.",
      });
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex min-h-screen min-w-0 max-w-full flex-col overflow-x-hidden bg-bg text-text">
      <main className="min-w-0 flex-1 overflow-x-hidden">
        <Section className="relative min-w-0 overflow-x-hidden overflow-y-hidden pb-10 pt-28 md:pb-14 md:pt-32">
          <div className="absolute inset-0 min-w-0 max-w-full">
            <Image
              src="/images/oldMapBackground.png"
              alt=""
              fill
              priority
              className="object-cover object-center"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-bg/42 md:bg-bg/58" aria-hidden />
            <div
              className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-bg to-transparent"
              aria-hidden
            />
          </div>

          <div className="relative z-10 min-w-0 max-w-full">
            <PageContainer narrow>
              <div className="min-w-0 max-w-full space-y-5 sm:space-y-6">
                <nav
                  aria-label="Breadcrumb"
                  className="flex min-w-0 flex-wrap items-center gap-2 text-xs uppercase tracking-[0.14em] text-muted"
                >
                  <Link href="/" className="transition hover:text-link">
                    Home
                  </Link>
                  <span className="text-subtle">/</span>
                  <span className="text-heading">Contribute</span>
                </nav>

                <div className="space-y-3">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[#8b2e2e]">
                    Family Contributions
                  </p>
                  <h1 className="break-words font-heading text-4xl font-semibold leading-[1.05] tracking-tight text-heading sm:text-5xl md:text-6xl">
                    Share a memory, information, or media
                  </h1>
                  <p className="max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
                    Help enrich the family archive with a remembered story, a correction, a detail we should add, or
                    media that belongs with the record.
                  </p>
                </div>

                <form
                  onSubmit={handleSubmit}
                  className="min-w-0 max-w-2xl space-y-4 rounded-2xl border border-border/80 bg-surface/92 p-5 shadow-[0_10px_26px_rgba(60,45,25,0.08)] sm:p-7"
                >
                  <div className="hidden">
                    <label>
                      Website
                      <input name="website" tabIndex={-1} autoComplete="off" />
                    </label>
                  </div>
                  <div className="space-y-3 rounded-2xl border border-border-subtle bg-surface/80 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h2 className="font-heading text-lg font-semibold text-heading">Who is this about?</h2>
                        <p className="mt-1 text-sm leading-relaxed text-muted">
                          Choose one or more people, or leave this empty for a general family contribution.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPickerOpen(true)}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-link/20 bg-link-soft-bg px-3 py-2 text-sm font-semibold text-link transition hover:border-link/35 hover:bg-link-soft-bg/80"
                      >
                        <UserPlus className="size-4" aria-hidden />
                        Choose people
                      </button>
                    </div>
                    {selectedPeople.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedPeople.map((person) => (
                          <span
                            key={person.xref}
                            className="inline-flex max-w-full items-center gap-2 rounded-full border border-link/15 bg-link-soft-bg px-2.5 py-1.5 text-sm text-link"
                          >
                            <Avatar person={person} size="sm" />
                            <span className="truncate">{person.fullName}</span>
                            <button
                              type="button"
                              onClick={() => removePerson(person.xref)}
                              className="rounded-full p-0.5 transition hover:bg-link/10"
                              aria-label={`Remove ${person.fullName}`}
                            >
                              <X className="size-3.5" aria-hidden />
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="rounded-xl border border-border-subtle/70 bg-bg/45 px-3 py-2 text-sm text-muted">
                        General contribution, not associated with a specific person.
                      </p>
                    )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="First name" name="contributorFirstName" autoComplete="given-name" required />
                    <Field label="Last name" name="contributorLastName" autoComplete="family-name" required />
                  </div>
                  <Field label="Email" name="contributorEmail" type="email" autoComplete="email" required />

                  <fieldset className="space-y-2">
                    <legend className="text-sm font-medium text-heading">What would you like to contribute?</legend>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <RadioCard
                        name="type"
                        value="memory"
                        defaultChecked
                        title="A memory"
                        description="A story, recollection, or family remembrance."
                      />
                      <RadioCard
                        name="type"
                        value="suggestion"
                        title="Information"
                        description="A correction, new detail, source, or record clue."
                      />
                      <RadioCard
                        name="type"
                        value="recipe"
                        title="A recipe"
                        description="A family dish, ingredient note, or cooking tradition."
                      />
                      <RadioCard
                        name="type"
                        value="language"
                        title="Language"
                        description="Words, sayings, pronunciations, or translations."
                      />
                      <RadioCard
                        name="type"
                        value="folklore"
                        title="Folklore"
                        description="Customs, beliefs, songs, legends, or oral traditions."
                      />
                    </div>
                  </fieldset>

                  <div className="space-y-1.5">
                    <label htmlFor="content" className="block text-sm font-medium text-heading">
                      Contribution
                    </label>
                    <textarea
                      id="content"
                      name="content"
                      required
                      minLength={10}
                      rows={6}
                      placeholder="Share the memory, detail, recipe, language note, folklore, or media context."
                      className="w-full rounded-lg border border-border-subtle bg-surface px-3 py-2.5 text-text outline-none transition placeholder:text-muted/70 focus:border-link focus:ring-2 focus:ring-link/25"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-heading">
                      Media
                    </label>
                    <div
                      onDragEnter={(event) => {
                        event.preventDefault();
                        setIsDraggingAttachments(true);
                      }}
                      onDragOver={(event) => {
                        event.preventDefault();
                        setIsDraggingAttachments(true);
                      }}
                      onDragLeave={() => setIsDraggingAttachments(false)}
                      onDrop={handleAttachmentDrop}
                      className={`rounded-2xl border border-dashed px-4 py-6 text-center transition ${
                        isDraggingAttachments
                          ? "border-link bg-link-soft-bg/70 shadow-[inset_0_0_0_1px_rgba(46,94,62,0.14)]"
                          : "border-border-subtle bg-surface/85 hover:border-link/40 hover:bg-link-soft-bg/25"
                      }`}
                    >
                      <input
                        ref={attachmentInputRef}
                        id="attachments"
                        name="attachments"
                        type="file"
                        accept={ACCEPTED_MEDIA_TYPES}
                        multiple
                        className="sr-only"
                        onChange={(event) => updateAttachmentFileNames(event.currentTarget.files)}
                      />
                      <label htmlFor="attachments" className="mx-auto flex max-w-sm cursor-pointer flex-col items-center gap-2">
                        <span className="flex size-11 items-center justify-center rounded-full border border-link/20 bg-link-soft-bg text-link">
                          <UploadCloud className="size-5" strokeWidth={1.8} aria-hidden />
                        </span>
                        <span className="text-sm font-semibold text-heading">
                          {isDraggingAttachments ? "Drop files here" : "Drag media here, or browse"}
                        </span>
                        <span className="text-xs leading-relaxed text-muted">
                          Photos, documents, audio, and video. Up to 8 files.
                        </span>
                      </label>
                    </div>
                    {attachmentFileNames.length > 0 ? (
                      <ul className="space-y-1 rounded-xl border border-border-subtle/70 bg-surface/75 px-3 py-2 text-xs text-muted">
                        {attachmentFileNames.map((name) => (
                          <li key={name} className="truncate">
                            {name}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    <p className="text-xs leading-relaxed text-muted">
                      Media is optional; you can also submit a memory or information without files.
                    </p>
                  </div>

                  {status.type === "success" ? (
                    <p className="rounded-xl border border-link/20 bg-link-soft-bg px-4 py-3 text-sm text-link" role="status">
                      Thank you. Your contribution was received and will be reviewed before it appears in the archive.
                    </p>
                  ) : null}
                  {status.type === "error" ? (
                    <p className="rounded-xl border border-[#8F1F1F]/20 bg-[#8F1F1F]/5 px-4 py-3 text-sm text-[#8F1F1F]" role="alert">
                      {status.message}
                    </p>
                  ) : null}

                  <button
                    type="submit"
                    disabled={pending}
                    className="inline-flex w-full items-center justify-center rounded-lg bg-link px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-link-hover disabled:opacity-60 sm:w-auto"
                  >
                    {pending ? "Sending contribution..." : "Submit contribution"}
                  </button>
                </form>
              </div>
            </PageContainer>
          </div>
        </Section>
      </main>
      <Footer />
      <PersonPickerModal
        open={pickerOpen}
        selected={selectedPeople}
        onClose={() => setPickerOpen(false)}
        onSelect={addPerson}
        onRemove={removePerson}
      />
    </div>
  );
}

function PersonPickerModal({
  open,
  selected,
  onClose,
  onSelect,
  onRemove,
}: {
  open: boolean;
  selected: PickerIndividual[];
  onClose: () => void;
  onSelect: (person: PickerIndividual) => void;
  onRemove: (xref: string) => void;
}) {
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<PickerIndividual[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const selectedXrefs = React.useMemo(() => new Set(selected.map((person) => person.xref)), [selected]);

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  React.useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ q: query, limit: "12" });
        const response = await fetch(`/api/tree/individual-picker?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Could not load people.");
        const body = (await response.json()) as { individuals?: PickerIndividual[] };
        setResults(body.individuals ?? []);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Could not load people.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 220);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [open, query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-[#20180f]/45 px-4 py-4 backdrop-blur-sm sm:items-center">
      <div className="max-h-[86dvh] w-full max-w-2xl overflow-hidden rounded-[1.6rem] border border-border-subtle bg-surface shadow-[0_24px_70px_rgba(32,24,15,0.28)]">
        <div className="flex items-start justify-between gap-4 border-b border-border-subtle bg-surface-elevated/80 px-5 py-4">
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#8b2e2e]">
              Person Picker
            </p>
            <h2 className="mt-1 font-heading text-2xl font-semibold text-heading">Connect this contribution</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              Search the tree and select any people this contribution is about.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-border-subtle bg-surface p-2 text-muted transition hover:bg-link-soft-bg hover:text-link"
            aria-label="Close person picker"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto px-5 py-4">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name or XREF"
              autoFocus
              className="w-full rounded-xl border border-border-subtle bg-bg/65 py-3 pl-10 pr-3 text-sm text-text outline-none transition focus:border-link focus:ring-2 focus:ring-link/25"
            />
          </label>

          {selected.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {selected.map((person) => (
                <button
                  key={person.xref}
                  type="button"
                  onClick={() => onRemove(person.xref)}
                  className="inline-flex max-w-full items-center gap-2 rounded-full border border-link/15 bg-link-soft-bg px-2.5 py-1.5 text-sm text-link transition hover:border-link/30"
                >
                  <Avatar person={person} size="sm" />
                  <span className="truncate">{person.fullName}</span>
                  <X className="size-3.5" aria-hidden />
                </button>
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-border-subtle bg-bg/45 px-3 py-2 text-sm text-muted">
              No one selected. This will remain a general contribution.
            </p>
          )}

          <div className="divide-y divide-border-subtle overflow-hidden rounded-2xl border border-border-subtle bg-surface/80">
            {loading ? (
              <p className="px-4 py-6 text-center text-sm text-muted">Searching the tree...</p>
            ) : error ? (
              <p className="px-4 py-6 text-center text-sm text-[#8F1F1F]">{error}</p>
            ) : results.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted">No matching people found.</p>
            ) : (
              results.map((person) => {
                const selectedAlready = selectedXrefs.has(person.xref);
                return (
                  <button
                    key={person.xref}
                    type="button"
                    onClick={() => (selectedAlready ? onRemove(person.xref) : onSelect(person))}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-link-soft-bg/45"
                  >
                    <Avatar person={person} size="md" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-heading text-base font-semibold text-heading">
                        {person.fullName}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted">
                        {person.xref}
                        {person.birthDateLabel ? ` · Born ${person.birthDateLabel}` : ""}
                      </span>
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        selectedAlready ? "bg-link text-primary-foreground" : "border border-link/20 text-link"
                      }`}
                    >
                      {selectedAlready ? "Selected" : "Add"}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="flex justify-end border-t border-border-subtle bg-surface-elevated/65 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-link px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-link-hover"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function Avatar({ person, size }: { person: PickerIndividual; size: "sm" | "md" }) {
  const dimension = size === "sm" ? 24 : 44;
  const className = size === "sm" ? "size-6" : "size-11";
  return (
    <span className={`${className} relative flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-link/15 bg-link-soft-bg text-link`}>
      {person.portraitSrc ? (
        <Image
          src={person.portraitSrc}
          alt=""
          width={dimension}
          height={dimension}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="text-[0.65rem] font-semibold uppercase tracking-[0.08em]">
          {initials(person.fullName)}
        </span>
      )}
    </span>
  );
}

function initials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase() || "?";
}

function Field({
  label,
  name,
  type = "text",
  autoComplete,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="block text-sm font-medium text-heading">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        className="w-full rounded-lg border border-border-subtle bg-surface px-3 py-2.5 text-text outline-none transition focus:border-link focus:ring-2 focus:ring-link/25"
      />
    </div>
  );
}

function RadioCard({
  name,
  value,
  defaultChecked,
  title,
  description,
}: {
  name: string;
  value: string;
  defaultChecked?: boolean;
  title: string;
  description: string;
}) {
  return (
    <label className="flex cursor-pointer gap-3 rounded-xl border border-border-subtle bg-surface px-4 py-3 transition hover:border-link/35 hover:bg-link-soft-bg/35">
      <input
        type="radio"
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        className="mt-1 size-4 border-border-subtle text-link focus:ring-link/40"
      />
      <span>
        <span className="block text-sm font-semibold text-heading">{title}</span>
        <span className="mt-1 block text-xs leading-relaxed text-muted">{description}</span>
      </span>
    </label>
  );
}
