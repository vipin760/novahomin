export const navigation = [
  { href: "#about", label: "About" },
  { href: "#services", label: "Services" },
  { href: "#expertise", label: "Expertise" },
  { href: "#process", label: "Process" },
  { href: "#contact", label: "Contact" },
] as const;

export type ServiceIcon =
  | "web"
  | "app"
  | "mobile"
  | "saas"
  | "ai"
  | "commerce"
  | "search";

export const services: {
  title: string;
  description: string;
  icon: ServiceIcon;
  side: "left" | "right";
}[] = [
  {
    title: "Website Development",
    description: "Fast, scalable websites built to convert.",
    icon: "web",
    side: "left",
  },
  {
    title: "Web Applications",
    description: "Complex platforms on clean, maintainable code.",
    icon: "app",
    side: "left",
  },
  {
    title: "Android & iOS Apps",
    description: "Native-quality mobile apps for every device.",
    icon: "mobile",
    side: "left",
  },
  {
    title: "SaaS Development",
    description: "Multi-tenant products, from MVP to scale.",
    icon: "saas",
    side: "right",
  },
  {
    title: "AI & Automation",
    description: "Intelligent workflows that remove manual work.",
    icon: "ai",
    side: "right",
  },
  {
    title: "E-commerce",
    description: "Storefronts engineered for speed and sales.",
    icon: "commerce",
    side: "right",
  },
  {
    title: "SEO & GEO",
    description: "Visibility across search engines and AI answers.",
    icon: "search",
    side: "right",
  },
];

export const expertise = [
  {
    label: "Frontend",
    items: ["Next.js", "React", "TypeScript", "Three.js"],
  },
  {
    label: "Backend & Cloud",
    items: ["Node.js", "Python", "PostgreSQL", "AWS"],
  },
  {
    label: "Mobile",
    items: ["React Native", "Flutter", "Swift", "Kotlin"],
  },
  {
    label: "AI",
    items: ["LLM integration", "RAG", "AI agents", "Automation"],
  },
];

export const processSteps = [
  {
    title: "Discover",
    text: "Goals, users and constraints defined before any code.",
  },
  {
    title: "Design",
    text: "Architecture, interface and prototype validated early.",
  },
  {
    title: "Engineer",
    text: "Iterative sprints with visible, working progress.",
  },
  {
    title: "Launch & scale",
    text: "Performance-tested releases, monitored and improved.",
  },
];

export const visibility = [
  {
    title: "Technical SEO",
    text: "Core Web Vitals, crawlability and structured data.",
  },
  {
    title: "Content & authority",
    text: "Pages that answer real questions clearly.",
  },
  {
    title: "Generative engine optimisation",
    text: "Content structured to be understood and cited by AI.",
  },
];

export const differentiators = [
  {
    title: "Engineering-led",
    text: "Engineers involved from the first conversation.",
  },
  {
    title: "Performance by default",
    text: "Speed, accessibility and SEO built in, not bolted on.",
  },
  {
    title: "AI-native",
    text: "Automation designed into the product, not added later.",
  },
  {
    title: "Transparent delivery",
    text: "Clear scope, honest timelines, direct communication.",
  },
];
