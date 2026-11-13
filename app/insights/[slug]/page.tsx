import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { anim, ArticleCover } from "@/components/ui";
import { InsightCard } from "@/components/insight-card";
import { CloudImage } from "@/components/cloud-image";
import { formatDate, readMinutes } from "@/lib/content";
import { getAllArticles } from "@/lib/public-content";
import { siteOrigin } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getAllArticles()).map((article) => ({ slug: article.slug }));
}

const find = async (slug: string) => (await getAllArticles()).find((article) => article.slug === slug);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = await find((await params).slug);
  if (!article) return {};
  return {
    title: article.title,
    description: article.summary,
    alternates: { canonical: `/insights/${article.slug}` },
    openGraph: {
      type: "article",
      title: article.title,
      description: article.summary,
      ...(article.published ? { publishedTime: article.published } : {}),
      section: article.topic,
    },
    twitter: { card: "summary", title: article.title, description: article.summary },
  };
}

export default async function ArticlePage({ params }: Props) {
  const article = await find((await params).slug);
  if (!article) notFound();
  const more = (await getAllArticles()).filter((other) => other.slug !== article.slug).slice(0, 3);

  const origin = siteOrigin();
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: article.title,
        description: article.summary,
        articleSection: article.topic,
        ...(article.published ? { datePublished: article.published } : {}),
        publisher: { "@type": "Organization", name: "Novahomin" },
        ...(origin ? { mainEntityOfPage: `${origin}/insights/${article.slug}` } : {}),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Insights", ...(origin ? { item: `${origin}/insights` } : {}) },
          { "@type": "ListItem", position: 2, name: article.title },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <article className="article" aria-labelledby="article-heading">
        <header className="container narrow article-head">
          <h1 id="article-heading" {...anim("hero", 1)}>
            {article.title}
          </h1>
          <p className="hero-text" {...anim("hero", 2)}>
            {article.summary}
          </p>
          <p className="article-meta" {...anim("hero", 3)}>
            {readMinutes(article)} min read
            {article.published ? (
              <>
                {" "}
                · <time dateTime={article.published}>{formatDate(article.published)}</time>
              </>
            ) : null}
          </p>
        </header>
        <div className="container narrow">
          {article.cover ? (
            <CloudImage src={article.cover.url} alt={article.cover.alt} ratio="16 / 9" sizes="(max-width: 900px) 100vw, 830px" priority />
          ) : (
            <ArticleCover article={article} large />
          )}
          <div className="prose prose-dark">
            {article.body.map((paragraph) => (
              <p key={paragraph.slice(0, 32)}>{paragraph}</p>
            ))}
          </div>
          <Link className="back-link" href="/insights">
            ← All insights
          </Link>
        </div>
      </article>
      <section className="section insights" aria-labelledby="more-heading">
        <div className="container">
          <h2 id="more-heading" className="center-title" {...anim("text")}>
            More insights
          </h2>
          <ul className="insights-grid">
            {more.map((other) => (
              <InsightCard key={other.slug} article={other} />
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
