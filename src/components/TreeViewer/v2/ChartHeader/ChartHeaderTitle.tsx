"use client";

interface ChartHeaderTitleProps {
  displayName?: string | null;
  isMobile?: boolean;
}

export function ChartHeaderTitle({ displayName, isMobile }: ChartHeaderTitleProps) {
  const subtitleSize = "0.6rem";
  const titleSize = isMobile ? 12 : 13;
  return (
    <div>
      {!isMobile && (
        <p className="section-subtitle mb-0.5" style={{ fontSize: subtitleSize }}>
          Descendancy Chart
        </p>
      )}
      <h2
        className="font-heading font-semibold tracking-tight text-heading"
        style={{ fontSize: titleSize }}
      >
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
