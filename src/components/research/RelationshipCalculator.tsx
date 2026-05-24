"use client";

import { useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { PersonPicker, type PersonOption } from "@/components/search/PersonPicker";
import { RelationshipLabel } from "@ligneous/relationship-calculator";
import type { RelationshipResult } from "@ligneous/relationship-calculator";

export function RelationshipCalculator() {
  const [personA, setPersonA] = useState<PersonOption | null>(null);
  const [personB, setPersonB] = useState<PersonOption | null>(null);
  const [result, setResult] = useState<RelationshipResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canCalculate = Boolean(personA && personB && personA.id !== personB.id);

  const reset = () => { setResult(null); setError(null); };

  const handleSwap = () => {
    setPersonA(personB);
    setPersonB(personA);
    reset();
  };

  const handleCalculate = async () => {
    if (!personA || !personB) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/tree/relationship-between", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source_id: personA.id, target_id: personB.id }),
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
    <div className="space-y-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <p className="font-body text-sm font-medium text-heading">Person A</p>
          <PersonPicker
            value={personA}
            onChange={(p) => { setPersonA(p); reset(); }}
            placeholder="Search for a person…"
          />
        </div>
        <div className="space-y-2">
          <p className="font-body text-sm font-medium text-heading">Person B</p>
          <PersonPicker
            value={personB}
            onChange={(p) => { setPersonB(p); reset(); }}
            placeholder="Search for another person…"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={!canCalculate || loading}
          onClick={() => void handleCalculate()}
          className="bg-primary text-primary-foreground hover:bg-primary-hover rounded-lg px-6 py-2.5 font-body text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-45"
        >
          {loading ? "Calculating…" : "Calculate relationship"}
        </button>
        {personA && personB ? (
          <button
            type="button"
            onClick={handleSwap}
            className="border-border-subtle text-heading hover:bg-surface hover:border-primary/35 inline-flex items-center gap-2 rounded-lg border bg-surface-2 px-3 py-2.5 font-body text-sm font-medium transition"
          >
            <ArrowLeftRight className="size-3.5 shrink-0" aria-hidden />
            Swap A ↔ B
          </button>
        ) : null}
        {personA && personB && personA.id === personB.id ? (
          <p className="font-body text-sm text-muted">Please pick two different people.</p>
        ) : null}
      </div>

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
            {personA?.displayName} relative to {personB?.displayName}
          </p>
          <RelationshipLabel result={result} />
        </div>
      ) : null}
    </div>
  );
}
