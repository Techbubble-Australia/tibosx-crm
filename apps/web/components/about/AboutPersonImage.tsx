import Image from "next/image";
import { UploadableImage } from "@/components/media/UploadableImage";
import { resolveAboutBundledImage } from "@/lib/about-bundled-media";

type Props = {
  imageUrl?: string | null;
  imageKey?: string | null;
  alt: string;
  width: number;
  height: number;
  className?: string;
};

export function AboutPersonImage({ imageUrl, imageKey, alt, width, height, className }: Props) {
  const src = resolveAboutBundledImage(imageUrl, imageKey);
  if (!src) {
    return (
      <div
        className={`bg-neutral-600 ${className ?? ""}`}
        style={{ width, height }}
        role="img"
        aria-label={alt}
      />
    );
  }
  // String URLs (uploads API, absolute URLs, /images/*) must use <img>: Next/Image remotePatterns
  // do not reliably allow arbitrary API hosts; bundled assets stay on next/image.
  if (typeof src === "string") {
    return (
      <div className="relative overflow-hidden" style={{ width, height }}>
        <UploadableImage src={src} alt={alt} fill className={className} sizes={`${width}px`} />
      </div>
    );
  }
  return <Image src={src} alt={alt} width={width} height={height} className={className} />;
}
