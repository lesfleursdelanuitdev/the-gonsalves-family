export type CuratedAlbum = {
  id: string;
  title: string;
  description: string;
  coverSrc: string;
};

export type GeneratedAlbum = {
  id: string;
  title: string;
  photoCount: number;
  thumbSrc: string;
};

export const curatedAlbums: CuratedAlbum[] = [
  {
    id: "early-years",
    title: "The Early Years",
    description: "A collection of photos from the early days of our family's history.",
    coverSrc: "/images/agedbg1.png",
  },
  {
    id: "weddings-celebrations",
    title: "Weddings & Celebrations",
    description: "Celebrating love, milestones, moments, and cherished memories.",
    coverSrc: "/images/vintageTime.png",
  },
  {
    id: "growing-up-gonsalves",
    title: "Growing Up Gonsalves",
    description: "Snapshots of childhood, family life, and growing up together.",
    coverSrc: "/images/vintageTime2.png",
  },
];

export const generatedIndividualAlbums: GeneratedAlbum[] = [
  { id: "manuel-gonsalves", title: "Manuel Gonsalves", photoCount: 42, thumbSrc: "/images/pedigreeSample2.png" },
  { id: "maria-gonsalves", title: "Maria Gonsalves", photoCount: 38, thumbSrc: "/images/oldSchoolCamera.png" },
  { id: "john-gonsalves", title: "John Gonsalves", photoCount: 29, thumbSrc: "/images/agedpaperbg2.png" },
];

export const generatedEventAlbums: GeneratedAlbum[] = [
  { id: "1940-family-reunion", title: "The 1940 Family Reunion", photoCount: 65, thumbSrc: "/images/agedbg1.png" },
  { id: "manuel-maria-wedding", title: "Manuel & Maria's Wedding", photoCount: 28, thumbSrc: "/images/vintageTime.png" },
  { id: "christmas-1952", title: "Christmas 1952", photoCount: 31, thumbSrc: "/images/vintageTime2.png" },
];

export const generatedTagAlbums: GeneratedAlbum[] = [
  { id: "military", title: "Military", photoCount: 47, thumbSrc: "/images/oldMapBackground.png" },
  { id: "school-days", title: "School Days", photoCount: 35, thumbSrc: "/images/oldSchoolCamera.png" },
  { id: "travel", title: "Travel", photoCount: 26, thumbSrc: "/images/agedmap.png" },
];
