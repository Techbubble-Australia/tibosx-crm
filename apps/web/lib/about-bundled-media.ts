import type { StaticImageData } from "next/image";
import { resolveOptionalMediaUrl } from "@/lib/media-url";
import aboutUs1 from "@image/techbubble_-_about_us_1.jpg";
import aboutUs2 from "@image/techbubble_-_about_us_2.jpg";
import aboutUs3 from "@image/techbubble_-_about_us_3.jpg";
import aboutUs4 from "@image/techbubble_-_about_us_4.png";
import aboutUs5 from "@image/techbubble_-_about_us_5.jpg";
import aboutUs6 from "@image/techbubble_-_about_us_6.png";
import aboutUs7 from "@image/techbubble_-_about_us_7.png";
import aboutUs8 from "@image/techbubble_-_about_us_8.png";
import aboutUs9 from "@image/techbubble_-_about_us_9.jpg";
import aboutUs10 from "@image/techbubble_-_about_us_10.png";
import aboutUs11 from "@image/techbubble_-_about_us_11.png";

const ABOUT_IMAGE_MAP: Record<string, StaticImageData> = {
  about_us_1: aboutUs1,
  about_us_2: aboutUs2,
  about_us_3: aboutUs3,
  about_us_4: aboutUs4,
  about_us_5: aboutUs5,
  about_us_6: aboutUs6,
  about_us_7: aboutUs7,
  about_us_8: aboutUs8,
  about_us_9: aboutUs9,
  about_us_10: aboutUs10,
  about_us_11: aboutUs11,
};

/** Keys stored in SiteContent JSON when not using a remote `imageUrl`. */
export const ABOUT_BUNDLED_IMAGE_KEYS = Object.keys(ABOUT_IMAGE_MAP);

/**
 * Prefer `imageUrl` (uploaded or absolute URL). Otherwise resolve `imageKey` against bundled assets.
 * Upload paths (`/uploads/...`) stay same-origin; Next proxies them to the API.
 */
export function resolveAboutBundledImage(
  imageUrl?: string | null,
  imageKey?: string | null,
): StaticImageData | string | null {
  const url = imageUrl?.trim();
  if (url) {
    const resolved = resolveOptionalMediaUrl(url);
    if (resolved) {
      return resolved;
    }
  }
  const key = imageKey?.trim();
  if (key && ABOUT_IMAGE_MAP[key]) {
    return ABOUT_IMAGE_MAP[key];
  }
  return null;
}
