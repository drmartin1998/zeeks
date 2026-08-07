import { createImageUrlBuilder } from "@sanity/image-url";

import { env } from "./env";
import type { SanityImageHotspot, SanityImageCrop } from "@/sanity.types";

export type SanityImage = {
  asset?: { _ref?: string; url?: string; _type?: string } | null;
  hotspot?: SanityImageHotspot | null;
  crop?: SanityImageCrop | null;
  _type?: string;
};

export function imageUrl(image: SanityImage | null | undefined): string | null {
  if (!image?.asset) return null;

  const builder = createImageUrlBuilder({
    projectId: env.projectId,
    dataset: env.dataset,
  }).image(image);

  return builder.url();
}
