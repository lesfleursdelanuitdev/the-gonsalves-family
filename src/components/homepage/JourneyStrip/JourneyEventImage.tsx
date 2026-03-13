import Image from "next/image";
import { IMAGE_SIZES } from "./journeyUtils";

type JourneyEventImageProps = {
  index: number;
  isFirst: boolean;
  isLast: boolean;
};

export function JourneyEventImage({ index, isFirst, isLast }: JourneyEventImageProps) {
  const sizes = isFirst ? IMAGE_SIZES.first : isLast ? IMAGE_SIZES.last : IMAGE_SIZES.default;

  return (
    <div className="relative z-0 -mt-[10px] mb-3 flex justify-center">
      <Image
        src={`/images/mainpage-timeline-events/event${index + 1}.png`}
        alt=""
        width={sizes.width}
        height={sizes.height}
        className={`w-auto max-w-full object-cover opacity-75 ${sizes.className}`}
        style={{ borderRadius: "6px" }}
      />
    </div>
  );
}
