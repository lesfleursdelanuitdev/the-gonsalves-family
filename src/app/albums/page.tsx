import { permanentRedirect } from "next/navigation";

/** Legacy URL: public hub lives at `/media`. */
export default function LegacyAlbumsIndexRedirect() {
  permanentRedirect("/media");
}
