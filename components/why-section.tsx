import Link from "next/link";
import { whyPoints, type WhyIcon } from "@/lib/why";
import { Eyebrow } from "@/components/ui";

const icons: Record<WhyIcon, React.ReactNode> = {
  engineering: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" />
      <rect x="13.5" y="13.5" width="7" height="7" />
      <path d="M10.5 7H17a3.5 3.5 0 0 1 3.5 3.5v3M13.5 17H7a3.5 3.5 0 0 1-3.5-3.5v-3" />
    </>
  ),
  performance: (
    <>
      <path d="M4 17a8 8 0 1 1 16 0" />
      <path d="m12 17 4.5-6" />
      <path d="M12 6.5v1.5M6.3 9.3l1 1M17.7 9.3l-1 1" />
    </>
  ),
  ai: (
    <>
      <path d="m12 3 2.2 6.3L20.5 11.5l-6.3 2.2L12 20l-2.2-6.3L3.5 11.5l6.3-2.2L12 3Z" />
    </>
  ),
  partnership: (
    <>
      <path d="M17.5 8A7 7 0 0 0 5 10.5" />
      <path d="M5 5v5.5h5.5" />
      <path d="M6.5 16A7 7 0 0 0 19 13.5" />
      <path d="M19 19v-5.5h-5.5" />
    </>
  ),
};

function WhyGlyph({ name }: { name: WhyIcon }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="26"
      height="26"
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

export function WhySection() {
  return (
    <section className="section why" aria-labelledby="why-heading">
      <div className="container">
        <header className="why-head">
          <Eyebrow plain>Why Novahomin</Eyebrow>
          <h2 id="why-heading">Technology Built Around Your Ambition.</h2>
          <p>
            We combine engineering expertise, thoughtful design, and intelligent technology to build
            digital solutions that solve real business challenges and scale with your vision.
          </p>
        </header>

        <ol className="why-grid">
          {whyPoints.map((point, index) => (
            <li className="why-card" data-lead={index === 0 || undefined} key={point.number}>
              <article>
                <div className="why-top">
                  <span className="why-icon">
                    <WhyGlyph name={point.icon} />
                  </span>
                  <span className="why-number" aria-hidden="true">
                    {point.number}
                  </span>
                </div>
                <h3>
                  <Link className="why-link" href={point.href} aria-label={point.linkLabel}>
                    <span className="why-title">{point.title}</span>
                  </Link>
                </h3>
                <p className="why-desc">{point.description}</p>
                <ul className="why-points">
                  {point.points.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <span className="why-arrow" aria-hidden="true">
                  →
                </span>
              </article>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
