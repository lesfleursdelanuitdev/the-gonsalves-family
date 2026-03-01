"use client";

type MobileSearchFormProps = {
  onClose: () => void;
};

export function MobileSearchForm({ onClose }: MobileSearchFormProps) {
  return (
    <div className="rounded-lg border border-border bg-surface-elevated p-3">
      <form
        action="/search"
        method="GET"
        className="grid gap-2"
        onSubmit={onClose}
      >
        <input
          type="text"
          name="first_name"
          placeholder="First name"
          className="w-full rounded border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-focus-ring"
        />
        <input
          type="text"
          name="last_name"
          placeholder="Last name"
          className="w-full rounded border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-focus-ring"
        />
        <button
          type="submit"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-focus-ring"
        >
          Search
        </button>
      </form>
    </div>
  );
}
