"use client";

import Image from "next/image";
import { HeroV2 } from "./Hero/HeroV2";

export function HeroAndMenu() {
  return (
    <div className="relative min-h-[420px] w-full min-w-0 max-w-full overflow-x-clip pt-20 md:pt-28">
      <div className="absolute inset-0 left-0 right-0 top-0 bottom-0 z-0 h-full w-full max-w-full overflow-hidden">
        <Image
          src="/images/heroimagemobile2.png"
          alt=""
          fill
          className="object-cover object-center md:hidden"
          priority
          sizes="100vw"
          aria-hidden
        />
        <Image
          src="/images/heroimage2.png"
          alt=""
          fill
          className="object-cover object-center hidden md:block"
          priority
          sizes="100vw"
          aria-hidden
        />
        <div className="absolute inset-0 bg-bg/42 dark:bg-bg/42 backdrop-blur-md md:backdrop-blur-sm" aria-hidden />
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden
          style={{
            background: "linear-gradient(to top, rgba(0,0,0,0.2) 0%, transparent 50%)",
          }}
        />
        <div className="pointer-events-none absolute inset-0 opacity-[0.10]" aria-hidden>
          <Image
            src="/images/agedpaperbg.png"
            alt=""
            fill
            className="object-cover object-center"
            aria-hidden
          />
        </div>
        <div
          className="pointer-events-none absolute inset-0 md:hidden"
          aria-hidden
          style={{
            background:
              "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.06) 40%, transparent 70%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 hidden md:block"
          aria-hidden
          style={{
            background:
              "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.06) 55%, transparent 85%)",
          }}
        />
      </div>
      <HeroV2 />
    </div>
  );
}
