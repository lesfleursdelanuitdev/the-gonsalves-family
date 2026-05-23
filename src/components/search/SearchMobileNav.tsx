"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  MoreHorizontal,
  Search,
  Sparkles,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type SearchMode = "general" | "people" | "events" | "media" | "nl";

type SearchMobileNavProps = {
  searchMode: SearchMode;
  onSearchModeChange: (mode: SearchMode) => void;
};

const PRIMARY_MODES = [
  { mode: "general" as const, icon: Search, label: "General" },
  { mode: "people" as const, icon: Users, label: "People" },
  { mode: "events" as const, icon: Calendar, label: "Events" },
];

const MORE_MODES = [
  { mode: "media" as const, icon: ImageIcon, label: "Media", description: "Photos, documents, audio, and video" },
  { mode: "nl" as const, icon: Sparkles, label: "Ask", description: "Ask a question in plain language" },
];

function ModeTab({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: typeof Search;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-2 text-[0.64rem] font-semibold tracking-[0.03em] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8b2e2e]/35",
        active
          ? "bg-link-soft-bg text-link shadow-[inset_0_1px_0_rgba(255,255,255,0.65),0_6px_14px_rgba(60,45,25,0.06)]"
          : "text-link/85 hover:bg-link-soft-bg hover:text-link",
      )}
    >
      <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
      <span>{label}</span>
      {active ? <span className="absolute bottom-1.5 h-0.5 w-1.5 rounded-full bg-link/70" aria-hidden /> : null}
    </button>
  );
}

function MoreDrawerItem({
  icon: Icon,
  label,
  description,
  index,
  onSelect,
}: {
  icon: typeof Search;
  label: string;
  description: string;
  index: number;
  onSelect: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1], delay: 0.035 * index }}
    >
      <button type="button" onClick={onSelect} className="group flex w-full items-center gap-3 py-3 text-left">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-link transition group-hover:bg-link-soft-bg">
          <Icon className="h-5 w-5" strokeWidth={1.65} aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-heading">{label}</span>
          <span className="mt-0.5 block text-xs leading-snug text-muted">{description}</span>
        </span>
      </button>
    </motion.div>
  );
}

export function SearchMobileNav({ searchMode, onSearchModeChange }: SearchMobileNavProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [navExpanded, setNavExpanded] = useState(true);

  const moreActive = searchMode === "media" || searchMode === "nl";

  const selectMode = (mode: SearchMode) => {
    onSearchModeChange(mode);
    setDrawerOpen(false);
  };

  const collapseNav = () => {
    setNavExpanded(false);
    setDrawerOpen(false);
  };

  const expandNav = () => {
    setNavExpanded(true);
  };

  const sharedBgStyle = {
    WebkitBackdropFilter: "blur(16px)",
    backgroundImage:
      "linear-gradient(180deg, rgba(255,248,232,0.96), rgba(247,241,228,0.93)), radial-gradient(circle at 84% 12%, rgba(195,164,90,0.14), transparent 34%)",
  };

  return (
    <nav
      aria-label="Search mode"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[80] sm:hidden"
    >
      <div
        className="pointer-events-auto w-full border-t border-border-subtle/90 bg-surface-elevated/95 shadow-[0_-14px_42px_rgba(60,45,25,0.16)] backdrop-blur-md"
        style={sharedBgStyle}
      >
        <AnimatePresence initial={false}>
          {drawerOpen && navExpanded ? (
            <motion.div
              key="drawer"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden border-b border-border-subtle/70"
            >
              <div className="max-h-[min(50dvh,22rem)] overflow-y-auto px-4 pb-3 pt-4">
                <p className="font-body text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-[#8b2e2e]">
                  More search options
                </p>
                <div className="mt-3 divide-y divide-border-subtle/70">
                  {MORE_MODES.map((item, index) => (
                    <MoreDrawerItem
                      key={item.mode}
                      icon={item.icon}
                      label={item.label}
                      description={item.description}
                      index={index}
                      onSelect={() => selectMode(item.mode)}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {navExpanded ? (
          <>
            <button
              type="button"
              aria-label="Collapse search menu"
              onClick={collapseNav}
              className="flex min-h-9 w-full items-center gap-2 px-4 py-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
            >
              <span className="font-body text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-[#8b2e2e]">
                Search
              </span>
              <ChevronDown className="ml-auto h-4 w-4 shrink-0 text-muted" strokeWidth={1.75} aria-hidden />
            </button>
            <div className="grid grid-cols-4 gap-1 border-t border-border-subtle/70 bg-[rgba(255,250,240,0.5)] px-3 py-1.5">
              {PRIMARY_MODES.map(({ mode, icon, label }) => (
                <ModeTab
                  key={mode}
                  icon={icon}
                  label={label}
                  active={searchMode === mode}
                  onClick={() => selectMode(mode)}
                />
              ))}
              <button
                type="button"
                aria-expanded={drawerOpen}
                aria-haspopup="menu"
                onClick={() => {
                  setNavExpanded(true);
                  setDrawerOpen((current) => !current);
                }}
                className={cn(
                  "relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-2 text-[0.64rem] font-semibold tracking-[0.03em] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8b2e2e]/35",
                  drawerOpen || moreActive
                    ? "bg-link-soft-bg text-link shadow-[inset_0_1px_0_rgba(255,255,255,0.65),0_6px_14px_rgba(60,45,25,0.06)]"
                    : "text-link/85 hover:bg-link-soft-bg hover:text-link",
                )}
              >
                <MoreHorizontal className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                <span>More</span>
                {drawerOpen || moreActive ? (
                  <span className="absolute bottom-1.5 h-0.5 w-1.5 rounded-full bg-link/70" aria-hidden />
                ) : null}
              </button>
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={expandNav}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-link transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          >
            <ChevronUp className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden />
            <span className="font-body text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-[#8b2e2e]">
              Search
            </span>
          </button>
        )}
      </div>
    </nav>
  );
}
