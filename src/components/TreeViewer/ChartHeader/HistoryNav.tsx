"use client";

interface HistoryNavProps {
  historyIndex: number;
  historyLength: number;
  onBack: () => void;
  onForward: () => void;
  blinkBack?: boolean;
}

export function HistoryNav({ historyIndex, historyLength, onBack, onForward, blinkBack }: HistoryNavProps) {
  return (
    <>
      <style>{`
        @keyframes navBlink {
          0%, 100% { background: transparent; border-color: var(--tree-button-border); box-shadow: none; }
          50% { background: var(--hover-overlay); border-color: var(--tree-root); box-shadow: 0 0 0 1px var(--tree-root); }
        }
      `}</style>
      <button
        type="button"
        title="Back"
        onClick={onBack}
        disabled={historyIndex <= 0}
        style={{
          background: "transparent",
          border: "1px solid var(--tree-button-border)",
          borderRadius: 6,
          color: historyIndex <= 0 ? "var(--tree-button-disabled)" : "var(--tree-text-muted)",
          cursor: historyIndex <= 0 ? "not-allowed" : "pointer",
          fontSize: 14,
          padding: "5px 10px",
          fontFamily: "inherit",
          animation: blinkBack ? "navBlink 0.6s ease-out" : undefined,
        }}
      >
        ←
      </button>
      <button
        type="button"
        title="Forward"
        onClick={onForward}
        disabled={historyIndex >= historyLength - 1}
        style={{
          background: "transparent",
          border: "1px solid var(--tree-button-border)",
          borderRadius: 6,
          color: historyIndex >= historyLength - 1 ? "var(--tree-button-disabled)" : "var(--tree-text-muted)",
          cursor: historyIndex >= historyLength - 1 ? "not-allowed" : "pointer",
          fontSize: 14,
          padding: "5px 10px",
          fontFamily: "inherit",
        }}
      >
        →
      </button>
    </>
  );
}
