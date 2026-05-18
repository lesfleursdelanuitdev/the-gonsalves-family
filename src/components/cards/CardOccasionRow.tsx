import { cn } from "@/lib/utils";
import { CARD_OCCASION_ICONS, type CardOccasionHighlight } from "./card-occasion";

export function CardOccasionRow({
  occasion,
  compact = false,
}: {
  occasion: CardOccasionHighlight;
  compact?: boolean;
}) {
  const Icon = CARD_OCCASION_ICONS[occasion.eventType];

  return (
    <div
      className={cn(
        "flex min-w-0 items-center border-y border-border-subtle/70",
        compact ? "gap-2 py-2" : "items-start gap-3 py-3",
      )}
      aria-label={`${occasion.title}, ${occasion.calendarDayLabel}`}
    >
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full bg-link-soft-bg text-link",
          compact ? "h-7 w-7" : "mt-0.5 h-9 w-9",
        )}
      >
        <Icon className={cn(compact ? "h-3.5 w-3.5" : "h-4 w-4")} strokeWidth={1.9} aria-hidden />
      </span>
      <div className={cn("min-w-0", compact ? "space-y-0" : "space-y-0.5")}>
        <p
          className={cn(
            "font-heading font-semibold leading-snug text-heading",
            compact ? "text-sm" : "text-base",
          )}
        >
          {occasion.title}
          <span className="font-body font-normal text-muted"> · {occasion.calendarDayLabel}</span>
        </p>
        {occasion.subtitle ? (
          <p className={cn("text-muted", compact ? "text-xs leading-tight" : "text-sm")}>
            {occasion.subtitle}
          </p>
        ) : null}
      </div>
    </div>
  );
}
