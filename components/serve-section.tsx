import Link from "next/link";
import { serveCategories, type ServeIcon } from "@/lib/serve";
import { anim, Eyebrow } from "@/components/ui";

const icons: Record<ServeIcon, React.ReactNode> = {
  web: (
    <>
      <rect x="3" y="4.5" width="18" height="15" rx="1.5" />
      <path d="M3 9h18M8 13.5h8M8 16h5" />
    </>
  ),
  mobile: (
    <>
      <rect x="7" y="2.5" width="10" height="19" rx="2" />
      <path d="M10.5 18.5h3" />
    </>
  ),
  commerce: (
    <>
      <path d="M4.5 7.5h15l-1.2 12a1.5 1.5 0 0 1-1.5 1.4H7.2a1.5 1.5 0 0 1-1.5-1.4l-1.2-12Z" />
      <path d="M9 10.5V7a3 3 0 0 1 6 0v3.5" />
    </>
  ),
  saas: (
    <>
      <path d="m12 3 9 4.5-9 4.5-9-4.5L12 3Z" />
      <path d="m3 12 9 4.5 9-4.5M3 16.5 12 21l9-4.5" />
    </>
  ),
  design: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" />
      <circle cx="17" cy="7" r="3.5" />
      <path d="m3.5 20.5 3.5-7 3.5 7h-7ZM14 14h7v6.5h-7z" />
    </>
  ),
  automation: (
    <>
      <circle cx="6" cy="6" r="2.5" />
      <circle cx="18" cy="12" r="2.5" />
      <circle cx="6" cy="18" r="2.5" />
      <path d="M8.5 6H13a3 3 0 0 1 3 3v.5M8.5 18H13a3 3 0 0 0 3-3v-.5" />
    </>
  ),
  support: (
    <>
      <path d="M12 3 4.5 6v5.5c0 4.5 3.1 8.2 7.5 9.5 4.4-1.3 7.5-5 7.5-9.5V6L12 3Z" />
      <path d="m8.5 12 2.5 2.5 4.5-5" />
    </>
  ),
};

function Icon({ name }: { name: ServeIcon }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {icons[name]}
    </svg>
  );
}

/** Decorative geometric motif for the larger cards. */
function Motif({ index }: { index: number }) {
  return (
    <svg className="serve-motif" viewBox="0 0 160 160" fill="none" aria-hidden="true" focusable="false">
      {index === 0 ? (
        <>
          <rect x="10" y="10" width="140" height="140" />
          <rect x="40" y="40" width="80" height="80" />
          <rect x="70" y="70" width="20" height="20" />
        </>
      ) : index === 1 ? (
        <>
          <path d="M10 150 80 10l70 140H10Z" />
          <path d="M45 150 80 80l35 70" />
        </>
      ) : (
        <>
          <circle cx="80" cy="80" r="70" />
          <circle cx="80" cy="80" r="44" />
          <circle cx="80" cy="80" r="18" />
        </>
      )}
    </svg>
  );
}

export function ServeSection() {
  let featuredIndex = -1;
  return (
    <section className="section serve" aria-labelledby="serve-heading">
      <div className="container">
        <header className="serve-head">
          <div>
            <Eyebrow plain>What we serve</Eyebrow>
            <h2 id="serve-heading">
              Digital Solutions That Move Your Business Forward.
            </h2>
          </div>
          <div className="serve-head-side">
            <p>
              From building powerful digital experiences to developing scalable software platforms,
              Novahomin helps businesses turn ideas into reliable digital products.
            </p>
            <Link className="serve-link" href="/services">
              Explore Our Services <span aria-hidden="true">→</span>
            </Link>
          </div>
        </header>

        <ul className="serve-grid">
          {serveCategories.map((category) => {
            if (category.featured) featuredIndex += 1;
            return (
              <li
                className="serve-card"
                data-featured={category.featured || undefined}
                key={category.slug}
                {...anim("card")}
              >
                <article>
                  <div className="serve-top">
                    <span className="serve-icon">
                      <Icon name={category.icon} />
                    </span>
                    <span className="serve-number" aria-hidden="true">
                      {category.number}
                    </span>
                  </div>
                  <h3>
                    <Link className="serve-title-link" href={`/services/${category.slug}`}>
                      {category.title}
                    </Link>
                  </h3>
                  <p className="serve-desc">{category.description}</p>
                  <ul className="serve-items">
                    {category.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  <p className="serve-outcome">
                    <span>Outcome</span> {category.outcome}
                  </p>
                  <span className="serve-more" aria-hidden="true">
                    Explore service <span>→</span>
                  </span>
                  {category.featured ? <Motif index={featuredIndex} /> : null}
                </article>
              </li>
            );
          })}
        </ul>

        <div className="serve-cta" {...anim("text")}>
          <p>Not sure which service fits? Tell us the outcome you need and we will recommend a plan.</p>
          <div className="serve-cta-buttons">
            <Link className="serve-btn serve-btn-solid" href="/contact">
              Discuss Your Project
            </Link>
            <Link className="serve-btn serve-btn-line" href="/services">
              Explore All Services
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
