"use client";

import { HeroSearchBox as HeroSearchBoxBase } from "../../HeroSearchBox";

type HeroSearchBoxProps = {
  triggerTyping?: boolean;
};

export function HeroSearchBox({ triggerTyping = false }: HeroSearchBoxProps) {
  return <HeroSearchBoxBase triggerTyping={triggerTyping} />;
}
