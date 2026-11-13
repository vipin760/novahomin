import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ButtonLink } from "@/components/button";
import { anim, LightHero, SectionHead } from "@/components/ui";
import { processSteps } from "@/lib/content";
import { serveBySlug, serveCategories } from "@/lib/serve";
import { siteOrigin } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return serveCategories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = serveBySlug((await params).slug);
  if (!category) return {};
  return {
    title: category.seoTitle,
    description: category.seoDescription,
    alternates: { canonical: `/services/${category.slug}` },
    openGraph: { title: category.seoTitle, description: category.seoDescription },
  };
}

export default async function ServiceDetailPage({ params }: Props) {
  const category = serveBySlug((await params).slug);
  if (!category) notFound();
  const origin = siteOrigin();
  const others = serveCategories.filter((other) => other.slug !== category.slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        name: category.seoTitle,
        serviceType: category.title,
        description: category.seoDescription,
        provider: { "@type": "Organization", name: "Novahomin", ...(origin ? { url: origin } : {}) },
        ...(origin ? { url: `${origin}/services/${category.slug}` } : {}),
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: category.title,
          itemListElement: category.items.map((item) => ({
            "@type": "Offer",
            itemOffered: { "@type": "Service", name: item },
          })),
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Services", ...(origin ? { item: `${origin}/services` } : {}) },
          { "@type": "ListItem", position: 2, name: category.title },
        ],
      },
    ],
  };

  return (
    <div className="service-detail">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <LightHero id="service-heading" title={category.heading} text={category.intro}>
        <div className="button-row">
          <ButtonLink href="/contact">Discuss your project</ButtonLink>
          <ButtonLink href="/services" variant="soft">
            All services
          </ButtonLink>
        </div>
      </LightHero>

      <section className="section section-flush-top" aria-labelledby="included-heading">
        <div className="container">
          <h2 id="included-heading" className="center-title" {...anim("text")}>
            What is included
          </h2>
          <ul className="detail-grid">
            {category.items.map((item, index) => (
              <li className="detail-card" key={item} {...anim("card")}>
                <span className="serve-number">0{index + 1}</span>
                <h3>{item}</h3>
              </li>
            ))}
          </ul>
          <p className="detail-outcome">
            <strong>Outcome.</strong> {category.outcome}
          </p>
        </div>
      </section>

      <section className="section section-sand" aria-labelledby="process-heading">
        <div className="container">
          <SectionHead
            id="process-heading"
            title="Fast decisions, visible progress"
            text="Four stages, each ending with something you can see and test."
          />
          <ol className="step-grid">
            {processSteps.map((step, index) => (
              <li className="step-card" key={step.title} {...anim("card")}>
                <span className="process-number">0{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section" aria-labelledby="related-heading">
        <div className="container">
          <h2 id="related-heading" className="center-title" {...anim("text")}>
            Other ways we can help
          </h2>
          <ul className="detail-related">
            {others.map((other) => (
              <li key={other.slug}>
                <Link href={`/services/${other.slug}`}>{other.title}</Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
