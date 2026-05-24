"use client";

import { useState } from "react";
import { PersonPicker, type PersonOption } from "@/components/search/PersonPicker";
import { RelationshipLabel } from "@ligneous/relationship-calculator";
import type { RelationshipResult } from "@ligneous/relationship-calculator";

interface ProfileRelationshipCalculatorProps {
  sourceId: string;
  sourceName: string;
}

export function ProfileRelationshipCalculator({ sourceId, sourceName }: ProfileRelationshipCalculatorProps) {
  const [personB, setPersonB] = useState<PersonOption | null>(null);
  const [result, setResult] = useState<RelationshipResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => { setResult(null); setError(null); };

  const handleCalculate = async () => {
    if (!personB) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/tree/relationship-between", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source_id: sourceId, target_id: personB.id }),
      });
      const data = (await res.json()) as RelationshipResult & { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not calculate relationship.");
        return;
      }
      setResult(data);
    } catch {
      setError("Could not calculate relationship. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <p className="font-body text-xs font-semibold uppercase tracking-[0.12em] text-muted">Person A</p>
          <div className="flex min-h-[44px] items-center rounded-lg border border-[#d8cfc0] bg-[#f9f6f1] px-3 py-2">
            <p className="font-body text-sm font-medium text-text">{sourceName}</p>
          </div>
        </div>
        <div className="space-y-2">
          <p className="font-body text-xs font-semibold uppercase tracking-[0.12em] text-muted">Person B</p>
          <PersonPicker
            value={personB}
            onChange={(p) => { setPersonB(p); reset(); }}
            placeholder="Search for another person…"
          />
        </div>
      </div>

      <button
        type="button"
        disabled={!personB || loading}
        onClick={() => void handleCalculate()}
        className="bg-primary text-primary-foreground hover:bg-primary-hover rounded-lg px-6 py-2.5 font-body text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-45"
      >
        {loading ? "Calculating…" : "Calculate relationship"}
      </button>

      {error ? (
        <div
          role="alert"
          className="rounded-lg border border-[#b85450]/35 bg-[#fff5f5] px-4 py-3 font-body text-sm text-[#6b2824]"
        >
          {error}
        </div>
      ) : null}

      {result ? (
        <div className="rounded-xl border border-border-subtle bg-surface/50 px-5 py-5">
          <p className="mb-4 font-body text-xs font-medium uppercase tracking-wide text-muted">
            {sourceName} relative to {personB?.displayName}
          </p>
          <RelationshipLabel result={result} />
        </div>
      ) : null}
    </div>
  );
}
