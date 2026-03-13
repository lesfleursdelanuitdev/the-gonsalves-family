"use client";

import { PanelCloseButton } from "./PanelCloseButton";
import type { TreeState } from "@/descendancy-chart";

interface DebugPanelProps {
  state: TreeState;
  onClose: () => void;
}

/** Serialize state for display: Maps and other non-JSON values as readable objects. */
function serializableState(state: TreeState): unknown {
  return {
    strategyName: state.strategyName,
    rootId: state.rootId,
    viewState: serializableViewState(state.viewState),
    history: state.history,
    historyIndex: state.historyIndex,
  };
}

function serializableViewState(vs: unknown): unknown {
  if (vs == null || typeof vs !== "object") return vs;
  const o = vs as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(o)) {
    if (v instanceof Map) {
      out[k] = Object.fromEntries(v);
    } else if (v != null && typeof v === "object" && !Array.isArray(v)) {
      out[k] = serializableViewState(v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

export function DebugPanel({ state, onClose }: DebugPanelProps) {
  const display = JSON.stringify(serializableState(state), null, 2);

  return (
    <div
      style={{
        position: "fixed",
        top: 10,
        right: 10,
        background: "var(--tree-surface-dim, #F4EFE2)",
        border: "1px solid var(--tree-border, #D9CCB3)",
        borderRadius: 8,
        padding: "12px 16px",
        fontFamily: "monospace",
        fontSize: 12,
        color: "var(--tree-text, #2C2A26)",
        maxHeight: 400,
        overflowY: "auto",
        zIndex: 200,
        maxWidth: 380,
        whiteSpace: "pre",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <span style={{ color: "var(--tree-text, #2C2A26)", fontSize: 12, flexShrink: 0, fontWeight: 600 }}>
        Tree State
      </span>
      <pre
        style={{
          margin: 0,
          overflow: "auto",
          flex: "1 1 0",
          minHeight: 60,
          color: "var(--tree-text-muted, #6F675A)",
          fontSize: 11,
        }}
      >
        {display}
      </pre>
      <PanelCloseButton onClick={onClose} />
    </div>
  );
}
