import Link from "next/link";
import { PageContainer, Section } from "@/components/wireframe";
import { JOURNEY_STEPS } from "@/data/journeySteps";

export function JourneyStrip() {
  return (
    <Section>
      <PageContainer>
        <h2 className="mb-4 text-right font-body text-lg font-semibold uppercase tracking-tight text-primary">
          The Journey
        </h2>
        <div className="flex flex-nowrap items-stretch justify-center gap-x-3 overflow-x-auto font-heading leading-relaxed text-text">
          {JOURNEY_STEPS.map((step, index) => (
            <div key={`${step.date}-${step.location}`} className="flex flex-shrink-0 items-center gap-x-3">
              <div className="flex max-w-[200px] flex-col rounded-lg bg-surface-inset px-4 py-3 text-sm">
                {step.date && (
                  <span className="text-xs text-crimson">{step.date}</span>
                )}
                <span className="text-sm font-medium">{step.location}</span>
                {step.content && (
                  <span className="text-xs text-muted">{step.content}</span>
                )}
              </div>
              {index < JOURNEY_STEPS.length - 1 && (
                <span className="text-muted" aria-hidden>
                  →
                </span>
              )}
            </div>
          ))}
        </div>
        <p className="mt-4 text-right">
          <Link
            href="/timelines"
            className="font-body text-sm text-link hover:text-link-hover underline"
          >
            See more timelines…
          </Link>
        </p>
      </PageContainer>
    </Section>
  );
}
