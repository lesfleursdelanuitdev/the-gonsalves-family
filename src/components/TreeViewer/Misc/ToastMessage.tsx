"use client";

export interface ToastPart {
  pedi: string;
  names: string;
}

export interface ToastMessageProps {
  toast: { title: string; parts: ToastPart[] } | null;
  onDismiss: () => void;
}

export function ToastMessage({ toast, onDismiss }: ToastMessageProps) {
  if (!toast) return null;
  return (
    <div
      style={{
        position: "fixed",
        bottom: 32,
        left: "50%",
        transform: "translateX(-50%)",
        background: "var(--tree-toast-bg)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid var(--tree-toast-border)",
        borderRadius: 12,
        padding: "10px 16px",
        color: "var(--tree-text)",
        fontSize: 12.5,
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontWeight: 400,
        letterSpacing: "0.01em",
        zIndex: 300,
        maxWidth: 500,
        display: "flex",
        alignItems: "center",
        gap: 12,
        boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
        animation: "slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <style>{`@keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
      <span style={{ color: "var(--tree-linked)", fontSize: 14 }}>⚠</span>
      <div style={{ flex: 1, lineHeight: 1.6 }}>
        <div style={{ marginBottom: 4, color: "var(--tree-text)" }}>{toast.title}</div>
        {toast.parts.map((p, i) => (
          <div key={i} style={{ color: "var(--tree-text-muted)", fontSize: 12 }}>
            <span style={{ fontWeight: 700, color: "var(--tree-text)" }}>
              {p.pedi === "adopted" ? "Adoptive" : "Biological"}:
            </span>{" "}
            {p.names}
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        style={{
          background: "none",
          border: "none",
          color: "var(--tree-text-subtle)",
          cursor: "pointer",
          fontSize: 13,
          lineHeight: 1,
          padding: "2px 4px",
          borderRadius: 4,
          flexShrink: 0,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--tree-text-muted)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--tree-text-subtle)")}
      >
        ✕
      </button>
    </div>
  );
}
