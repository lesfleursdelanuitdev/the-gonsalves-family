"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Search, X } from "lucide-react";
import { MobileExpandableSection } from "@/components/navbar/MobileExpandableSection";
import {
  TREE_MENU,
  ARCHIVE_MENU_V2,
  CULTURE_MENU,
} from "./constants";
import type { NavItem } from "@/components/navbar/constants";

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type MobileNavPanelProps = {
  open: boolean;
  onClose: () => void;
  treeItems: Array<NavItem & { active: boolean }>;
  archiveItems: Array<NavItem & { active: boolean }>;
  cultureItems: Array<NavItem & { active: boolean }>;
  treeExpanded: boolean;
  archiveExpanded: boolean;
  cultureExpanded: boolean;
  onTreeToggle: () => void;
  onArchiveToggle: () => void;
  onCultureToggle: () => void;
  treeActive: boolean;
  archiveActive: boolean;
  cultureActive: boolean;
  searchActive: boolean;
};

export function MobileNavPanel({
  open,
  onClose,
  treeItems,
  archiveItems,
  cultureItems,
  treeExpanded,
  archiveExpanded,
  cultureExpanded,
  onTreeToggle,
  onArchiveToggle,
  onCultureToggle,
  treeActive,
  archiveActive,
  cultureActive,
  searchActive,
}: MobileNavPanelProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-[min(320px,85vw)] bg-bg dark:bg-bg shadow-xl md:hidden overflow-y-auto"
          >
            <div className="flex flex-col h-full py-6 px-6">
              <div className="flex justify-end mb-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-lg text-muted hover:text-text hover:bg-surface-elevated transition focus:outline-none focus:ring-2 focus:ring-focus-ring focus:ring-offset-2 focus:ring-offset-bg"
                  aria-label="Close menu"
                >
                  <X size={20} strokeWidth={2} />
                </button>
              </div>
              <div className="grid gap-2">
                <MobileExpandableSection
                  label="Tree"
                  items={treeItems}
                  expanded={treeExpanded}
                  onToggle={onTreeToggle}
                  isActive={treeActive}
                  id="hero-mobile-tree"
                  onLinkClick={onClose}
                />
                <MobileExpandableSection
                  label="Archive"
                  items={archiveItems}
                  expanded={archiveExpanded}
                  onToggle={onArchiveToggle}
                  isActive={archiveActive}
                  id="hero-mobile-archive"
                  onLinkClick={onClose}
                />
                <MobileExpandableSection
                  label="Culture"
                  items={cultureItems}
                  expanded={cultureExpanded}
                  onToggle={onCultureToggle}
                  isActive={cultureActive}
                  id="hero-mobile-culture"
                  onLinkClick={onClose}
                />
                <Link
                  href="/search"
                  className={cx(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition no-underline",
                    searchActive
                      ? "text-primary bg-surface-elevated"
                      : "text-text hover:bg-surface-elevated hover:text-primary"
                  )}
                  onClick={onClose}
                >
                  <Search size={16} className="shrink-0 opacity-70" strokeWidth={2} />
                  Search
                </Link>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
