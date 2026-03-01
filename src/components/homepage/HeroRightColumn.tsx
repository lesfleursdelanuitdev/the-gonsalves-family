"use client";

import { useState, useCallback } from "react";
import { TypewriterTagline } from "./TypewriterTagline";
import { HeroSearchBox } from "./HeroSearchBox";

export function HeroRightColumn() {
  const [triggerSearchTyping, setTriggerSearchTyping] = useState(false);

  const handleTaglineComplete = useCallback(() => {
    setTriggerSearchTyping(true);
  }, []);

  return (
    <div className="-mt-[84px] md:mt-0 flex flex-col items-center md:flex-1 md:justify-center md:text-center">
      <h1
        className="font-display text-2xl sm:text-4xl font-semibold tracking-tight text-heading mt-6 sm:mt-8 md:mt-0 mb-1"
      >
        <span className="block font-heading text-xl sm:text-3xl italic font-normal text-heading">
          The
        </span>
        Gonsalves{" "}
        <span className="font-heading text-lg sm:text-2xl italic font-normal relative -top-0.5">
          of
        </span>{" "}
        Guyana
      </h1>
      <p className="font-body text-xs sm:text-sm text-muted mt-2 sm:mt-3 mb-6 sm:mb-8 max-w-2xl leading-relaxed uppercase tracking-wide">
        <TypewriterTagline onComplete={handleTaglineComplete} />
      </p>
      <div className="flex justify-center mb-4 w-full max-w-sm sm:max-w-xl">
        <HeroSearchBox triggerTyping={triggerSearchTyping} />
      </div>
    </div>
  );
}
