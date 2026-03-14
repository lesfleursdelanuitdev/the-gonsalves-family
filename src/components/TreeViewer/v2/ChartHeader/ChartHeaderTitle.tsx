"use client";

interface ChartHeaderTitleProps {
  displayName?: string | null;
}

export function ChartHeaderTitle({ displayName }: ChartHeaderTitleProps) {
  return (
    <div>
      <p className="section-subtitle mb-0.5" style={{ fontSize: "0.6rem" }}>
        Descendancy Chart
      </p>
      <h2 className="font-heading text-base font-semibold tracking-tight text-heading">
        {displayName ? (
          <>
            {displayName} — <span className="italic">Descendants</span>
          </>
        ) : (
          <span className="italic">Descendants</span>
        )}
      </h2>
    </div>
  );
}
