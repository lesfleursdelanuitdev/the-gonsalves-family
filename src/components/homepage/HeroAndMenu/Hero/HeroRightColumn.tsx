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
      className="w-full sm:w-fit sm:max-w-[36rem] flex flex-col items-center text-center md:ml-6"
    >
      <HeroWebsiteTitle />
      <HeroTagline />
      <div className="flex justify-center mt-4 mb-12 md:mb-4 w-full max-w-[18rem] sm:w-[36rem] sm:max-w-none">
        <HeroSearchBox key={runId} triggerTyping={runId > 0} />
      </div>
    </div>
  );
}
