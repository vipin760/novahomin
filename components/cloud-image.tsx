import { cloudUrl } from "@/lib/image";

/** Responsive Cloudinary image: auto format/quality, three widths, lazy by default, fixed ratio (no layout shift). */
export function CloudImage({
  src,
  alt,
  ratio = "3 / 2",
  sizes = "(max-width: 767px) 100vw, (max-width: 1199px) 50vw, 33vw",
  priority,
  className,
}: {
  src: string;
  alt: string;
  ratio?: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  const w = [480, 800, 1280];
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={className}
      src={cloudUrl(src, "c_limit,w_800,f_auto,q_auto")}
      srcSet={w.map((width) => `${cloudUrl(src, `c_limit,w_${width},f_auto,q_auto`)} ${width}w`).join(", ")}
      sizes={sizes}
      alt={alt}
      style={{ aspectRatio: ratio, width: "100%", height: "auto", objectFit: "cover", display: "block" }}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
    />
  );
}
