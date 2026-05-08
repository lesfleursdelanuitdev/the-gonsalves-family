"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "motion/react";
import { HeroSearchBox } from "./HeroSearchBox";
import { HeroTagline } from "./HeroTagline";
import { HeroWebsiteTitle } from "./HeroWebsiteTitle";

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
      className="flex w-full flex-col items-center text-center sm:w-fit sm:max-w-[40rem] md:ml-6"
    >
      <HeroWebsiteTitle />
      <HeroTagline />
      <div className="mt-4 mb-10 flex w-full max-w-[min(100%,22.5rem)] justify-center sm:mb-12 sm:max-w-[min(100%,36rem)] md:mb-4">
        <HeroSearchBox key={runId} triggerTyping={runId > 0} />
      </div>
    </div>
  );
}
