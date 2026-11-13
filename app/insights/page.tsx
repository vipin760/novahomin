import type { Metadata } from "next";
import { Eyebrow } from "@/components/ui";
import { InsightCard } from "@/components/insight-card";
import { getAllArticles } from "@/lib/public-content";

const title = "Insights & Engineering Perspectives | Novahomin";
const description =
  "Explore Novahomin's engineering insights on web performance, software development, AI architecture, SEO, mobile applications, and business automation.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: "/insights" },
  openGraph: { type: "website", title, description, url: "/insights" },
  twitter: { card: "summary", title, description },
};

export default async function InsightsPage() {
  const articles = await getAllArticles();
  return (
    <div className="insights insights-page">
      <header className="container insights-hero">
        <Eyebrow plain>Novahomin Journal</Eyebrow>
        <h1>Ideas, Insights &amp; Engineering Perspectives.</h1>
        <p>
          Explore practical perspectives from our engineers on software development, digital products, performance,
          artificial intelligence, and emerging technology.
        </p>
      </header>
      <section className="section insights-list" aria-labelledby="articles-heading">
        <div className="container">
          <h2 id="articles-heading" className="sr-only">
            All articles
          </h2>
          <ul className="insights-grid">
            {articles.map((article) => (
              <InsightCard key={article.slug} article={article} summary />
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
