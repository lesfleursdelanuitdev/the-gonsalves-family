"use client";

import { ChevronDown, X } from "lucide-react";
import { DEFAULT_MAX_DEPTH } from "@/descendancy-chart";

export interface DepthSliderProps {
  isMobile: boolean;
  maxDepth: number;
  /** When set, label shows this (actual generations in tree) instead of maxDepth. */
  displayedDepth?: number;
  onMaxDepthChange: (n: number) => void;
  showDepthPanel: boolean;
  /** Mobile only: toggle depth panel and e.g. close search. */
  onToggleDepthPanel?: () => void;
}

const DEPTH_OPTIONS = Array.from({ length: DEFAULT_MAX_DEPTH }, (_, i) => i + 1);

/** Toolbar control: desktop = dropdown 1..max with current depth selected; mobile = button that opens depth panel. */
export function DepthSlider({
  isMobile,
  maxDepth,
  displayedDepth,
  onMaxDepthChange,
  showDepthPanel,
  onToggleDepthPanel,
}: DepthSliderProps) {
  const currentDepth = Math.max(1, Math.min(displayedDepth ?? maxDepth, DEFAULT_MAX_DEPTH));
  if (isMobile) {
    return (
      <button
        type="button"
        onClick={onToggleDepthPanel}
        title="Depth"
        style={{
          background: showDepthPanel ? "var(--hover-overlay)" : "#e5dcc8",
          border: `1px solid ${showDepthPanel ? "var(--tree-root)" : "var(--tree-border)"}`,
          borderRadius: 6,
          color: showDepthPanel ? "var(--tree-root)" : "var(--tree-text-muted)",
          padding: "4px 8px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <ChevronDown size={13} />
      </button>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        color: "var(--tree-text-muted)",
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize: 11, whiteSpace: "nowrap" }}>Depth:</span>
      <select
        aria-label="Generations to show"
        value={currentDepth}
        onChange={(e) => onMaxDepthChange(Number(e.target.value))}
        style={{
          fontSize: 11,
          padding: "2px 20px 2px 6px",
          borderRadius: 6,
          border: "1px solid var(--tree-border)",
          background: "#e5dcc8",
          color: "var(--tree-text)",
          cursor: "pointer",
          appearance: "none",
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b5b4f' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 4px center",
        }}
      >
        {DEPTH_OPTIONS.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
    </div>
  );
}

export interface DepthSliderPanelProps {
  maxDepth: number;
  /** When set, label shows this (actual generations in tree) instead of maxDepth. */
  displayedDepth?: number;
  onMaxDepthChange: (n: number) => void;
  /** When provided, render as a centered modal (mobile). When undefined, render as slide-down panel. */
  onClose?: () => void;
}

/** Mobile-only panel with depth dropdown. As modal when onClose is provided; otherwise slide-down. */
export function DepthSliderPanel({ maxDepth, displayedDepth, onMaxDepthChange, onClose }: DepthSliderPanelProps) {
  const currentDepth = Math.max(1, Math.min(displayedDepth ?? maxDepth, DEFAULT_MAX_DEPTH));
  const content = (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <span style={{ color: "var(--tree-text-muted)", fontSize: 11, whiteSpace: "nowrap", fontFamily: "system-ui, sans-serif" }}>
        Depth:
      </span>
      <select
        aria-label="Generations to show"
        value={currentDepth}
        onChange={(e) => onMaxDepthChange(Number(e.target.value))}
        style={{
          fontSize: 12,
          padding: "6px 28px 6px 10px",
          borderRadius: 6,
          border: "1px solid var(--tree-border)",
          background: "var(--tree-panel-bg)",
          color: "var(--tree-text)",
          cursor: "pointer",
          flex: 1,
          maxWidth: 120,
          appearance: "none",
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b5b4f' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 8px center",
        }}
      >
        {DEPTH_OPTIONS.map((n) => (
          <option key={n} value={n}>
            {n} {n === 1 ? "generation" : "generations"}
          </option>
        ))}
      </select>
    </div>
  );

  if (onClose) {
    return (
      <>
        <style>{`
          @keyframes depthModalFade {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes depthModalScale {
            from { opacity: 0; transform: scale(0.96); }
            to { opacity: 1; transform: scale(1); }
          }
        `}</style>
        <div
          role="dialog"
          aria-label="Tree depth"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            animation: "depthModalFade 0.2s ease-out",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.4)",
            }}
            onClick={onClose}
            aria-hidden
          />
          <div
            style={{
              position: "relative",
              background: "var(--tree-panel-bg)",
              borderRadius: 12,
              boxShadow: "0 12px 40px rgba(0,0,0,0.2)",
              maxWidth: "min(360px, 90dvw)",
              overflow: "hidden",
              animation: "depthModalScale 0.2s ease-out",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px 8px",
                borderBottom: "1px solid var(--tree-panel-border)",
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  fontFamily: "Inter, sans-serif",
                  color: "var(--tree-text)",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Tree depth
              </span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--tree-text-subtle)",
                  fontSize: 16,
                  lineHeight: 1,
                  padding: 4,
                }}
              >
                <X size={16} />
              </button>
            </div>
            <div style={{ padding: "10px 14px", fontSize: 11 }}>
              {content}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`@keyframes slideDown { from { opacity:0; transform:translateY(-8px) } to { opacity:1; transform:translateY(0) } }`}</style>
      <div
        style={{
          background: "var(--tree-surface-dim)",
          borderBottom: "1px solid var(--tree-border)",
          padding: "12px 16px",
          zIndex: 99,
          flexShrink: 0,
          animation: "slideDown 0.18s ease-out",
        }}
      >
        {content}
      </div>
    </>
  );
}
