import Link from "next/link";
import { BackToTop } from "./back-to-top";
import { BrandMark } from "./icons";
import { NewsletterForm } from "./newsletter-form";

const columns = [
  {
    title: "Explore",
    links: [
      { href: "/", label: "Home" },
      { href: "/about", label: "About Us" },
      { href: "/services#process", label: "Our Process" },
      { href: "/portfolio", label: "Portfolio" },
      { href: "/insights", label: "Insights" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Services",
    links: [
      { href: "/services/website-development", label: "Website Development" },
      { href: "/services#web-apps", label: "Web Application Development" },
      { href: "/services/mobile-app-development", label: "Mobile App Development" },
      { href: "/services/saas-software-development", label: "SaaS Development" },
      { href: "/services/ecommerce-development", label: "E-commerce Solutions" },
      { href: "/services/automation-ai-solutions", label: "AI & Automation" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "Our Company" },
      { href: "/pricing", label: "Pricing" },
      { href: "/about#disciplines", label: "Our Team" },
      { href: "/contact", label: "Start a Project" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <section className="footer-news" aria-labelledby="newsletter-heading">
          <div>
            <h2 id="newsletter-heading">Stay Ahead of What&rsquo;s Next.</h2>
            <p>
              Get practical engineering insights, technology updates, and ideas for building better digital products.
            </p>
          </div>
          <NewsletterForm />
        </section>

        <div className="footer-main">
          <div className="footer-brand">
            <Link className="brand" href="/" aria-label="Novahomin home">
              <BrandMark />
              <span>Novahomin</span>
            </Link>
            <p>
              We engineer digital products, scalable software, and intelligent solutions that help businesses move
              forward.
            </p>
          </div>
          <nav className="footer-nav" aria-label="Footer">
            {columns.map((column) => (
              <div key={column.title}>
                <h3 className="footer-heading">{column.title}</h3>
                <ul>
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href}>{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="footer-bottom">
          <p>© 2026 Novahomin. All rights reserved.</p>
          <BackToTop />
        </div>
      </div>
    </footer>
  );
}
