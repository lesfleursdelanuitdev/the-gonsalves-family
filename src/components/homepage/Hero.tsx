import Image from "next/image";
import {
  PageContainer,
  Section,
  Crest,
} from "@/components/wireframe";
import { HeroRightColumn } from "./HeroRightColumn";

export function Hero() {
  return (
    <Section className="-mt-12 dark:-mt-20 relative overflow-hidden min-h-[420px] flex flex-col justify-center pt-16 sm:pt-28 md:pt-32 lg:pt-40 pb-24 md:pb-32 shadow-[inset_0_-4px_24px_rgba(60,45,25,0.04)] dark:shadow-[inset_0_-4px_24px_rgba(0,0,0,0.04)]">
      <div className="absolute inset-0 z-0">
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
        <div className="absolute inset-0 bg-bg/70 dark:bg-bg/90" aria-hidden />
      </div>
      <div
        className="absolute inset-0 pointer-events-none z-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(circle at 50% 100%, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0.08) 45%, transparent 70%), linear-gradient(to top, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.2) 40%, transparent 70%), radial-gradient(ellipse 100% 90% at 50% 50%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.15) 50%, transparent 75%)",
        }}
      />
      <div className="relative z-10">
        <PageContainer narrow>
          <div className="flex flex-col md:flex-row md:items-center md:justify-center gap-6 md:gap-10 lg:gap-12 text-center">
              <div className="relative z-20 overflow-visible shrink-0 self-center md:self-auto md:flex-[0.7] md:flex md:items-center md:justify-center">
                <div className="md:scale-125 lg:scale-[1.4]">
                  <Crest size="3xl" alt="Gonsalves family crest" priority />
                </div>
              </div>
              <HeroRightColumn />
            </div>
        </PageContainer>
      </div>
    </Section>
  );
}
