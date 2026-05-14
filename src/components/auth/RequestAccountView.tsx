"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Footer } from "@/components/homepage";
import { PageContainer, Section } from "@/components/wireframe";

type RequestStatus =
  | { type: "idle" }
  | { type: "success" }
  | { type: "error"; message: string };

export function RequestAccountView() {
  const [pending, setPending] = React.useState(false);
  const [status, setStatus] = React.useState<RequestStatus>({ type: "idle" });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus({ type: "idle" });
    setPending(true);

    const form = new FormData(event.currentTarget);
    const payload = {
      firstName: String(form.get("firstName") ?? ""),
      lastName: String(form.get("lastName") ?? ""),
      email: String(form.get("email") ?? ""),
      preferredUsername: String(form.get("preferredUsername") ?? ""),
      requestDetails: String(form.get("requestDetails") ?? ""),
      website: String(form.get("website") ?? ""),
    };

    try {
      const response = await fetch("/api/public-intake/registration-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error || "Could not submit request.");
      }
      event.currentTarget.reset();
      setStatus({ type: "success" });
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Could not submit request.",
      });
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex min-h-screen min-w-0 max-w-full flex-col overflow-x-hidden bg-bg text-text">
      <main className="min-w-0 flex-1 overflow-x-hidden">
        <Section className="relative min-w-0 overflow-x-hidden overflow-y-hidden pb-10 pt-14 md:pb-14 md:pt-32">
          <div className="absolute inset-0 min-w-0 max-w-full">
            <Image
              src="/images/oldMapBackground.png"
              alt=""
              fill
              priority
              className="object-cover object-center"
              sizes="100vw"
            />
            <div
              className="absolute inset-0 bg-bg/40 md:bg-bg/55"
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
                  <span className="text-heading">Request account</span>
                </nav>
                <div className="space-y-3">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[#8b2e2e]">
                    Family Access
                  </p>
                  <h1 className="break-words font-heading text-4xl font-semibold leading-[1.05] tracking-tight text-heading sm:text-5xl md:text-6xl">
                    Request Account
                  </h1>
                  <p className="max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
                    Tell us a little about yourself and your connection to the family. Your request will be reviewed
                    before an account is created.
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

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="First name" name="firstName" autoComplete="given-name" required />
                    <Field label="Last name" name="lastName" autoComplete="family-name" required />
                  </div>
                  <Field label="Email" name="email" type="email" autoComplete="email" required />
                  <Field label="Preferred username" name="preferredUsername" autoComplete="username" required />

                  <div className="space-y-1.5">
                    <label htmlFor="requestDetails" className="block text-sm font-medium text-heading">
                      Tell us about your family connection
                    </label>
                    <textarea
                      id="requestDetails"
                      name="requestDetails"
                      required
                      minLength={10}
                      rows={5}
                      className="w-full rounded-lg border border-border-subtle bg-surface px-3 py-2.5 text-text outline-none transition focus:border-link focus:ring-2 focus:ring-link/25"
                    />
                  </div>

                  {status.type === "success" ? (
                    <p className="rounded-xl border border-link/20 bg-link-soft-bg px-4 py-3 text-sm text-link" role="status">
                      Your request was received. We&apos;ll review it and follow up by email.
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
                    {pending ? "Sending request..." : "Submit request"}
                  </button>
                </form>
              </div>
            </PageContainer>
          </div>
        </Section>
      </main>
      <Footer />
    </div>
  );
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
