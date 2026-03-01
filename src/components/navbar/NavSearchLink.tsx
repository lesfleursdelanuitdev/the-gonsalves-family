import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type NavSearchLinkProps = {
  href: string;
  active: boolean;
  showSeparator?: boolean;
};

export function NavSearchLink({
  href,
  active,
  showSeparator,
}: NavSearchLinkProps) {
  return (
    <span className="flex items-center">
      {showSeparator && (
        <span className="px-1.5 text-subtle" aria-hidden>
          •
        </span>
      )}
      <Link
        href={href}
        aria-label="Search"
        className={cx(
          "p-2 rounded transition no-underline inline-flex items-center justify-center",
          "focus:outline-none focus:ring-2 focus:ring-focus-ring focus:ring-offset-2 focus:ring-offset-bg",
          active
            ? "text-primary"
            : "text-muted hover:text-primary"
        )}
      >
        <FontAwesomeIcon icon={faMagnifyingGlass} className="w-4 h-4" />
      </Link>
    </span>
  );
}
