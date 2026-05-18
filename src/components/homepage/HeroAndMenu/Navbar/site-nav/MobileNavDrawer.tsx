"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { Search, X } from "lucide-react";
import { Crest } from "@/components/wireframe";
import { SITE_NAV_GROUPS, SITE_NAV_SEARCH_HREF } from "./navConfig";
import { MobileNavAccordion } from "./MobileNavAccordion";
import { MobileNavLoginAccordion } from "./MobileNavLoginAccordion";
import type { SiteNavGroupId } from "./navGroupState";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

type MobileNavDrawerProps = {
  open: boolean;
  onClose: () => void;
  pathname: string;
  groupExpanded: Record<SiteNavGroupId, boolean>;
  loginExpanded: boolean;
  onGroupToggle: (id: SiteNavGroupId) => void;
  onLoginToggle: () => void;
};

export function MobileNavDrawer({
  open,
  onClose,
  pathname,
  groupExpanded,
  loginExpanded,
  onGroupToggle,
  onLoginToggle,
}: MobileNavDrawerProps) {
  const router = useRouter();
  const panelRef = React.useRef<HTMLDivElement>(null);
  const closeBtnRef = React.useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => closeBtnRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const root = panelRef.current;
    if (!root) return;

    const getFocusables = () =>
      Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (el) => !el.hasAttribute("disabled") && el.offsetParent !== null
      );

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !root) return;
      const nodes = getFocusables();
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onClose();
    router.push(SITE_NAV_SEARCH_HREF);
    setSearchQuery("");
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[10000] bg-black/35 backdrop-blur-[2px] md:hidden"
            aria-hidden
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className="fixed inset-y-0 right-0 z-[10001] flex h-[100dvh] max-h-[100dvh] w-[min(360px,92vw)] min-h-0 flex-col overflow-hidden border-l border-[#E1D5BB] bg-[#F8EFE1] shadow-[-8px_0_40px_rgba(45,32,18,0.12)] md:hidden"
          >
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-5 pb-4 pt-5">
              <div className="relative shrink-0">
                <button
                  ref={closeBtnRef}
                  type="button"
                  onClick={onClose}
                  className="absolute right-0 top-0 z-10 rounded-lg border border-[#E1D5BB] bg-[color-mix(in_srgb,#FFF9EE_85%,transparent)] p-2 text-[color:var(--text)] shadow-sm transition hover:bg-[#FFF9EE] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C3A45A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F8EFE1]"
                  aria-label="Close menu"
                >
                  <X size={18} strokeWidth={2} aria-hidden />
                </button>
                <div className="min-w-0 px-8 text-center">
                  <div className="mx-auto flex w-fit justify-center">
                    <Crest size="md" alt="Gonsalves family crest" />
                  </div>
                  <h2 className="font-heading mt-3 text-lg font-semibold leading-tight tracking-tight text-[color:var(--heading)] sm:text-xl">
                    <span className="font-normal italic">The</span> Gonsalves{" "}
                    <span className="font-normal italic">of</span> Guyana
                  </h2>
                  <p className="font-body mt-1.5 text-[11px] font-medium uppercase leading-relaxed tracking-wide text-crimson">
                    A <span className="font-semibold">living</span> family archive
                  </p>
                </div>
              </div>

              <form
                onSubmit={handleSearchSubmit}
                className="mt-5 shrink-0"
                role="search"
              >
                <label htmlFor="mobile-nav-search" className="sr-only">
                  Search the archive
                </label>
                <div className="relative flex items-center gap-2 rounded-lg border border-[#E1D5BB] bg-[color-mix(in_srgb,#FFF9EE_70%,transparent)] px-2 py-2 shadow-inner focus-within:ring-2 focus-within:ring-[#C3A45A]/60">
                  <input
                    id="mobile-nav-search"
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search the archive…"
                    autoComplete="off"
                    className="min-w-0 flex-1 border-0 bg-transparent px-1 py-0.5 text-sm text-[color:var(--text)] outline-none placeholder:text-[color:var(--text-subtle)]"
                  />
                  <button
                    type="submit"
                    className="inline-flex shrink-0 items-center justify-center rounded-md p-1.5 text-[color:var(--link)] transition hover:bg-[color-mix(in_srgb,var(--link)_12%,transparent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C3A45A]"
                    aria-label="Open search"
                  >
                    <Search size={18} strokeWidth={2} aria-hidden />
                  </button>
                </div>
              </form>

              <nav className="mt-6 shrink-0 pb-2" aria-label="Primary">
                {SITE_NAV_GROUPS.map((group) => (
                  <MobileNavAccordion
                    key={group.id}
                    group={group}
                    expanded={groupExpanded[group.id]}
                    onToggle={() => onGroupToggle(group.id)}
                    pathname={pathname}
                    panelId={`mobile-nav-${group.id}`}
                    onLinkClick={onClose}
                  />
                ))}
                <MobileNavLoginAccordion
                  expanded={loginExpanded}
                  onToggle={onLoginToggle}
                  onLinkClick={onClose}
                />
              </nav>
            </div>

            <footer
              className="z-10 shrink-0 border-t border-[#D4C4A8] bg-[#E8DFCE] px-5 pt-3 shadow-[0_-8px_24px_rgba(45,32,18,0.12)]"
              style={{ paddingBottom: "max(0.875rem, env(safe-area-inset-bottom, 0px))" }}
            >
              <p className="text-center font-heading text-[10px] font-medium tracking-[0.22em] text-[#4A4338] sm:text-xs">
                Madeira · Guyana · Diaspora
              </p>
            </footer>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
