export type CuratedAlbum = {
  id: string;
  title: string;
  description: string;
  coverSrc: string;
};

/** Preview row for a virtual (generated) media set; `href` targets `/media/album-view`. */
export type GeneratedAlbum = {
  id: string;
  title: string;
  photoCount: number;
  thumbSrc: string;
  href: string;
};

export type PublicAlbumsPageData = {
  curatedAlbums: CuratedAlbum[];
  generatedIndividualAlbums: GeneratedAlbum[];
  generatedFamilyAlbums: GeneratedAlbum[];
  generatedEventAlbums: GeneratedAlbum[];
  generatedPlaceAlbums: GeneratedAlbum[];
  generatedDateAlbums: GeneratedAlbum[];
  generatedTagAlbums: GeneratedAlbum[];
};
