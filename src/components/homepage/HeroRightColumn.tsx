"use client";

import { useRef, useState, useEffect } from "react";
import { useInView } from "motion/react";
import { HeroSearchBox } from "./HeroSearchBox";

export function HeroRightColumn() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: false, amount: 0.5 });
  const wasInView = useRef(false);
  const [runId, setRunId] = useState(0);

  useEffect(() => {
    if (isInView && !wasInView.current) {
      wasInView.current = true;
      setRunId((id) => id + 1);
    }
    if (!isInView) {
      wasInView.current = false;
    }
  }, [isInView]);

  return (
    <div
      ref={ref}
      className="-mt-[84px] md:mt-0 flex flex-col items-center md:flex-[1.5] md:justify-center md:text-center md:min-w-0"
    >
      <h1
        className="font-display text-3xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-heading mt-6 sm:mt-8 md:mt-0 mb-1"
      >
        <span className="block font-heading text-2xl sm:text-4xl lg:text-5xl italic font-normal text-heading">
          The
        </span>
        Gonsalves{" "}
        <span className="font-heading text-xl sm:text-3xl lg:text-4xl italic font-normal relative -top-0.5">
          of
        </span>{" "}
        Guyana
      </h1>
      <p className="font-body text-base sm:text-lg lg:text-xl text-muted mt-2 sm:mt-3 mb-6 sm:mb-8 max-w-2xl leading-relaxed">
        A living archive of the Gonsalves family of Guyana
      </p>
      <div className="flex justify-center mb-4 w-full max-w-sm sm:max-w-xl">
        <HeroSearchBox key={runId} triggerTyping={runId > 0} />
      </div>
    </div>
  );
}
