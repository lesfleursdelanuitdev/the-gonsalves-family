"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  CalendarDays,
  ChevronRight,
  FileText,
  GitBranch,
  Image as ImageIcon,
  MoreHorizontal,
  Network,
  Search,
  Share2,
  SlidersHorizontal,
  UserRound,
  UsersRound,
} from "lucide-react";

type NavItem = {
  label: string;
  href: string;
  description: string;
  icon: typeof UserRound;
};

const PRIMARY_ITEMS: NavItem[] = [
  { label: "Overview", href: "#overview", description: "Quick facts and key details", icon: UserRound },
  { label: "Family", href: "#family", description: "Relationships and relatives", icon: UsersRound },
  { label: "Events", href: "#events", description: "Key life events and milestones", icon: CalendarDays },
];

const DRAWER_ITEMS: NavItem[] = [
  { label: "Media", href: "#media", description: "Photos, documents, audio and more", icon: ImageIcon },
  { label: "Timeline", href: "#events", description: "Life story in chronological order", icon: SlidersHorizontal },
  { label: "Notes", href: "#notes", description: "Private notes and observations", icon: FileText },
  { label: "Associates", href: "#associates", description: "Connected people and organizations", icon: Network },
  { label: "Research", href: "#open-questions", description: "Questions and research log", icon: Search },
];

type ProfileMobileNavProps = {
  treeHref: string;
  personName: string;
  showMedia: boolean;
  showNotes: boolean;
  showAssociates: boolean;
  showResearch: boolean;
};

export function ProfileMobileNav({
  treeHref,
  personName,
  showMedia,
  showNotes,
  showAssociates,
  showResearch,
}: ProfileMobileNavProps) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("Overview");
  const [shareStatus, setShareStatus] = useState<"idle" | "copied">("idle");
  const drawerItems = DRAWER_ITEMS.filter((item) => {
    if (item.label === "Media") return showMedia;
    if (item.label === "Notes") return showNotes;
    if (item.label === "Associates") return showAssociates;
    if (item.label === "Research") return showResearch;
    return true;
  });

  const handleNavigate = (label: string) => {
    setActive(label === "Timeline" ? "Events" : label);
    setOpen(false);
  };

  const handleShare = async () => {
    const url = window.location.href;
    const title = `${personName} | The Gonsalves Family`;

    try {
      if (navigator.share) {
        await navigator.share({ title, url });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setShareStatus("copied");
        window.setTimeout(() => setShareStatus("idle"), 1800);
      }
    } catch {
      // Sharing can be cancelled by the user; keep the drawer open without surfacing an error.
    }
  };

  return (
    <nav
      aria-label="Profile sections"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[80] px-4 pb-[calc(0.9rem+env(safe-area-inset-bottom))] md:hidden"
    >
      <motion.div
        layout
        transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-auto mx-auto max-w-md overflow-hidden rounded-[1.75rem] border border-border-subtle/90 bg-surface-elevated/95 shadow-[0_18px_46px_rgba(60,45,25,0.18)] backdrop-blur-md"
        style={{
          WebkitBackdropFilter: "blur(16px)",
          backgroundImage:
            "linear-gradient(180deg, rgba(255,248,232,0.96), rgba(247,241,228,0.93)), radial-gradient(circle at 84% 12%, rgba(195,164,90,0.14), transparent 34%)",
        }}
      >
        <AnimatePresence initial={false}>
          {open ? (
            <motion.div
              key="drawer"
              initial={{ height: 0, opacity: 0, y: 16, filter: "blur(6px)" }}
              animate={{ height: "auto", opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ height: 0, opacity: 0, y: 10, filter: "blur(4px)" }}
              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="relative max-h-[min(68dvh,31rem)] overflow-y-auto px-5 pb-3 pt-4">
                <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border-subtle/90" aria-hidden />
                <div
                  className="pointer-events-none absolute right-5 top-8 h-24 w-24 rounded-full border border-link/5"
                  aria-hidden
                />
                <div className="relative">
                  <p className="font-heading text-lg font-semibold text-heading">Navigate this profile</p>
                  <p className="mt-1 max-w-[14rem] text-xs leading-relaxed text-muted">
                    Jump to a section to explore {personName.split(" ")[0] || "this person"}&apos;s life and story.
                  </p>
                </div>
                <div className="relative mt-4 divide-y divide-border-subtle/70">
                  {drawerItems.map((item, index) => (
                    <DrawerLink key={item.label} item={item} index={index} onNavigate={handleNavigate} />
                  ))}
                  <DrawerButton
                    index={drawerItems.length}
                    icon={Share2}
                    label={shareStatus === "copied" ? "Profile link copied" : "Share profile"}
                    description="Share or export this individual"
                    onClick={handleShare}
                  />
                  <DrawerLink
                    item={{ label: "View in Tree", href: treeHref, description: "Open in the family tree", icon: GitBranch }}
                    index={drawerItems.length + 1}
                    onNavigate={handleNavigate}
                  />
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className="grid grid-cols-4 gap-1 border-t border-border-subtle/70 bg-[rgba(255,250,240,0.5)] p-1.5">
          {PRIMARY_ITEMS.map((item) => (
            <CapsuleLink
              key={item.label}
              item={item}
              active={active === item.label}
              onNavigate={handleNavigate}
            />
          ))}
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen((current) => !current)}
            className={`relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-2 text-[0.64rem] font-semibold tracking-[0.03em] transition ${
              open
                ? "bg-link-soft-bg text-link shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_6px_14px_rgba(60,45,25,0.06)]"
                : "text-link hover:bg-link-soft-bg"
            }`}
          >
            <MoreHorizontal className="h-5 w-5" strokeWidth={1.75} aria-hidden />
            <span>More</span>
            {open ? <span className="absolute bottom-1.5 h-0.5 w-1.5 rounded-full bg-link/70" aria-hidden /> : null}
          </button>
        </div>
      </motion.div>
    </nav>
  );
}

function CapsuleLink({
  item,
  active,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  onNavigate: (label: string) => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={() => onNavigate(item.label)}
      className={`relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-2 text-[0.64rem] font-semibold tracking-[0.03em] transition ${
        active
          ? "bg-link-soft-bg text-link shadow-[inset_0_1px_0_rgba(255,255,255,0.65),0_6px_14px_rgba(60,45,25,0.06)]"
          : "text-link/85 hover:bg-link-soft-bg hover:text-link"
      }`}
    >
      <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
      <span>{item.label}</span>
      {active ? <span className="absolute bottom-1.5 h-0.5 w-1.5 rounded-full bg-link/70" aria-hidden /> : null}
    </Link>
  );
}

function DrawerLink({
  item,
  index,
  onNavigate,
}: {
  item: NavItem;
  index: number;
  onNavigate: (label: string) => void;
}) {
  const Icon = item.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1], delay: 0.035 * index }}
    >
      <Link
        href={item.href}
        onClick={() => onNavigate(item.label)}
        className="group flex items-center gap-3 py-3 text-left"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-link transition group-hover:bg-link-soft-bg">
          <Icon className="h-5 w-5" strokeWidth={1.65} aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-heading">{item.label}</span>
          <span className="mt-0.5 block text-xs leading-snug text-muted">{item.description}</span>
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted/75 transition group-hover:translate-x-0.5 group-hover:text-link" aria-hidden />
      </Link>
    </motion.div>
  );
}

function DrawerButton({
  icon: Icon,
  label,
  description,
  index,
  onClick,
}: {
  icon: typeof UserRound;
  label: string;
  description: string;
  index: number;
  onClick: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1], delay: 0.035 * index }}
    >
      <button type="button" onClick={onClick} className="group flex w-full items-center gap-3 py-3 text-left">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-link transition group-hover:bg-link-soft-bg">
          <Icon className="h-5 w-5" strokeWidth={1.65} aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-heading">{label}</span>
          <span className="mt-0.5 block text-xs leading-snug text-muted">{description}</span>
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted/75 transition group-hover:translate-x-0.5 group-hover:text-link" aria-hidden />
      </button>
    </motion.div>
  );
}
