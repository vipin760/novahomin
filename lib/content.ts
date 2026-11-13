/**
 * All site copy lives here. Section structure follows the Finvelle reference
 * (finvelle.webflow.io); the words, offers and claims are Novahomin's own.
 */

export type ServiceIcon =
  | "web"
  | "app"
  | "mobile"
  | "saas"
  | "ai"
  | "commerce"
  | "search";

export const primaryNav = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/about", label: "Company" },
  { href: "/pricing", label: "Pricing" },
] as const;

export const pagesMenu = [
  { href: "/about", label: "Company" },
  { href: "/services", label: "Services" },
  { href: "/pricing", label: "Pricing" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/insights", label: "Insights" },
  { href: "/contact", label: "Contact" },
] as const;

export const services: {
  slug: string;
  title: string;
  description: string;
  icon: ServiceIcon;
  deliverables: string[];
}[] = [
  {
    slug: "websites",
    title: "Website Development",
    description: "Fast, scalable websites built to convert.",
    icon: "web",
    deliverables: ["Next.js builds", "Headless CMS", "Core Web Vitals", "Analytics"],
  },
  {
    slug: "web-apps",
    title: "Web Applications",
    description: "Complex platforms on clean, maintainable code.",
    icon: "app",
    deliverables: ["Product architecture", "Dashboards & portals", "APIs", "Role-based access"],
  },
  {
    slug: "mobile",
    title: "Android & iOS Apps",
    description: "Native-quality mobile apps for every device.",
    icon: "mobile",
    deliverables: ["React Native & Flutter", "Swift & Kotlin", "Store release", "Offline-first"],
  },
  {
    slug: "saas",
    title: "SaaS Development",
    description: "Multi-tenant products, from MVP to scale.",
    icon: "saas",
    deliverables: ["MVP delivery", "Multi-tenancy", "Billing", "Observability"],
  },
  {
    slug: "ai",
    title: "AI & Automation",
    description: "Intelligent workflows that remove manual work.",
    icon: "ai",
    deliverables: ["LLM integration", "RAG on your data", "AI agents", "Workflow automation"],
  },
  {
    slug: "commerce",
    title: "E-commerce",
    description: "Storefronts engineered for speed and sales.",
    icon: "commerce",
    deliverables: ["Headless commerce", "Checkout flows", "Payments", "Catalogue search"],
  },
  {
    slug: "seo-geo",
    title: "SEO & GEO",
    description: "Visibility across search engines and AI answers.",
    icon: "search",
    deliverables: ["Technical SEO", "Structured data", "Content strategy", "AI citations"],
  },
];

/** Home: the four cards under the intro statement; each links to its service page. */
export const pillars: { title: string; text: string; icon: ServiceIcon; href: string }[] = [
  {
    title: "Website Development",
    text: "Fast, accessible, SEO-friendly websites that rank on Google and turn visitors into enquiries.",
    icon: "web",
    href: "/services/website-development",
  },
  {
    title: "Web & SaaS Applications",
    text: "Custom web platforms and SaaS products on clean, scalable code, from MVP to growth.",
    icon: "app",
    href: "/services/saas-software-development",
  },
  {
    title: "Mobile App Development",
    text: "Android and iOS apps with native-quality performance, shipped by one focused team.",
    icon: "mobile",
    href: "/services/mobile-app-development",
  },
  {
    title: "AI & Automation",
    text: "AI integration and workflow automation that remove manual work instead of moving it.",
    icon: "ai",
    href: "/services/automation-ai-solutions",
  },
];

export const processSteps = [
  { title: "Discover", text: "Goals, users and constraints defined before any code." },
  { title: "Design", text: "Architecture, interface and prototype validated early." },
  { title: "Engineer", text: "Iterative sprints with visible, working progress." },
  { title: "Launch & scale", text: "Performance-tested releases, monitored and improved." },
];

export const expertise = [
  { label: "Frontend", items: ["Next.js", "React", "TypeScript", "Three.js"] },
  { label: "Backend & Cloud", items: ["Node.js", "Python", "PostgreSQL", "AWS"] },
  { label: "Mobile", items: ["React Native", "Flutter", "Swift", "Kotlin"] },
  { label: "AI", items: ["LLM integration", "RAG", "AI agents", "Automation"] },
];

/** About: disciplines shown in the reference's team grid. */
export const disciplines: { title: string; text: string; icon: ServiceIcon; tone: string }[] = [
  { title: "Strategy", text: "Product discovery", icon: "search", tone: "sage" },
  { title: "Design", text: "Interface & UX", icon: "app", tone: "sky" },
  { title: "Frontend", text: "Next.js · React", icon: "web", tone: "peach" },
  { title: "Backend & Cloud", text: "Node · Python · AWS", icon: "saas", tone: "mint" },
  { title: "Mobile", text: "iOS · Android", icon: "mobile", tone: "sky" },
  { title: "AI", text: "LLMs · RAG · Agents", icon: "ai", tone: "peach" },
  { title: "SEO & GEO", text: "Search & AI visibility", icon: "search", tone: "mint" },
  { title: "Delivery", text: "Launch & scale", icon: "commerce", tone: "sage" },
];

/**
 * Engagement models. No prices have been confirmed, so none are shown.
 * Set `price` (e.g. "£4,900") when you have them; `priceNote` sits underneath.
 */
export const plans: {
  name: string;
  price: string;
  priceNote: string;
  intro: string;
  features: string[];
  featured?: boolean;
}[] = [
  {
    name: "Launch",
    price: "Fixed scope",
    priceNote: "Quoted per project",
    intro: "Best for:",
    features: ["Marketing websites", "Landing pages & campaigns", "Technical SEO setup", "CMS your team can edit"],
  },
  {
    name: "Build",
    price: "Phased",
    priceNote: "Fixed price per phase",
    intro: "Everything in Launch and:",
    features: ["Web & mobile applications", "SaaS MVPs", "API & integration work", "AI features & automation"],
    featured: true,
  },
  {
    name: "Partner",
    price: "Retainer",
    priceNote: "Monthly engagement",
    intro: "Everything in Build and:",
    features: ["Dedicated product team", "Continuous delivery", "SEO & GEO growth programme", "Performance monitoring", "Priority support"],
  },
];

export type Article = {
  slug: string;
  title: string;
  summary: string;
  topic: string;
  tone: "sage" | "sky" | "peach" | "mint" | "dark" | "sand";
  body: string[];
  /** ISO date (YYYY-MM-DD). Leave unset until a real publication date is known; nothing is shown without it. */
  published?: string;
  /** Real image (Cloudinary) for articles written in the admin. */
  cover?: { url: string; alt: string };
};

export const articles: Article[] = [
  {
    slug: "core-web-vitals-still-decide-search",
    title: "Why Core Web Vitals Still Decide Who Wins Search",
    summary: "Speed is a ranking signal and a conversion signal. Here is where the time usually goes.",
    topic: "Performance",
    tone: "sage",
    body: [
      "Core Web Vitals measure what visitors feel: how quickly the main content appears, how fast the page responds to input, and whether the layout jumps while it loads. Search engines use them as a signal, but the bigger cost of a slow page is the visitor who leaves before it finishes.",
      "On most sites we audit, the largest contentful paint is held back by the same few things: render-blocking CSS, web fonts that swap late, hero images without explicit sizes, and JavaScript that has to run before anything useful is shown.",
      "The fixes are rarely exotic. Server-render the content that matters, inline the critical CSS, size every image, defer scripts that are not needed for the first view, and measure on a mid-range phone rather than a developer laptop.",
      "Treat performance as part of the definition of done. A budget that fails the build is cheaper than a redesign two years later.",
    ],
  },
  {
    slug: "geo-getting-cited-by-ai-answers",
    title: "Getting Your Product Discovered in AI Search Results",
    summary: "Generative engines summarise the web. Structure your content so they can understand and cite it.",
    topic: "SEO & GEO",
    tone: "sky",
    body: [
      "More and more buyers ask ChatGPT, Gemini or Perplexity before they ever open a search results page. Generative engine optimisation (GEO) is the practice of making your content easy for those systems to understand, trust and cite.",
      "The foundations overlap with good SEO: crawlable pages, clear headings, structured data and fast responses. What changes is the emphasis on direct answers. Pages that state facts plainly, define terms and back claims with specifics are far more likely to be quoted.",
      "Write for the question, not the keyword. A page that answers \"how long does a SaaS MVP take?\" with a clear range and the factors behind it will outperform a page that circles the topic.",
      "Finally, keep it consistent. When your site, documentation and public profiles describe your product the same way, models are more confident repeating it.",
    ],
  },
  {
    slug: "rag-vs-fine-tuning",
    title: "RAG vs Fine-Tuning: Choosing the Right AI Architecture",
    summary: "Most business assistants need retrieval, not a custom model. How we decide.",
    topic: "Artificial Intelligence",
    tone: "peach",
    body: [
      "When a team wants an assistant that knows their business, the first instinct is often to train a custom model. In most cases retrieval-augmented generation (RAG) is the better starting point.",
      "RAG keeps your knowledge in a searchable store and passes the relevant passages to the model at question time. Content stays current, answers can cite their sources, and access rules can be enforced per user.",
      "Fine-tuning earns its place when you need a consistent style or format, or a narrow task performed at high volume. It does not reliably teach a model new facts, and every content change means another training run.",
      "We usually start with RAG, measure answer quality against a set of real questions, and only reach for fine-tuning when the evaluation shows a gap retrieval cannot close.",
    ],
  },
  {
    slug: "shipping-an-mvp-without-regret",
    title: "Shipping an MVP in Weeks Without Painting Yourself Into a Corner",
    summary: "Speed and maintainability are not opposites. The decisions that keep an MVP extendable.",
    topic: "Product Engineering",
    tone: "mint",
    body: [
      "An MVP exists to learn quickly, but the code you write for it rarely disappears. The goal is to move fast on the things that are cheap to change and to be deliberate about the few that are not.",
      "Cheap to change: interface details, copy, most feature logic. Expensive to change: your data model, authentication, multi-tenancy and the boundaries between services. Spend design time on the second list.",
      "Use boring, well-supported technology. A typed codebase, a relational database and a managed platform remove whole categories of problems that slow a young product down.",
      "Ship to real users early, instrument what they do, and plan the second iteration around evidence rather than the original backlog.",
    ],
  },
  {
    slug: "react-native-or-native",
    title: "React Native or Native? How We Decide for Each App",
    summary: "Cross-platform is the right default for most products, but not all of them.",
    topic: "Mobile Development",
    tone: "dark",
    body: [
      "For most business apps, a cross-platform framework such as React Native or Flutter delivers one codebase, faster iteration and an experience users cannot tell apart from native.",
      "We reach for Swift and Kotlin when the app lives close to the hardware: heavy camera or audio processing, complex background work, deep platform integrations, or animation budgets that leave no headroom.",
      "Team matters too. If your web product is already built in React and TypeScript, sharing logic and people with a React Native app is a real advantage.",
      "Whichever route we take, we plan store releases, crash reporting and offline behaviour from the first sprint rather than the last.",
    ],
  },
  {
    slug: "automation-that-removes-work",
    title: "Automation That Removes Work Instead of Moving It",
    summary: "The best automations start with a process map, not a tool.",
    topic: "Business Automation",
    tone: "sand",
    body: [
      "Many automation projects simply move work around: a manual step becomes a queue of exceptions someone still has to clear. Useful automation starts by understanding where time actually goes.",
      "We map the process end to end, measure volume and error rates at each step, and look for the decisions that follow clear rules. Those are the candidates for automation, with AI reserved for steps that need judgement on unstructured input.",
      "Every automated step needs an owner, a log and a way to hand back to a person. That is what makes teams trust it enough to switch the manual process off.",
      "Measure the result in hours returned and errors avoided, and review it after a month of real use.",
    ],
  },
];

export function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(
    new Date(iso),
  );
}

export function readMinutes(article: Article) {
  const words = [article.title, article.summary, ...article.body].join(" ").split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}
