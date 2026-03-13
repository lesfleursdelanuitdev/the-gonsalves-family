"use client";

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type HamburgerButtonProps = {
  open: boolean;
  onClick: () => void;
  /** Use transparent background (e.g. for overlay navbars) */
  transparent?: boolean;
};

export function HamburgerButton({ open, onClick, transparent = false }: HamburgerButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "md:hidden inline-flex items-center justify-center p-2 rounded-lg",
        transparent
          ? "bg-transparent hover:bg-white/10 text-text border-0"
          : "border border-border bg-surface hover:bg-surface-elevated text-text",
        "focus:outline-none focus:ring-2 focus:ring-focus-ring focus:ring-offset-2 focus:ring-offset-bg transition"
      )}
      aria-label="Toggle menu"
      aria-expanded={open}
    >
      <span className="relative w-4 h-4 md:w-5 md:h-5" aria-hidden>
        <span
          className={cx(
            "absolute left-0 w-4 h-0.5 md:w-5 md:h-0.5 bg-current rounded-full transition-all duration-200 ease-out",
            open ? "top-1/2 -translate-y-1/2 rotate-45" : "top-[3px]"
          )}
        />
        <span
          className={cx(
            "absolute left-0 top-1/2 -translate-y-1/2 w-4 h-0.5 md:w-5 md:h-0.5 bg-current rounded-full transition-opacity duration-200",
            open && "opacity-0"
          )}
        />
        <span
          className={cx(
            "absolute left-0 w-4 h-0.5 md:w-5 md:h-0.5 bg-current rounded-full transition-all duration-200 ease-out",
            open ? "top-1/2 -translate-y-1/2 -rotate-45" : "bottom-[3px]"
          )}
        />
      </span>
    </button>
  );
}
