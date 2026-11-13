import Link from "next/link";
import { formatDate, readMinutes, type Article } from "@/lib/content";

/** Text-first editorial card. The whole card is one link (stretched from the title). */
export function InsightCard({ article, summary }: { article: Article; summary?: boolean }) {
  return (
    <li>
      <article className="insight">
        <p className="insight-topic">{article.topic}</p>
        <h3>
          <Link className="insight-link" href={`/insights/${article.slug}`}>
            <span>{article.title}</span>
          </Link>
        </h3>
        {summary ? <p className="insight-summary">{article.summary}</p> : null}
        <p className="insight-meta">
          <span>{readMinutes(article)} min read</span>
          {article.published ? (
            <>
              <span aria-hidden="true">·</span>
              <time dateTime={article.published}>{formatDate(article.published)}</time>
            </>
          ) : null}
          <span className="insight-arrow" aria-hidden="true">
            →
          </span>
        </p>
      </article>
    </li>
  );
}
