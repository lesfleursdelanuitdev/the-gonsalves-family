"use client";

import { useState, useEffect, useRef } from "react";

const SEGMENTS = [
  { text: "From ", className: "" },
  { text: "Madeira", className: "text-accent-muted font-semibold" },
  { text: " to ", className: "" },
  { text: "Guyana", className: "text-accent-muted font-semibold" },
  { text: " — ", className: "" },
  { text: "A Family Across Oceans", className: "font-medium" },
] as const;

const CHAR_DELAY_MS = 50;
const CURSOR_BLINK_MS = 530;

type TypewriterTaglineProps = {
  onComplete?: () => void;
};

export function TypewriterTagline({ onComplete }: TypewriterTaglineProps) {
  const [visibleChars, setVisibleChars] = useState(0);
  const [showCursor, setShowCursor] = useState(true);
  const totalChars = SEGMENTS.reduce((sum, s) => sum + s.text.length, 0);
  const hasCalledComplete = useRef(false);

  // Typewriter effect
  useEffect(() => {
    if (visibleChars >= totalChars) {
      if (onComplete && !hasCalledComplete.current) {
        hasCalledComplete.current = true;
        onComplete();
      }
      return;
    }
    const timer = setTimeout(
      () => setVisibleChars((c) => c + 1),
      CHAR_DELAY_MS
    );
    return () => clearTimeout(timer);
  }, [visibleChars, totalChars, onComplete]);

  // Blinking cursor
  useEffect(() => {
    const timer = setInterval(
      () => setShowCursor((s) => !s),
      CURSOR_BLINK_MS
    );
    return () => clearInterval(timer);
  }, []);

  let charIndex = 0;
  const elements: React.ReactNode[] = [];

  for (const { text, className } of SEGMENTS) {
    const segmentEnd = charIndex + text.length;
    const visibleInSegment = Math.min(
      Math.max(0, visibleChars - charIndex),
      text.length
    );
    const visibleText = text.slice(0, visibleInSegment);

    if (visibleText) {
      elements.push(
        className ? (
          <span key={charIndex} className={className}>
            {visibleText}
          </span>
        ) : (
          <span key={charIndex}>{visibleText}</span>
        )
      );
    }
    charIndex = segmentEnd;
  }

  const isTyping = visibleChars < totalChars;

  return (
    <span className="inline">
      {elements}
      {isTyping && (
        <span
          className={`inline-block ml-0.5 transition-opacity duration-75 ${
            showCursor ? "opacity-100" : "opacity-0"
          }`}
          aria-hidden
        >
          |
        </span>
      )}
    </span>
  );
}
