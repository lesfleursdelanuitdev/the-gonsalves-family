import Link from "next/link";

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function ContributeButton() {
  return (
    <Link
      href="/contribute"
      className={cx(
        "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition no-underline shrink-0",
        "bg-primary text-primary-foreground hover:bg-primary-hover",
        "focus:outline-none focus:ring-2 focus:ring-focus-ring focus:ring-offset-2 focus:ring-offset-bg"
      )}
    >
      Contribute
    </Link>
  );
}
