/**
 * Illustrative interface mockups built in HTML/CSS, in place of the reference's
 * dashboard screenshots. Figures are sample UI data, not client results.
 */

export function PerformanceMockup() {
  const scores = [
    ["Performance", 98],
    ["Accessibility", 100],
    ["Best practices", 100],
    ["SEO", 100],
  ] as const;
  const points = [62, 58, 50, 44, 40, 33, 29, 24, 20, 18, 15, 12];
  const path = points.map((y, i) => `${i === 0 ? "M" : "L"}${(i / (points.length - 1)) * 300} ${y}`).join(" ");
  return (
    <div className="mock mock-performance" role="img" aria-label="Sample site report: performance 98, accessibility 100, best practices 100, SEO 100; performance score trending up across builds.">
      <div className="mock-stats">
        {scores.map(([label, value]) => (
          <div className="mock-stat" key={label}>
            <span className="mock-ring" style={{ "--value": value } as React.CSSProperties}>
              {value}
            </span>
            <span className="mock-label">{label}</span>
          </div>
        ))}
      </div>
      <div className="mock-chart">
        <div className="mock-chart-head">
          <span>Performance score</span>
          <span>Last 12 builds</span>
        </div>
        <svg viewBox="0 0 300 72" preserveAspectRatio="none">
          <path d={`${path} L300 72 L0 72 Z`} className="mock-area" />
          <path d={path} className="mock-line" />
        </svg>
      </div>
      <p className="mock-note">
        <i /> LCP 1.1 s on mid-range mobile, within budget.
      </p>
    </div>
  );
}

export function AssistantMockup() {
  const rows = [
    ["Order history", "+18%", 82],
    ["Return policy", "+9%", 46],
    ["Shipping times", "-4%", 30],
  ] as const;
  return (
    <div className="mock-stack" role="img" aria-label="Sample AI assistant answering a customer question with cited sources.">
      <div className="mock-pill">
        <span>Resolved by AI</span>
        <strong>72%</strong>
      </div>
      <div className="mock mock-assistant">
        <div className="mock-assistant-head">
          <span className="mock-spark" />
          <strong>Novahomin Assist</strong>
          <span className="mock-tag">AI</span>
        </div>
        <p className="mock-quote">&ldquo;Where is my order #4821?&rdquo;</p>
        <p className="mock-kicker">Sources used</p>
        {rows.map(([label, change, width]) => (
          <div className="mock-bar-row" key={label}>
            <div>
              <span>{label}</span>
              <span className={change.startsWith("-") ? "is-down" : "is-up"}>{change}</span>
            </div>
            <span className="mock-bar" style={{ "--w": `${width}%` } as React.CSSProperties} />
          </div>
        ))}
        <p className="mock-kicker mock-foot">Grounded answer · 2 citations</p>
      </div>
    </div>
  );
}

export function SearchMockup() {
  return (
    <div className="mock-collage" role="img" aria-label="Sample search result and AI answer citing a Novahomin-built site.">
      <div className="mock mock-chip mock-chip-a">
        <span className="mock-square" data-tone="mint" />
        <div>
          <strong>#1</strong>
          <span>Organic position</span>
        </div>
      </div>
      <div className="mock mock-serp">
        <span className="mock-url">yourbrand.com › guides</span>
        <strong>How long does a SaaS MVP take?</strong>
        <p>A clear answer with the factors behind it, structured for search and AI.</p>
        <div className="mock-ai">
          <span className="mock-spark" />
          <span>AI answer cites <b>yourbrand.com</b></span>
        </div>
      </div>
      <div className="mock mock-chip mock-chip-b">
        <span className="mock-square" data-tone="ink" />
        <div>
          <strong>Rich result</strong>
          <span>Structured data valid</span>
        </div>
      </div>
    </div>
  );
}

/** The large dashboard in the dark "process" section (the reference's video tour). */
export function ConsoleMockup() {
  const bars = [38, 52, 44, 60, 56, 72, 64, 80, 70, 86, 78, 96];
  const months = ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8", "W9", "W10", "W11", "W12"];
  const releases = [
    ["Checkout redesign", "Web", "Shipped"],
    ["AI support assistant", "AI", "In review"],
    ["iOS app 2.4", "Mobile", "Building"],
    ["Search & schema update", "SEO", "Shipped"],
    ["Billing migration", "SaaS", "Planned"],
  ] as const;
  return (
    <div className="console" role="img" aria-label="Sample project console showing sprint progress, deployments and releases.">
      <aside className="console-side">
        <p className="console-brand">
          <span className="mock-square" data-tone="mint" /> Novahomin
        </p>
        <ul>
          {["Overview", "Sprints", "Releases", "Analytics", "Settings"].map((item, index) => (
            <li key={item} data-active={index === 0 || undefined}>
              {item}
            </li>
          ))}
        </ul>
        <div className="console-manager">
          <span className="console-avatar">PM</span>
          <div>
            <strong>Your project lead</strong>
            <span>Online now</span>
          </div>
        </div>
      </aside>
      <div className="console-main">
        <div className="console-head">
          <div>
            <strong>Overview</strong>
            <span>Sprint 6 of 8</span>
          </div>
          <span className="console-search">Search releases</span>
        </div>
        <div className="console-kpis">
          {[
            ["Sprint progress", "75%", "On schedule"],
            ["Lighthouse", "98", "Mobile score"],
            ["Uptime", "99.98%", "Last 30 days"],
            ["Open issues", "3", "Awaiting review"],
          ].map(([label, value, note], index) => (
            <div className="console-kpi" key={label} data-highlight={index === 3 || undefined}>
              <span>{label}</span>
              <strong>{value}</strong>
              <span>{note}</span>
            </div>
          ))}
        </div>
        <div className="console-grid">
          <div className="console-card">
            <div className="console-card-head">
              <strong>Deployments</strong>
              <span>Last 12 weeks</span>
            </div>
            <div className="console-bars">
              {bars.map((height, index) => (
                <span key={months[index]} style={{ "--h": `${height}%` } as React.CSSProperties} data-last={index === bars.length - 1 || undefined} />
              ))}
            </div>
          </div>
          <div className="console-card">
            <div className="console-card-head">
              <strong>Releases</strong>
              <span>View all</span>
            </div>
            <ul className="console-list">
              {releases.map(([name, area, status]) => (
                <li key={name}>
                  <span className="console-code">{area.slice(0, 2).toUpperCase()}</span>
                  <span>{name}</span>
                  <span className="console-status" data-status={status}>
                    {status}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Looping mini demos revealed on pillar-card hover, in the slot where the reference
 * plays short video clips. Pure CSS animation; static under reduced motion.
 */
export function PillarDemo({ kind }: { kind: "web" | "app" | "mobile" | "ai" | string }) {
  if (kind === "web")
    return (
      <div className="pd pd-web" data-tone="sage">
        <div className="pd-browser">
          <div className="pd-chrome">
            <i />
            <i />
            <i />
          </div>
          <div className="pd-load" />
          <div className="pd-lines">
            <span />
            <span />
            <span />
          </div>
        </div>
        <span className="pd-badge">98</span>
      </div>
    );
  if (kind === "app")
    return (
      <div className="pd pd-app" data-tone="sky">
        <div className="pd-bars">
          {[40, 65, 50, 80, 60, 92, 74].map((height, index) => (
            <span key={index} style={{ "--h": `${height}%`, "--d": `${index * 0.12}s` } as React.CSSProperties} />
          ))}
        </div>
      </div>
    );
  if (kind === "mobile")
    return (
      <div className="pd pd-mobile" data-tone="peach">
        <div className="pd-phone">
          <span className="pd-notch" />
          <span className="pd-toast">Order shipped</span>
          <div className="pd-tiles">
            {Array.from({ length: 6 }, (_, index) => (
              <i key={index} />
            ))}
          </div>
        </div>
      </div>
    );
  return (
    <div className="pd pd-ai" data-tone="mint">
      <span className="pd-bubble pd-user">Summarise this week&rsquo;s tickets</span>
      <span className="pd-bubble pd-bot">
        <i />
        <i />
        <i />
      </span>
    </div>
  );
}
