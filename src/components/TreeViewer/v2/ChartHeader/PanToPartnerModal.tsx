"use client";

export interface PanToPartnerModalProps {
  open: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function PanToPartnerModal({
  open,
  onConfirm,
  onClose,
}: PanToPartnerModalProps) {
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
          background: "var(--tree-surface-dim)",
          border: "1px solid var(--tree-border)",
          borderRadius: 14,
          padding: "28px 32px",
          maxWidth: 360,
          width: "90%",
          boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <p
          style={{
            color: "var(--tree-text)",
            fontSize: 15,
            fontWeight: 600,
            marginBottom: 20,
            fontFamily: "system-ui, sans-serif",
          }}
        >
          Pan to newly opened partner(s)?
        </p>
        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "flex-end",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "9px 18px",
              background: "var(--hover-overlay)",
              border: "1px solid var(--tree-border)",
              borderRadius: 7,
              color: "var(--tree-text)",
              cursor: "pointer",
              fontSize: 13,
              fontFamily: "system-ui, sans-serif",
            }}
          >
            No
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
            }}
            style={{
              padding: "9px 18px",
              background: "var(--tree-root)",
              border: "1px solid var(--tree-root)",
              borderRadius: 7,
              color: "var(--surface-elevated)",
              cursor: "pointer",
              fontSize: 13,
              fontFamily: "system-ui, sans-serif",
            }}
          >
            Yes
          </button>
        </div>
      </div>
    </div>
  );
}
