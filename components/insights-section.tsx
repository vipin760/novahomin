import Link from "next/link";
import { getAllArticles } from "@/lib/public-content";
import { InsightCard } from "@/components/insight-card";
import { Eyebrow } from "@/components/ui";

/** Text-first editorial list of the three latest articles. Server-rendered, no client JS. */
export async function InsightsSection() {
  const articles = await getAllArticles();
  return (
    <section className="section insights" aria-labelledby="insights-heading">
      <div className="container">
        <header className="insights-head">
          <div>
            <Eyebrow plain>Insights</Eyebrow>
            <h2 id="insights-heading">Ideas. Insights. Innovation.</h2>
            <p>Perspectives from our engineers on technology, performance, AI, and the future of digital products.</p>
          </div>
          <Link className="insights-all" href="/insights">
            All insights <span aria-hidden="true">→</span>
          </Link>
        </header>

        <ul className="insights-grid">
          {articles.slice(0, 3).map((article) => (
            <InsightCard key={article.slug} article={article} />
          ))}
        </ul>
      </div>
    </section>
  );
}
