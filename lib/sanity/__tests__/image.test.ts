import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const originalProjectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const originalDataset = process.env.NEXT_PUBLIC_SANITY_DATASET;

type ImageUrlFn = (image: unknown) => string | null;

describe("imageUrl helper", () => {
  let imageUrl: ImageUrlFn;

  beforeEach(async () => {
    process.env.NEXT_PUBLIC_SANITY_PROJECT_ID = "testproject";
    process.env.NEXT_PUBLIC_SANITY_DATASET = "production";
    vi.resetModules();
    const mod = await import("@/lib/sanity/image");
    imageUrl = mod.imageUrl;
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_SANITY_PROJECT_ID = originalProjectId;
    process.env.NEXT_PUBLIC_SANITY_DATASET = originalDataset;
  });

  it("should return null when the image is null or undefined", () => {
    expect(imageUrl(null)).toBeNull();
    expect(imageUrl(undefined)).toBeNull();
  });

  it("should return null when the image has no asset", () => {
    expect(imageUrl({})).toBeNull();
  });

  it("should build a Sanity CDN URL from an asset reference", () => {
    const url = imageUrl({
      _type: "image",
      asset: { _ref: "image-test-1440x600-png" },
    });

    expect(url).toContain("https://");
    expect(url).toContain("testproject");
    expect(url).toContain("production");
    expect(url).toContain("test-1440x600");
  });
});