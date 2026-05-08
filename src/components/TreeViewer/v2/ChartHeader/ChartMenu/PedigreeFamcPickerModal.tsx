"use client";

import type { ChartViewStrategyName } from "@/genealogy-visualization-engine";
import type { FamiliesAsChildResponse } from "@/components/TreeViewer/v2/PersonDetailOverlay/types";
import { getChartStrategyLabel } from "../../chartStrategy";

type FamilyOfOrigin = FamiliesAsChildResponse["familiesOfOrigin"][number];

export interface PedigreeFamcPickerModalProps {
  open: boolean;
  /** Chart mode user chose before this step (pedigree or vertical pedigree). */
  pendingStrategy: ChartViewStrategyName;
  families: FamilyOfOrigin[];
  onClose: () => void;
  /** Called with the selected family xref (`@F…@`). */
  onSelectFamily: (familyXref: string) => void;
  /** When choosing FAMC from a person card (not initial chart switch), whose branch is being configured. */
  forPersonId?: string | null;
}

const overlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.6)",
  backdropFilter: "blur(4px)",
  WebkitBackdropFilter: "blur(4px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 260,
};

const panel: React.CSSProperties = {
  background: "var(--tree-surface-dim)",
  border: "1px solid var(--tree-border)",
  borderRadius: 14,
  padding: "24px 28px",
  maxWidth: 420,
  width: "90%",
  maxHeight: "80vh",
  overflowY: "auto",
  boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
};

const optionBase: React.CSSProperties = {
  width: "100%",
  textAlign: "left",
  border: "1px solid var(--tree-border)",
  borderRadius: 10,
  padding: "12px 14px",
  marginTop: 10,
  cursor: "pointer",
  fontFamily: "system-ui, sans-serif",
  background: "rgba(229, 220, 200, 0.35)",
  color: "var(--tree-text)",
};

function parentSummary(fam: FamilyOfOrigin): string {
  const parts = fam.parents
    .map((p) => p.name?.trim())
    .filter((n): n is string => Boolean(n));
  return parts.length > 0 ? parts.join(" · ") : fam.family.xref;
}

export function PedigreeFamcPickerModal({
  open,
  pendingStrategy,
  families,
  onClose,
  onSelectFamily,
  forPersonId = null,
}: PedigreeFamcPickerModalProps) {
  if (!open) return null;

  const modeLabel = getChartStrategyLabel(pendingStrategy);

  return (
    <div style={overlay} onClick={onClose} role="presentation">
      <div
        style={panel}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pedigree-famc-modal-title"
      >
        <div
          id="pedigree-famc-modal-title"
          style={{
            color: "var(--tree-text)",
            fontSize: 16,
            fontWeight: 600,
            marginBottom: 8,
            fontFamily: "var(--font-heading-raw), Georgia, serif",
          }}
        >
          {forPersonId
            ? "Choose parent family"
            : `Choose a family for ${modeLabel.toLowerCase()}`}
        </div>
        <p
          style={{
            color: "var(--tree-text-muted)",
            fontSize: 13,
            marginBottom: 6,
            lineHeight: 1.5,
            fontFamily: "system-ui, sans-serif",
          }}
        >
          This person is listed as a child in more than one family. Pick which parents’ line the chart should follow
          for the first generation of ancestors (vertical pedigree uses the same choice).
        </p>
        {families.map((fam) => (
          <button
            key={fam.family.id}
            type="button"
            style={optionBase}
            onClick={() => {
              onSelectFamily(fam.family.xref);
            }}
          >
            <div style={{ fontWeight: 600, fontSize: 14 }}>{fam.parentsLabel ?? "Parents"}</div>
            <div style={{ fontSize: 12, color: "var(--tree-text-muted)", marginTop: 4, lineHeight: 1.45 }}>
              {parentSummary(fam)}
            </div>
            <div style={{ fontSize: 11, color: "var(--tree-text-muted)", marginTop: 6, opacity: 0.85 }}>
              Family {fam.family.xref}
            </div>
          </button>
        ))}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: "1px solid var(--tree-border)",
              borderRadius: 8,
              padding: "8px 16px",
              fontSize: 12,
              cursor: "pointer",
              background: "var(--tree-surface)",
              color: "var(--tree-text)",
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
