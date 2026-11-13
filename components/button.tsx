import Link from "next/link";

export type ButtonVariant = "primary" | "glass" | "deep" | "dark" | "soft";

/**
 * The reference's button: a fill layer that shrinks on hover (scale 0.9 × 0.8) and an
 * outline layer that grows in (scale 0.85 × 0.65 → 1, fade in), both 0.3 s expo.out.
 */
export function ButtonLayers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <span className="button-bg" aria-hidden="true" />
      <span className="button-line" aria-hidden="true" />
      <span className="button-text">{children}</span>
    </>
  );
}

export function ButtonLink({
  href,
  variant = "primary",
  block,
  className,
  children,
}: {
  href: string;
  variant?: ButtonVariant;
  block?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={["button", block ? "button-block" : "", className ?? ""].join(" ").trim()}
      data-variant={variant}
    >
      <ButtonLayers>{children}</ButtonLayers>
    </Link>
  );
}
