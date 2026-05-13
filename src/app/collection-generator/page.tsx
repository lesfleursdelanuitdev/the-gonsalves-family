import { permanentRedirect } from "next/navigation";

/** Former URL; canonical route is `/scrapbook-generator`. */
export default function CollectionGeneratorRedirect() {
  permanentRedirect("/scrapbook-generator");
}
