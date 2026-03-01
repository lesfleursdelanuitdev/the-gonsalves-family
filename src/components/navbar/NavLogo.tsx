import Link from "next/link";
import { Crest } from "@/components/wireframe";

export function NavLogo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-3 no-underline shrink-0"
      aria-label="Go to home"
    >
      <Crest size="sm" alt="Gonsalves family crest" />
      <div className="leading-tight">
        <div className="font-display text-sm font-semibold text-text">Gonsalves</div>
        <div className="text-[10px] text-muted uppercase">of Guyana</div>
      </div>
    </Link>
  );
}
