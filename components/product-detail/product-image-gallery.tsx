"use client";

import { useState } from "react";

interface ProductImageGalleryProps {
  images: string[];
  title: string;
  gradient: string;
}

export function ProductImageGallery({
  images,
  title,
  gradient,
}: ProductImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Single image or no images
  if (images.length <= 1) {
    return (
      <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
        {images.length === 1 ? (
          <img
            src={images[0]}
            alt={title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${gradient}`}
          >
            <span className="text-5xl font-bold text-white/30">
              {title[0]}
            </span>
          </div>
        )}
      </div>
    );
  }

  // Multiple images — show gallery with thumbnails
  return (
    <div className="flex flex-col gap-3">
      {/* Main image */}
      <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
        <img
          src={images[selectedIndex]}
          alt={`${title} - image ${selectedIndex + 1}`}
          className="h-full w-full object-cover"
        />
      </div>

      {/* Thumbnails */}
      <div className="flex gap-2 overflow-x-auto">
        {images.map((img, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setSelectedIndex(i)}
            className={`h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border-2 transition-colors ${
              i === selectedIndex
                ? "border-zeeks-purple"
                : "border-transparent hover:border-gray-300"
            }`}
          >
            <img
              src={img}
              alt={`${title} thumbnail ${i + 1}`}
              className="h-full w-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
