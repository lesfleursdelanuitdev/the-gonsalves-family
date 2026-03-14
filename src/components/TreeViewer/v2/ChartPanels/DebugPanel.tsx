"use client";

import type { TreeState } from "@/descendancy-chart";
import { ChartPanel } from "./ChartPanel";

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
    <ChartPanel
      variant="debug"
      placement={{ top: 10, right: 10 }}
      title="Tree State"
      onClose={onClose}
      maxWidth={380}
      maxHeight={400}
      zIndex={200}
      containerStyle={{ whiteSpace: "pre" }}
    >
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
    </ChartPanel>
  );
}
