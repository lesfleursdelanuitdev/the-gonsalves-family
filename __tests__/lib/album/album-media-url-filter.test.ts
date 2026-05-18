import { describe, expect, it } from "vitest";
import {
  ALBUM_MEDIA_FILTER_PARAM,
  appendAlbumMediaFilterQuery,
  parseAlbumMediaFilterFromSearchParams,
  panelMediaFilterToQueryValue,
} from "@/lib/album/album-media-url-filter";

function sp(query: string): URLSearchParams {
  return new URLSearchParams(query);
}

describe("parseAlbumMediaFilterFromSearchParams", () => {
  it("returns all when param is missing", () => {
    expect(parseAlbumMediaFilterFromSearchParams(sp(""))).toBe("all");
  });

  it("maps hub-style values to panel filters", () => {
    expect(parseAlbumMediaFilterFromSearchParams(sp(`${ALBUM_MEDIA_FILTER_PARAM}=photos`))).toBe("image");
    expect(parseAlbumMediaFilterFromSearchParams(sp(`${ALBUM_MEDIA_FILTER_PARAM}=documents`))).toBe("document");
    expect(parseAlbumMediaFilterFromSearchParams(sp(`${ALBUM_MEDIA_FILTER_PARAM}=video`))).toBe("video");
    expect(parseAlbumMediaFilterFromSearchParams(sp(`${ALBUM_MEDIA_FILTER_PARAM}=audio`))).toBe("audio");
  });

  it("accepts legacy collection param on album pages", () => {
    expect(parseAlbumMediaFilterFromSearchParams(sp("collection=video"))).toBe("video");
  });

  it("ignores unknown values", () => {
    expect(parseAlbumMediaFilterFromSearchParams(sp(`${ALBUM_MEDIA_FILTER_PARAM}=unknown`))).toBe("all");
  });
});

describe("panelMediaFilterToQueryValue", () => {
  it("omits mixed/all", () => {
    expect(panelMediaFilterToQueryValue("all")).toBeNull();
  });

  it("uses hub-aligned slugs", () => {
    expect(panelMediaFilterToQueryValue("image")).toBe("photos");
    expect(panelMediaFilterToQueryValue("document")).toBe("documents");
    expect(panelMediaFilterToQueryValue("video")).toBe("video");
  });
});

describe("appendAlbumMediaFilterQuery", () => {
  it("adds media param to generated album path", () => {
    const path =
      "/media/album-view?kind=generated&type=individual&id=abc";
    expect(appendAlbumMediaFilterQuery(path, "video")).toBe(
      "/media/album-view?kind=generated&type=individual&id=abc&media=video",
    );
  });

  it("removes media param for all", () => {
    const path = "/media/album/x?media=video&foo=1";
    expect(appendAlbumMediaFilterQuery(path, "all")).toBe("/media/album/x?foo=1");
  });
});
