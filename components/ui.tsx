import Link from "next/link";
import type { Article } from "@/lib/content";
import { readMinutes } from "@/lib/content";
import { ButtonLink } from "./button";

type Anim = "hero" | "text" | "card";

/** Animation hook for components/motion.tsx and the CSS hero entrance. */
export function anim(kind: Anim, index?: number) {
  return {
    "data-anim": kind,
    ...(index === undefined ? {} : { style: { "--i": index } as React.CSSProperties }),
  };
}

export function Eyebrow({
  children,
  plain,
  ...rest
}: { children: React.ReactNode; plain?: boolean } & React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={plain ? "eyebrow eyebrow-plain" : "eyebrow"} {...rest}>
      {children}
    </p>
  );
}

export function SectionHead({
  title,
  text,
  id,
}: {
  title: React.ReactNode;
  text?: string;
  id?: string;
}) {
  return (
    <div className="section-head">
      <h2 id={id} {...anim("text")}>
        {title}
      </h2>
      {text ? (
        <p className="lead" {...anim("text")}>
          {text}
        </p>
      ) : null}
    </div>
  );
}

/** The robot poster from public/robot: Novahomin's visual identity, used as hero art. */
export function RobotArt({ className }: { className?: string }) {
  const sizes = [360, 420, 540, 670];
  const set = (ext: string) =>
    sizes.map((size) => `/robot/novahomin-robot-${size}.${ext} ${size}w`).join(", ");
  return (
    <picture className={className}>
      <source type="image/avif" srcSet={set("avif")} sizes="(max-width: 767px) 70vw, 540px" />
      <img
        src="/robot/novahomin-robot-540.webp"
        srcSet={set("webp")}
        sizes="(max-width: 767px) 70vw, 540px"
        width={670}
        height={1494}
        alt=""
        fetchPriority="high"
        decoding="async"
      />
    </picture>
  );
}

/** Full-bleed dark hero (home, about), matching the reference's video hero. */
export function DarkHero({
  title,
  text,
  actions,
  id,
  art = "center",
}: {
  title: React.ReactNode;
  text: string;
  actions: { href: string; label: string }[];
  id: string;
  art?: "center" | "side";
}) {
  return (
    <section className="hero-dark" aria-labelledby={id} data-art={art}>
      <div className="hero-media" aria-hidden="true">
        <RobotArt className="hero-robot" />
        <div className="hero-grain" />
      </div>
      <div className="container hero-content">
        <h1 id={id} {...anim("hero", 1)}>
          {title}
        </h1>
        <p className="hero-text" {...anim("hero", 2)}>
          {text}
        </p>
        <div className="button-row" {...anim("hero", 3)}>
          {actions.map((action, index) => (
            <ButtonLink
              key={action.label}
              href={action.href}
              variant={index === 0 ? "primary" : "glass"}
              className={index === 0 ? undefined : "desktop-only"}
            >
              {action.label}
            </ButtonLink>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Centred light hero (pricing, contact, insights, services). */
export function LightHero({
  title,
  text,
  id,
  children,
}: {
  title: React.ReactNode;
  text?: string;
  id: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="hero-light" aria-labelledby={id}>
      <div className="container hero-light-inner">
        <h1 id={id} {...anim("hero", 1)}>
          {title}
        </h1>
        {text ? (
          <p className="hero-text" {...anim("hero", 2)}>
            {text}
          </p>
        ) : null}
        {children ? <div {...anim("hero", 3)}>{children}</div> : null}
      </div>
    </section>
  );
}

/** Two identical tracks, each sliding its own width every 90 s (the reference's loop). */
/** Thumbnail with an inner layer that zooms to 1.2 on card hover (0.5 s power2.out). */
export function ArticleCover({ article, large }: { article: Article; large?: boolean }) {
  return (
    <div className="article-thumb" data-large={large || undefined} aria-hidden="true">
      <div className="article-cover" data-tone={article.tone}>
        <span className="article-cover-topic">{article.topic}</span>
        <span className="article-cover-shape" />
      </div>
    </div>
  );
}

