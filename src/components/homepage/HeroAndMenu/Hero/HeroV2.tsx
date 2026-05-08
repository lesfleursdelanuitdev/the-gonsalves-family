"use client";

import { Crest } from "@/components/wireframe";
import { HeroRightColumn } from "./HeroRightColumn";

export function HeroV2() {
  return (
    <section className="relative w-full min-w-0 max-w-full min-h-[420px] overflow-hidden flex items-center justify-center pt-2 pb-8 md:py-24">
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 pointer-events-none opacity-40 md:opacity-50"
          aria-hidden
          style={{
            background:
              "radial-gradient(circle at 50% 100%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.04) 45%, transparent 70%), linear-gradient(to top, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.06) 40%, transparent 70%), radial-gradient(ellipse 100% 90% at 50% 50%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.15) 50%, transparent 75%)",
          }}
        />
      </div>
      <div className="relative z-10 mx-auto flex w-full min-w-0 max-w-[min(100%,36rem)] flex-col gap-0 px-3 sm:max-w-[min(100%,40rem)] md:max-w-[min(100%,56rem)] md:flex-row md:items-center md:justify-center md:gap-6 md:px-6 lg:max-w-[min(100%,64rem)]">
        <div className="flex-1 md:flex-[0.9] min-h-[160px] flex items-end md:items-center justify-center md:justify-end pt-4 md:pt-0">
          <div className="relative flex items-center justify-center leading-[0]">
            <div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-1/2 h-[72%] w-[135%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,250,235,0.9)_0%,rgba(255,250,235,0.55)_38%,rgba(255,250,235,0)_74%)] blur-md"
            />
            <div className="crest relative z-10">
              <Crest size="3xl" alt="Gonsalves family crest" priority />
            </div>
          </div>
        </div>
        <div className="flex-1 md:flex-[1.1] min-h-[160px] flex items-start md:items-center justify-center md:justify-start">
          <HeroRightColumn />
        </div>
      </div>
    </section>
  );
}
