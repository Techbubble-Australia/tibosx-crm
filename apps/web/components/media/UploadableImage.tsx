"use client";

/* eslint-disable @next/next/no-img-element -- this module intentionally uses <img> for `/uploads/*` to bypass the optimizer */
import Image from "next/image";
import { resolveMediaUrl, resolveUploadsImgSrc, sameOriginUploadsPath } from "@/lib/media-url";

type FillProps = {
  src: string;
  alt: string;
  fill: true;
  className?: string;
  sizes?: string;
  priority?: boolean;
  /** Fires when the image fails to load (e.g. missing upload). */
  onError?: () => void;
};

/**
 * Renders `/uploads/*` with {@link HTMLImageElement} using {@link resolveUploadsImgSrc} so Next's image optimizer is not invoked
 * (avoids "received null" when the API file is missing or during dev chunk issues).
 */
export function UploadableImage({ src, alt, fill, className, sizes, priority, onError }: FillProps) {
  const uploads = sameOriginUploadsPath(src);
  if (uploads) {
    return (
      <img
        src={resolveUploadsImgSrc(uploads)}
        alt={alt}
        className={["absolute inset-0 h-full w-full", className].filter(Boolean).join(" ")}
        sizes={sizes}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        onError={() => onError?.()}
      />
    );
  }
  const resolved = resolveMediaUrl(src);
  return (
    <Image
      src={resolved}
      alt={alt}
      fill
      className={className}
      sizes={sizes}
      priority={priority}
      onError={() => onError?.()}
    />
  );
}
