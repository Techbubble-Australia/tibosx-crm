import Image from "next/image";
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
  return <Image src={src} alt={alt} width={width} height={height} className={className} />;
}
