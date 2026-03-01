import Image from "next/image";
import {
  PageContainer,
  Section,
  Crest,
} from "@/components/wireframe";
import { HeroSearchBox } from "./HeroSearchBox";

export function Hero() {
  return (
    <Section className="-mt-12 dark:-mt-20 relative overflow-hidden min-h-[420px] flex flex-col justify-center">
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/heroimagemobile.png"
          alt=""
          fill
          className="object-cover object-center md:hidden"
          priority
          sizes="100vw"
          aria-hidden
        />
        <Image
          src="/images/heroimage.png"
          alt=""
          fill
          className="object-cover object-center hidden md:block"
          priority
          sizes="100vw"
          aria-hidden
        />
        <div className="absolute inset-0 bg-bg/80 dark:bg-bg/90" aria-hidden />
      </div>
      <div className="relative z-10">
      <PageContainer>
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="relative z-20 overflow-visible">
            <Crest size="3xl" alt="Gonsalves family crest" priority />
          </div>
          <div className="-mt-[84px]">
          <h1 className="font-display text-2xl sm:text-4xl font-semibold tracking-tight text-heading mb-4">
            <span className="block font-heading text-xl sm:text-3xl italic font-normal text-heading">The</span>
            Gonsalves <span className="font-heading text-lg sm:text-2xl italic font-normal relative -top-0.5">of</span> Guyana
          </h1>
          <p className="font-heading text-sm sm:text-xl text-muted mb-4 max-w-2xl leading-relaxed">
            From <span className="text-accent-muted font-semibold">Madeira</span> to <span className="text-accent-muted font-semibold">Guyana</span> — <span className="font-medium">A Family Across Oceans</span>
          </p>
          <div className="flex justify-center mb-4">
            <HeroSearchBox />
          </div>
          </div>
        </div>
      </PageContainer>
      </div>
    </Section>
  );
}
