"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { Heart, HelpCircle, Home, Info, MoreHorizontal, Search, Settings, Share2 } from "lucide-react";
import { ChartMenuButton } from "./ChartMenuButtons/ChartMenuButton";

const menuRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  width: "100%",
  border: "none",
  background: "transparent",
  padding: "8px 10px",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 13,
  color: "var(--tree-text)",
  textAlign: "left",
  textDecoration: "none",
  fontFamily: "inherit",
};

export interface ChartMenuMoreProps {
  isMobile?: boolean;
  /** Mobile: deep link for “Find Person for New Chart” (shown inside More). */
  mobileSearchHref?: string;
  /** Mobile: center chart on current root. */
  mobileOnGoHome?: () => void;
  /** Mobile: descendancy — reveal/collapse all partners. */
  mobileOnToggleAllSpouses?: () => void;
  showInfo: boolean;
  onInfoClick?: () => void;
  showSettings: boolean;
  onSettingsClick?: () => void;
  /** Opens the getting-started tutorial (moved from right-side chrome into this menu). */
  onOpenTutorial?: () => void;
}

export function ChartMenuMore(props: ChartMenuMoreProps) {
  const { showInfo, showSettings, isMobile } = props;
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  const onShare = useCallback(async () => {
    if (typeof window === "undefined") return;
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ url, title: document.title });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      }
    } catch (err) {
      const name = err instanceof Error ? err.name : "";
      if (name === "AbortError") return;
      try {
        if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(url);
      } catch {
        /* noop */
      }
    }
    close();
  }, [close]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close();
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, close]);

  const hasMobileOverflow =
    isMobile &&
    (props.mobileSearchHref != null ||
      props.mobileOnGoHome != null ||
      props.mobileOnToggleAllSpouses != null);

  const showMobileFind = Boolean(isMobile && props.mobileSearchHref);
  const showMobileHome = Boolean(isMobile && props.mobileOnGoHome);
  const showMobileToggle = Boolean(isMobile && props.mobileOnToggleAllSpouses);

  return (
    <div ref={rootRef} style={{ position: "relative", display: "inline-block", flexShrink: 0 }}>
      <ChartMenuButton
        icon={<MoreHorizontal size={13} />}
        onClick={() => setOpen((v) => !v)}
        title="More menu"
        label="More"
        emphasizeBackground
        active={open}
      />
      {open && (
        <div
          role="menu"
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            right: 0,
            marginTop: 0,
            minWidth: Math.max(200, hasMobileOverflow ? 220 : 160),
            background: "#f4efe2",
            border: "1px solid var(--tree-border)",
            borderRadius: 8,
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            zIndex: 200,
            padding: 6,
          }}
        >
          {showMobileFind && props.mobileSearchHref ? (
            <Link
              href={props.mobileSearchHref}
              role="menuitem"
              title="Find Person for New Chart"
              aria-label="Find Person for New Chart"
              onClick={() => close()}
              style={menuRowStyle}
            >
              <Search size={14} aria-hidden />
              Find Person for New Chart
            </Link>
          ) : null}
          {showMobileHome && props.mobileOnGoHome ? (
            <button
              type="button"
              role="menuitem"
              aria-label="Center on Current Person"
              onClick={() => {
                props.mobileOnGoHome?.();
                close();
              }}
              style={{
                ...menuRowStyle,
                background: "transparent",
              }}
            >
              <Home size={14} aria-hidden />
              Center on Current Person
            </button>
          ) : null}
          {showMobileToggle && props.mobileOnToggleAllSpouses ? (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                props.mobileOnToggleAllSpouses?.();
                close();
              }}
              style={{
                ...menuRowStyle,
                background: "transparent",
              }}
            >
              <Heart size={14} aria-hidden />
              Toggle All Partners
            </button>
          ) : null}
          {hasMobileOverflow ? (
            <div
              aria-hidden
              style={{
                height: 1,
                margin: "6px 4px",
                background: "rgba(0,0,0,0.08)",
              }}
            />
          ) : null}
          <button
            type="button"
            role="menuitem"
            aria-label="Share"
            onClick={() => void onShare()}
            style={{
              ...menuRowStyle,
              background: "transparent",
            }}
          >
            <Share2 size={14} aria-hidden />
            Share
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              props.onInfoClick?.();
              close();
            }}
            style={{
              ...menuRowStyle,
              background: showInfo ? "var(--hover-overlay)" : "transparent",
            }}
          >
            <Info size={14} aria-hidden />
            Info
          </button>
          {props.onOpenTutorial ? (
            <button
              type="button"
              role="menuitem"
              aria-label="Help"
              onClick={() => {
                props.onOpenTutorial?.();
                close();
              }}
              style={{
                ...menuRowStyle,
                background: "transparent",
              }}
            >
              <HelpCircle size={14} aria-hidden />
              Help
            </button>
          ) : null}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              props.onSettingsClick?.();
              close();
            }}
            style={{
              ...menuRowStyle,
              background: showSettings ? "var(--hover-overlay)" : "transparent",
            }}
          >
            <Settings size={14} aria-hidden />
            Settings
          </button>
        </div>
      )}
    </div>
  );
}
