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
  Settings,
  Info,
  UserCircle,
  HelpCircle,
} from "lucide-react";
import { Crest } from "@/components/wireframe";

export interface TutorialModalProps {
  open: boolean;
  onClose: () => void;
  isMobile: boolean;
  strategyName: string;
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

export function TutorialModal({
  open,
  onClose,
  isMobile,
  strategyName,
}: TutorialModalProps) {
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
            alignItems: "flex-start",
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
                Welcome to the Tree Viewer for the Gonsalves Family Genealogy Pages.
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
              Started
            </span>
          </h2>

          <div
            style={{
              borderBottom: "1px solid rgba(0, 0, 0, 0.1)",
              paddingBottom: 16,
              marginBottom: 16,
            }}
          >
            <div style={{ ...sectionTitleStyle, marginTop: 20 }}>
              Person card buttons
            </div>
            <TutorialRow icon={<Heart size={iconSize} strokeWidth={2} />}>
          <strong style={strongLabelStyle}>Show partners</strong> — open the list of partners; choose one to show on the tree.
        </TutorialRow>
        <TutorialRow icon={<ArrowUp size={iconSize} strokeWidth={2} />}>
          <strong style={strongLabelStyle}>Show parents</strong> — go to this person’s parents.
        </TutorialRow>
        <TutorialRow icon={<Users size={iconSize} strokeWidth={2} />}>
          <strong style={strongLabelStyle}>Show siblings</strong> — view siblings for this person.
        </TutorialRow>
        <TutorialRow icon={<ArrowDown size={iconSize} strokeWidth={2} />}>
          <strong style={strongLabelStyle}>Display next generation</strong> — reveal the next generation of children.
        </TutorialRow>
        <TutorialRow icon={<Home size={iconSize} strokeWidth={2} />}>
          <strong style={strongLabelStyle}>Make root of tree</strong> — set this person as the new root of the tree.
        </TutorialRow>
        <TutorialRow icon={<ChevronsUpDown size={iconSize} strokeWidth={2} />}>
          <strong style={strongLabelStyle}>Collapse / Expand subtree</strong> — hide or show this person’s descendants (only on people who have children in the tree).
        </TutorialRow>
          </div>

        {isMobile && (
          <div
            style={{
              borderBottom: "1px solid rgba(0, 0, 0, 0.1)",
              paddingBottom: 16,
              marginBottom: 16,
            }}
          >
            <div style={sectionTitleStyle}>Menu icons</div>
            <TutorialRow icon={<Search size={iconSize} strokeWidth={2} />}>
              <strong style={strongLabelStyle}>Search database</strong> — find a person to make the new root of the tree.
            </TutorialRow>
            <TutorialRow icon={<Home size={iconSize} strokeWidth={2} />}>
              <strong style={strongLabelStyle}>Center on root</strong> — pan and zoom so the root person is centered.
            </TutorialRow>
            <TutorialRow icon={<History size={iconSize} strokeWidth={2} />}>
              <strong style={strongLabelStyle}>History panel</strong> — open navigation history (undo, redo, clear).
            </TutorialRow>
            <TutorialRow icon={<Settings size={iconSize} strokeWidth={2} />}>
              <strong style={strongLabelStyle}>Settings panel</strong> — tree depth, display options, and more.
            </TutorialRow>
            <TutorialRow icon={<Info size={iconSize} strokeWidth={2} />}>
              <strong style={strongLabelStyle}>Info panel</strong> — dataset information.
            </TutorialRow>
            <TutorialRow icon={<UserCircle size={iconSize} strokeWidth={2} />}>
              <strong style={strongLabelStyle}>Go to person</strong> — jump to a person in the current graph.
            </TutorialRow>
            <TutorialRow icon={<Heart size={iconSize} strokeWidth={2} />}>
              <strong style={strongLabelStyle}>Toggle all partners</strong> — expand or collapse all partner sets at once.
            </TutorialRow>
          </div>
        )}
        <div style={sectionTitleStyle}>Get help later</div>
        <TutorialRow icon={<HelpCircle size={iconSize} strokeWidth={2} />}>
          You can open this tutorial again anytime by clicking the <strong style={strongLabelStyle}>Help</strong> icon in the right menu.
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
