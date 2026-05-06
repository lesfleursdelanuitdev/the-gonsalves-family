"use client";

import {
  Heart,
  ArrowUp,
  Users,
  ArrowDown,
  Home,
  ChevronsUpDown,
  Search,
  History,
  UserCircle,
  HelpCircle,
  Columns2,
  MoreHorizontal,
  ZoomIn,
  Share2,
  Info,
  Settings,
  PanelTopOpen,
  Move,
} from "lucide-react";
import { Crest } from "@/components/wireframe";

export interface TutorialModalProps {
  open: boolean;
  onClose: () => void;
  isMobile: boolean;
}

const iconSize = 18;
const strongLabelStyle: React.CSSProperties = { color: "#2e7a52" };
const rowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  marginBottom: 10,
  color: "var(--tree-text)",
  fontSize: 13,
  fontFamily: "system-ui, sans-serif",
};
const sectionTitleStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "#8b2e2e",
  marginBottom: 10,
  marginTop: 16,
};
const iconWrapPadding = 10;
const iconWrapStyle: React.CSSProperties = {
  flexShrink: 0,
  width: iconSize + iconWrapPadding * 2,
  height: iconSize + iconWrapPadding * 2,
  padding: iconWrapPadding,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "#ece5d4",
  border: "1px solid rgba(0, 0, 0, 0.08)",
  borderRadius: "50%",
  color: "var(--tree-text-muted)",
};
const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 18,
  fontWeight: 600,
  color: "var(--heading)",
  fontFamily: "var(--font-heading-raw), serif",
};

function TutorialRow({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div style={rowStyle}>
      <span style={iconWrapStyle}>{icon}</span>
      <span>{children}</span>
    </div>
  );
}

function TutorialPersonCardSection() {
  return (
    <div
      style={{
        borderBottom: "1px solid rgba(0, 0, 0, 0.1)",
        paddingBottom: 16,
        marginBottom: 16,
      }}
    >
      <div style={{ ...sectionTitleStyle, marginTop: 20 }}>Person card buttons</div>
      <TutorialRow icon={<Heart size={iconSize} strokeWidth={2} />}>
        <strong style={strongLabelStyle}>Show partners</strong> — open the partner list and pick who to show on the
        tree.
      </TutorialRow>
      <TutorialRow icon={<ArrowUp size={iconSize} strokeWidth={2} />}>
        <strong style={strongLabelStyle}>Show parents</strong> — jump to this person’s parents.
      </TutorialRow>
      <TutorialRow icon={<Users size={iconSize} strokeWidth={2} />}>
        <strong style={strongLabelStyle}>Show siblings</strong> — view siblings for this person.
      </TutorialRow>
      <TutorialRow icon={<ArrowDown size={iconSize} strokeWidth={2} />}>
        <strong style={strongLabelStyle}>Display next generation</strong> — reveal the next generation of children when
        available.
      </TutorialRow>
      <TutorialRow icon={<Home size={iconSize} strokeWidth={2} />}>
        <strong style={strongLabelStyle}>Make root of tree</strong> — make this person the new root of the chart.
      </TutorialRow>
      <TutorialRow icon={<ChevronsUpDown size={iconSize} strokeWidth={2} />}>
        <strong style={strongLabelStyle}>Collapse / expand subtree</strong> — hide or show this person’s descendants
        (only when they have children in the tree).
      </TutorialRow>
    </div>
  );
}

function TutorialMobileChrome() {
  return (
    <>
      <div
        style={{
          borderBottom: "1px solid rgba(0, 0, 0, 0.1)",
          paddingBottom: 16,
          marginBottom: 16,
        }}
      >
        <div style={sectionTitleStyle}>Chart & zoom</div>
        <TutorialRow icon={<Move size={iconSize} strokeWidth={2} />}>
          <strong style={strongLabelStyle}>Pan</strong> — drag on the chart background to move the tree around.
        </TutorialRow>
        <TutorialRow icon={<ZoomIn size={iconSize} strokeWidth={2} />}>
          <strong style={strongLabelStyle}>Zoom (right edge)</strong> — use <strong style={strongLabelStyle}>+</strong>{" "}
          and <strong style={strongLabelStyle}>−</strong> to zoom in and out, and the{" "}
          <strong style={strongLabelStyle}>fit</strong> control (diagonal arrows) to fit the chart back on screen.
        </TutorialRow>
      </div>

      <div
        style={{
          borderBottom: "1px solid rgba(0, 0, 0, 0.1)",
          paddingBottom: 16,
          marginBottom: 16,
        }}
      >
        <div style={sectionTitleStyle}>Top bar</div>
        <TutorialRow icon={<Columns2 size={iconSize} strokeWidth={2} />}>
          <strong style={strongLabelStyle}>Charts</strong> — choose Descendancy, Pedigree, or Vertical Pedigree.
        </TutorialRow>
        <TutorialRow icon={<History size={iconSize} strokeWidth={2} />}>
          <strong style={strongLabelStyle}>History</strong> — open your navigation history (undo, redo, clear).
        </TutorialRow>
        <TutorialRow icon={<UserCircle size={iconSize} strokeWidth={2} />}>
          <strong style={strongLabelStyle}>Jump to Person</strong> — pick someone already in the chart and move the
          view to them.
        </TutorialRow>
        <TutorialRow icon={<MoreHorizontal size={iconSize} strokeWidth={2} />}>
          <strong style={strongLabelStyle}>More</strong> — opens the menu described below (Share, shortcuts, Info,{" "}
          <strong style={strongLabelStyle}>Help</strong>, Settings).
        </TutorialRow>
      </div>

      <div
        style={{
          borderBottom: "1px solid rgba(0, 0, 0, 0.1)",
          paddingBottom: 16,
          marginBottom: 16,
        }}
      >
        <div style={sectionTitleStyle}>More menu</div>
        <TutorialRow icon={<Search size={iconSize} strokeWidth={2} />}>
          <strong style={strongLabelStyle}>Find Person for New Chart</strong> — search the database and set a new root.
        </TutorialRow>
        <TutorialRow icon={<Home size={iconSize} strokeWidth={2} />}>
          <strong style={strongLabelStyle}>Center on Current Person</strong> — pan and zoom so the current root person
          is centered in the view.
        </TutorialRow>
        <TutorialRow icon={<Heart size={iconSize} strokeWidth={2} />}>
          <strong style={strongLabelStyle}>Toggle All Partners</strong> — on descendancy charts, expand or collapse all
          partner branches at once (when this action is available).
        </TutorialRow>
        <TutorialRow icon={<Share2 size={iconSize} strokeWidth={2} />}>
          <strong style={strongLabelStyle}>Share</strong> — share the page link (or copy it if sharing isn’t
          available).
        </TutorialRow>
        <TutorialRow icon={<Info size={iconSize} strokeWidth={2} />}>
          <strong style={strongLabelStyle}>Info</strong> — notes about the dataset.
        </TutorialRow>
        <TutorialRow icon={<HelpCircle size={iconSize} strokeWidth={2} />}>
          <strong style={strongLabelStyle}>Help</strong> — opens this guide again.
        </TutorialRow>
        <TutorialRow icon={<Settings size={iconSize} strokeWidth={2} />}>
          <strong style={strongLabelStyle}>Settings</strong> — depth, cards, and other display options.
        </TutorialRow>
      </div>
    </>
  );
}

function TutorialDesktopChrome() {
  return (
    <>
      <div
        style={{
          borderBottom: "1px solid rgba(0, 0, 0, 0.1)",
          paddingBottom: 16,
          marginBottom: 16,
        }}
      >
        <div style={sectionTitleStyle}>Top toolbar</div>
        <TutorialRow icon={<Search size={iconSize} strokeWidth={2} />}>
          <strong style={strongLabelStyle}>Search</strong> — type given and family names to find someone in the tree and
          set them as root.
        </TutorialRow>
        <TutorialRow icon={<Columns2 size={iconSize} strokeWidth={2} />}>
          <strong style={strongLabelStyle}>Charts</strong> — choose Descendancy, Pedigree, or Vertical Pedigree.
        </TutorialRow>
        <TutorialRow icon={<History size={iconSize} strokeWidth={2} />}>
          <strong style={strongLabelStyle}>History</strong> — open navigation history (undo, redo, clear).
        </TutorialRow>
        <TutorialRow icon={<Home size={iconSize} strokeWidth={2} />}>
          <strong style={strongLabelStyle}>Center on Current Person</strong> — pan and zoom so the current root person
          is centered.
        </TutorialRow>
        <TutorialRow icon={<PanelTopOpen size={iconSize} strokeWidth={2} />}>
          <strong style={strongLabelStyle}>Show / Hide header</strong> — collapse or expand the title banner above the
          toolbar to save space.
        </TutorialRow>
        <TutorialRow icon={<MoreHorizontal size={iconSize} strokeWidth={2} />}>
          <strong style={strongLabelStyle}>More</strong> — Share, Info, <strong style={strongLabelStyle}>Help</strong>{" "}
          (this guide), and Settings.
        </TutorialRow>
      </div>

      <div
        style={{
          borderBottom: "1px solid rgba(0, 0, 0, 0.1)",
          paddingBottom: 16,
          marginBottom: 16,
        }}
      >
        <div style={sectionTitleStyle}>Alongside the chart</div>
        <TutorialRow icon={<Move size={iconSize} strokeWidth={2} />}>
          <strong style={strongLabelStyle}>Pan</strong> — drag on the chart background (or use a trackpad) to move the
          tree.
        </TutorialRow>
        <TutorialRow icon={<ZoomIn size={iconSize} strokeWidth={2} />}>
          <strong style={strongLabelStyle}>Zoom strip</strong> — on the right: zoom in, zoom out, and fit. When a
          minimap is available, an extra control can appear there too.
        </TutorialRow>
      </div>
    </>
  );
}

export function TutorialModal({ open, onClose, isMobile }: TutorialModalProps) {
  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 250,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "linear-gradient(to bottom, #f0ebe0, #f4efe2, #f0ebe0)",
          border: "1px solid var(--tree-border)",
          borderRadius: 14,
          padding: isMobile ? "24px 28px 28px 28px" : "24px 28px",
          maxWidth: 400,
          width: "92%",
          maxHeight: "85vh",
          overflowY: "auto",
          boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: isMobile ? 10 : 16,
            paddingTop: isMobile ? 8 : 12,
            paddingBottom: 16,
            borderBottom: "1px solid rgba(0, 0, 0, 0.1)",
            marginBottom: 16,
          }}
        >
          <div
            style={{
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Crest size={isMobile ? "md" : "lg"} alt="Gonsalves family crest" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={titleStyle}>
              <span style={{ borderBottom: "2px solid #8b2e2e" }}>Welcome</span>
            </h2>
            <p
              style={{
                margin: "10px 0 0",
                fontSize: isMobile ? 13 : 14,
                lineHeight: 1.45,
                color: "var(--tree-text)",
                fontFamily: "system-ui, sans-serif",
              }}
            >
              This is the Tree Viewer for the Gonsalves Family Genealogy pages. Use the sections below to learn the
              controls — they differ a bit on phones and on larger screens.
            </p>
          </div>
        </div>

        <h2 style={{ ...titleStyle, marginTop: 20 }}>
          Getting{" "}
          <span
            style={{
              fontStyle: "italic",
              borderBottom: "2px solid #8b2e2e",
            }}
          >
            started
          </span>
        </h2>

        <TutorialPersonCardSection />

        {isMobile ? <TutorialMobileChrome /> : <TutorialDesktopChrome />}

        <div style={sectionTitleStyle}>Open this again</div>
        <TutorialRow icon={<HelpCircle size={iconSize} strokeWidth={2} />}>
          Anytime: open <strong style={strongLabelStyle}>More</strong> (⋯) in the top bar, then{" "}
          <strong style={strongLabelStyle}>Help</strong>.
        </TutorialRow>

        <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "9px 20px",
              background: "var(--tree-root)",
              border: "1px solid var(--tree-root)",
              borderRadius: 7,
              color: "var(--surface-elevated)",
              cursor: "pointer",
              fontSize: 13,
              fontFamily: "system-ui, sans-serif",
              fontWeight: 500,
            }}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
