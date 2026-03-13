"use client";

import { useState, useEffect } from "react";

const HERITAGE_WORDS = [
  "East Indian",
  "African",
  "Chinese",
  "Mexican",
  "Filipino",
  "Italian",
  "Scottish",
];

const ROTATE_INTERVAL_MS = 3500;

export function HeritageTextRotate() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % HERITAGE_WORDS.length);
    }, ROTATE_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="heritage-rotate-bg text-primary inline-block translate-y-[8px] p-2.5 align-baseline font-semibold">
      <span
        className="heritage-rotate-inner block overflow-hidden"
        style={{ height: "1.5em" }}
      >
        <span
          className="flex flex-col transition-transform duration-500 ease-out"
          style={{ transform: `translateY(-${index * 1.5}em)` }}
        >
          {HERITAGE_WORDS.map((word) => (
            <span
              key={word}
              className="flex h-[1.5em] min-h-[1.5em] items-center"
            >
              {word}
            </span>
          ))}
        </span>
      </span>
    </span>
  );
}
