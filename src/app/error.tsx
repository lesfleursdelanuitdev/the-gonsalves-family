"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-6">
      <h1 className="font-heading text-xl font-semibold text-heading mb-4">
        Something went wrong
      </h1>
      <p className="font-body text-muted mb-6 text-center max-w-md">
        A client-side error occurred. Try refreshing the page.
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-lg bg-primary px-6 py-3 font-body text-base font-medium text-primary-foreground hover:bg-primary-hover transition-colors"
      >
        Try again
      </button>
      <a
        href="/"
        className="font-body mt-4 text-link underline hover:text-link-hover text-sm"
      >
        Return to home
      </a>
    </div>
  );
}
