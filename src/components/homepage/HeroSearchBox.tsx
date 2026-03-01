"use client";

import { useRef, useState } from "react";
import { motion } from "motion/react";

export function HeroSearchBox() {
  const [focused, setFocused] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleBlur = () => {
    setTimeout(() => {
      if (formRef.current && !formRef.current.contains(document.activeElement)) {
        setFocused(false);
      }
    }, 0);
  };

  return (
    <motion.div
      className="flex w-full max-w-sm sm:max-w-xl rounded-lg sm:rounded-xl border border-accent/60 bg-surface/20 dark:bg-surface/15 backdrop-blur-sm overflow-hidden focus-within:ring-2 focus-within:ring-focus-ring focus-within:ring-offset-0 origin-center"
      animate={{ scale: focused ? 1.06 : 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <form
        ref={formRef}
        action="/search"
        method="GET"
        className="flex w-full"
        onFocus={() => setFocused(true)}
        onBlur={handleBlur}
      >
        <input
          type="text"
          name="q"
          placeholder="Search people, places, stories"
          className="flex-1 min-w-0 bg-transparent px-3 py-2.5 sm:px-5 sm:py-3.5 text-sm sm:text-base text-text placeholder:text-muted focus:outline-none"
        />
        <button
          type="submit"
          className="shrink-0 border-l border-accent/60 bg-primary/90 hover:bg-primary px-3 py-2.5 sm:px-5 sm:py-3.5 text-sm sm:text-base font-semibold text-primary-foreground focus:outline-none focus:ring-2 focus:ring-focus-ring"
        >
          Search
        </button>
      </form>
    </motion.div>
  );
}
