"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { JOURNEY_STEPS } from "@/data/journeySteps";
import { cn } from "@/lib/utils";
import { formatContentWithLinks } from "../journeyUtils";

const JOURNEY_EVENT_ALTS = [
  "A ship arriving at the island of Madeira",
  "Sugar cane and an anchor at the estate",
  "A couple at Enmore Estate",
  "A globe representing the worldwide diaspora",
] as const;

function journeyYearLabel(date: string): string {
  return date.replace(/^c\.\s*/i, "");
}

export function JourneyModernMobile() {
  const [step, setStep] = useState(0);
  const current = JOURNEY_STEPS[step];
  const fillPercent =
    JOURNEY_STEPS.length > 1 ? (step / (JOURNEY_STEPS.length - 1)) * 100 : 0;

  return (
    <div className="journey-modern md:hidden" aria-label="The Journey timeline">
      <div className="journey-modern__content">
        <p className="journey-modern__stage">
          Stage {String(step + 1).padStart(2, "0")} /{" "}
          {String(JOURNEY_STEPS.length).padStart(2, "0")}
        </p>

        <div className="journey-modern__media">
          {JOURNEY_STEPS.map((_, index) => (
            <Image
              key={`journey-modern-img-${index}`}
              src={`/images/mainpage-timeline-events/event${index + 1}.png`}
              alt={JOURNEY_EVENT_ALTS[index] ?? ""}
              fill
              sizes="(max-width: 768px) 92vw, 420px"
              priority={index === 0}
              className={cn("journey-modern__media-img", index === step && "is-active")}
            />
          ))}
        </div>

        <div className="journey-modern__text">
          <h2 className="journey-modern__year">{journeyYearLabel(current.date)}</h2>
          <p className="journey-modern__place">{current.location}</p>
          <p className="journey-modern__body">{formatContentWithLinks(current.content)}</p>
        </div>
      </div>

      <div className="journey-modern__rail">
        <div className="journey-modern__line" aria-hidden />
        <div
          className="journey-modern__fill"
          style={{ width: `${fillPercent}%` }}
          aria-hidden
        />
        <div className="journey-modern__dots">
          {JOURNEY_STEPS.map((item, index) => (
            <button
              key={`journey-modern-marker-${item.date}`}
              type="button"
              className={cn(
                "journey-modern__marker",
                index === step && "active",
                index <= step && "done",
              )}
              onClick={() => setStep(index)}
              aria-label={`${journeyYearLabel(item.date)} — ${item.location}`}
              aria-current={index === step ? "step" : undefined}
            >
              <span className="dotwrap">
                <span className="dot" />
              </span>
              <span className="yr">{journeyYearLabel(item.date)}</span>
            </button>
          ))}
        </div>
      </div>

      <Link href="/timelines" className="journey-modern__cta mx-auto w-fit">
        Explore the full timeline
        <ArrowRight className="h-[15px] w-[15px]" strokeWidth={2.2} aria-hidden />
      </Link>
    </div>
  );
}
