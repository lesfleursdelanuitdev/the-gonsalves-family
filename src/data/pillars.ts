export interface Pillar {
  title: string;
  subtitle: string;
  content: string;
  linkLabel: string;
  href: string;
  image: string;
  imageAlt: string;
  numeral: string;
  imageFilter?: string;
  imageFilterHover?: string;
  imageOverlay?: string;
  caption?: string;
  imageTexture?: boolean;
}

export const PILLARS: Pillar[] = [
  {
    subtitle: "people",
    title: "Find Family",
    content:
      "Discover ancestors, relatives, and the branches that shape our family.",
    linkLabel: "Find",
    href: "/people",
    image: "/images/pedigreeSample2.png",
    imageAlt: "Gonsalves family pedigree chart",
    numeral: "01",
    imageFilter: "brightness(0.94)",
    imageOverlay: "rgba(52,28,10,0.20)",
    imageTexture: true,
  },
  {
    subtitle: "stories",
    title: "Read Histories",
    content:
      "Step into the lives, journeys, and experiences of those who came before us.",
    linkLabel: "Read",
    href: "/stories",
    image: "/images/histories/journey/family/Sydney1917.jpg",
    imageAlt: "The Gonsalves family gathering, 1917",
    numeral: "02",
    imageFilter: "sepia(0.85) brightness(0.88) contrast(1.15)",
    imageFilterHover: "sepia(0.65) brightness(1.0) contrast(1.1)",
    imageOverlay: "rgba(52,28,10,0.20)",
    caption: "Pictured is Augustinho Gonsalves, his wife Lucy, and their son Sidney. Augustinho lived to be over 104 years old.",
  },
  {
    subtitle: "archives",
    title: "View Media",
    content:
      "View the photos, videos, and recordings that hold our family's memories.",
    linkLabel: "View",
    href: "/archive",
    image: "/images/albumsCoverImageMobile.png",
    imageAlt: "Gonsalves family photo albums",
    numeral: "03",
  },
];
