import Link from "next/link";

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type NavLinkProps = {
  href: string;
  label: string;
  active: boolean;
  showSeparator?: boolean;
};

export function NavLink({ href, label, active, showSeparator }: NavLinkProps) {
  return (
    <span className="flex items-center">
      {showSeparator && <span className="px-1.5 text-subtle" aria-hidden>•</span>}
      <Link
        href={href}
        className={cx(
          "px-1.5 py-2 rounded transition no-underline",
          "focus:outline-none focus:ring-2 focus:ring-focus-ring focus:ring-offset-2 focus:ring-offset-bg",
          active
            ? "text-primary font-medium underline underline-offset-2 decoration-2 decoration-nav-underline dark:decoration-primary dark:underline-offset-4"
            : "hover:text-primary hover:no-underline"
        )}
      >
        {label}
      </Link>
    </span>
  );
}
