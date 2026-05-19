"use client";

/* eslint-disable @next/next/no-img-element -- this module intentionally uses <img> for `/uploads/*` to bypass the optimizer */
import Image from "next/image";
import { isUploadsProxyPath } from "@/lib/media-url";

type FillProps = {
  src: string;
  alt: string;
  fill: true;
  className?: string;
  sizes?: string;
  priority?: boolean;
};

/**
 * Renders proxied `/uploads/*` with {@link HTMLImageElement} so Next's image optimizer is not invoked
 * (avoids "received null" when the API file is missing or during dev chunk issues).
 */
export function UploadableImage({ src, alt, fill, className, sizes, priority }: FillProps) {
  if (isUploadsProxyPath(src)) {
    return (
      <img
        src={src}
        alt={alt}
        className={["absolute inset-0 h-full w-full", className].filter(Boolean).join(" ")}
        sizes={sizes}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
      />
    );
  }
  return <Image src={src} alt={alt} fill className={className} sizes={sizes} priority={priority} />;
}
