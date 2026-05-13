import { permanentRedirect } from "next/navigation";

/** Old URL; canonical route is `/scrapbook-generator`. */
export default function AlbumGeneratorRedirect() {
  permanentRedirect("/scrapbook-generator");
}
