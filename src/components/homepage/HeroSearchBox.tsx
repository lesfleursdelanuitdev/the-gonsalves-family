"use client";

import { useRef, useState, useEffect } from "react";
import { motion } from "motion/react";

const TYPING_PHRASES = [
  "Gonsalves",
  "Guyana",
  "childhood stories",
  "Guyanese pepperpot recipe",
  "Augustino Gracis",
];
const TYPING_CHAR_DELAY_MS = 80;
const PAUSE_BETWEEN_PHRASES_MS = 1200;
const CLEAR_DELAY_MS = 400;
const CURSOR_BLINK_MS = 530;

type HeroSearchBoxProps = {
  triggerTyping?: boolean;
};

export function HeroSearchBox({ triggerTyping = false }: HeroSearchBoxProps) {
  const [focused, setFocused] = useState(false);
  const [typedValue, setTypedValue] = useState("");
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [phase, setPhase] = useState<"idle" | "typing" | "pause" | "clearing">("idle");
  const [hasCompletedTyping, setHasCompletedTyping] = useState(false);
  const [userHasTyped, setUserHasTyped] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const programmaticFocusRef = useRef(false);

  useEffect(() => {
    if (triggerTyping && inputRef.current) {
      programmaticFocusRef.current = true;
      inputRef.current.focus();
      setFocused(true);
    }
  }, [triggerTyping]);

  useEffect(() => {
    if (hasCompletedTyping && inputRef.current) {
      inputRef.current.blur();
      setFocused(false);
    }
  }, [hasCompletedTyping]);

  useEffect(() => {
    const timer = setInterval(() => setCursorVisible((v) => !v), CURSOR_BLINK_MS);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!triggerTyping || userHasTyped || hasCompletedTyping) return;

    if (phase === "idle") {
      setPhase("typing");
      return;
    }

    if (phase === "typing") {
      const phrase = TYPING_PHRASES[phraseIndex];
      if (typedValue.length >= phrase.length) {
        if (phraseIndex >= TYPING_PHRASES.length - 1) {
          setHasCompletedTyping(true);
          setPhase("idle");
          return;
        }
        setPhase("pause");
        return;
      }
      const timer = setTimeout(
        () => setTypedValue(phrase.slice(0, typedValue.length + 1)),
        TYPING_CHAR_DELAY_MS
      );
      return () => clearTimeout(timer);
    }

    if (phase === "pause") {
      const timer = setTimeout(() => setPhase("clearing"), PAUSE_BETWEEN_PHRASES_MS);
      return () => clearTimeout(timer);
    }

    if (phase === "clearing") {
      const timer = setTimeout(() => {
        setTypedValue("");
        setPhraseIndex((i) => i + 1);
        setPhase("typing");
      }, CLEAR_DELAY_MS);
      return () => clearTimeout(timer);
    }
  }, [triggerTyping, typedValue, phraseIndex, phase, userHasTyped, hasCompletedTyping]);

  const handleBlur = () => {
    setTimeout(() => {
      if (formRef.current && !formRef.current.contains(document.activeElement)) {
        setFocused(false);
      }
    }, 0);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserHasTyped(true);
    setTypedValue(e.target.value);
  };

  const showPlaceholder = !typedValue && !triggerTyping;
  const showCursor =
    triggerTyping && !userHasTyped && !hasCompletedTyping;

  return (
    <motion.div
      className="flex w-full max-w-sm sm:max-w-xl rounded-lg sm:rounded-xl border border-white bg-surface/20 dark:bg-surface/15 backdrop-blur-sm overflow-hidden origin-center shadow-xl shadow-black/15 dark:shadow-2xl dark:shadow-black/25 focus-within:shadow-2xl focus-within:shadow-black/25 dark:focus-within:shadow-black/35 transition-shadow"
      animate={{ scale: focused ? 1.06 : 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <form
        ref={formRef}
        action="/tree/viewer/searchDatabase"
        method="GET"
        className="flex w-full"
        onFocus={() => setFocused(true)}
        onBlur={handleBlur}
      >
        <div className="relative flex-1 min-w-0 flex items-center">
          <input
            ref={inputRef}
            type="text"
            name="q"
            value={typedValue}
            onChange={handleInputChange}
            placeholder={showPlaceholder ? "Search people, places, stories" : ""}
            className={`flex-1 min-w-0 bg-transparent px-3 py-4 sm:px-5 sm:py-4 text-sm sm:text-base placeholder:text-muted focus:outline-none ${
              showCursor ? "text-transparent caret-transparent" : "text-text"
            }`}
            onFocus={() => {
              if (programmaticFocusRef.current) {
                programmaticFocusRef.current = false;
              } else if (showCursor) {
                setUserHasTyped(true);
              }
            }}
          />
          {showCursor && (
            <div
              className="absolute left-0 top-0 bottom-0 flex items-center px-3 sm:px-5 pointer-events-none"
              aria-hidden
            >
              <span className="text-sm sm:text-base text-text whitespace-pre">
                {typedValue}
                <span
                  className={`inline-block transition-opacity duration-75 ${
                    cursorVisible ? "opacity-100" : "opacity-0"
                  }`}
                >
                  |
                </span>
              </span>
            </div>
          )}
        </div>
        <button
          type="submit"
          className="shrink-0 border-l border-accent/60 bg-primary/90 hover:bg-primary px-3 py-4 sm:px-5 sm:py-4 text-sm sm:text-base font-semibold text-primary-foreground focus:outline-none focus:ring-2 focus:ring-focus-ring"
        >
          Search
        </button>
      </form>
    </motion.div>
  );
}
