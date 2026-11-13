/**
 * "What We Serve": the seven service categories shown on the home page and given a
 * dedicated page at /services/[slug]. One source of truth for copy, URLs and metadata.
 */

export type ServeIcon =
  | "web"
  | "mobile"
  | "commerce"
  | "saas"
  | "design"
  | "automation"
  | "support";

export type ServeCategory = {
  slug: string;
  number: string;
  title: string;
  icon: ServeIcon;
  /** Large card on the home grid. */
  featured?: boolean;
  description: string;
  /** Business result, shown as a short line on the card and the detail page. */
  outcome: string;
  items: string[];
  /** Detail page <title> and meta description (keyword themes, written naturally). */
  seoTitle: string;
  seoDescription: string;
  /** Detail page H1 and intro. */
  heading: string;
  intro: string;
};

export const serveCategories: ServeCategory[] = [
  {
    slug: "website-development",
    number: "01",
    title: "Website & Web Development",
    icon: "web",
    featured: true,
    description:
      "Build fast, responsive, SEO-friendly websites and powerful web applications designed around your business goals.",
    outcome: "Faster pages and more qualified enquiries.",
    items: [
      "Business Website Development",
      "Custom Website Development",
      "Web Application Development",
      "Corporate Website Development",
      "Landing Page Development",
    ],
    seoTitle: "Website Development Services",
    seoDescription:
      "Novahomin is a web development company building fast, responsive, SEO-friendly websites, corporate sites, landing pages and custom web applications.",
    heading: "Website development built around your business goals",
    intro:
      "We design and engineer business websites, corporate sites, landing pages and web applications that load quickly, rank well and are easy for your team to extend.",
  },
  {
    slug: "mobile-app-development",
    number: "02",
    title: "Mobile Application Development",
    icon: "mobile",
    description:
      "Transform your business ideas into intuitive, scalable mobile applications that deliver seamless user experiences.",
    outcome: "An app people keep using after launch.",
    items: [
      "Android App Development",
      "iOS App Development",
      "Cross-Platform App Development",
      "Mobile App UI/UX Design",
      "App Maintenance",
    ],
    seoTitle: "Mobile App Development Company",
    seoDescription:
      "Android, iOS and cross-platform mobile app development from Novahomin: product design, engineering, store release and ongoing app maintenance.",
    heading: "Mobile apps for Android and iOS, designed to be used",
    intro:
      "From a first release to a growing product, we build native-quality Android, iOS and cross-platform apps and keep them healthy after launch.",
  },
  {
    slug: "ecommerce-development",
    number: "03",
    title: "E-commerce Solutions",
    icon: "commerce",
    description:
      "Create high-performing online stores with secure checkout, streamlined operations, and scalable commerce experiences.",
    outcome: "Smoother checkout and simpler daily operations.",
    items: [
      "Custom E-commerce Development",
      "E-commerce Website Design",
      "Payment Gateway Integration",
      "Shopping Cart Development",
      "Inventory and Order Management",
    ],
    seoTitle: "E-commerce Development Company",
    seoDescription:
      "Custom e-commerce development by Novahomin: store design, shopping carts, payment gateway integration and inventory and order management.",
    heading: "E-commerce development for stores that scale",
    intro:
      "We build online stores with secure checkout, reliable payments and back-office tools that keep inventory and orders simple to manage as you grow.",
  },
  {
    slug: "saas-software-development",
    number: "04",
    title: "SaaS & Software Development",
    icon: "saas",
    featured: true,
    description:
      "Develop tailored software and scalable SaaS platforms that simplify operations and support long-term business growth.",
    outcome: "Software shaped to how your business actually works.",
    items: [
      "SaaS Platform Development",
      "Custom Software Development",
      "CRM and ERP Solutions",
      "Business Management Systems",
      "Multi-Tenant Applications",
    ],
    seoTitle: "Custom Software & SaaS Development Services",
    seoDescription:
      "Custom software development and SaaS development services from Novahomin: multi-tenant platforms, CRM and ERP solutions and business management systems.",
    heading: "Custom software and SaaS platforms, from MVP to scale",
    intro:
      "We turn product ideas and internal processes into maintainable software: multi-tenant SaaS platforms, CRM and ERP systems and tools that fit your operations.",
  },
  {
    slug: "ui-ux-design",
    number: "05",
    title: "UI/UX & Product Design",
    icon: "design",
    description:
      "Design meaningful digital experiences that combine usability, visual consistency, and business objectives.",
    outcome: "Clearer journeys and fewer costly rebuilds.",
    items: [
      "Website UI/UX Design",
      "Mobile App Design",
      "Dashboard Design",
      "Product Prototyping",
      "Design Systems",
    ],
    seoTitle: "UI/UX Design Services",
    seoDescription:
      "UI/UX design services from Novahomin: website and mobile app design, dashboards, product prototyping and design systems.",
    heading: "UI/UX and product design with a business purpose",
    intro:
      "We design websites, apps and dashboards that are easy to use, visually consistent and tied to the outcomes your business needs.",
  },
  {
    slug: "automation-ai-solutions",
    number: "06",
    title: "Automation & AI Solutions",
    icon: "automation",
    featured: true,
    description:
      "Reduce repetitive work, connect business systems, and improve operational efficiency through intelligent automation.",
    outcome: "Less manual work and more time on what matters.",
    items: [
      "Business Workflow Automation",
      "AI Integration",
      "API Integration",
      "Chatbot Development",
      "Process Optimization",
    ],
    seoTitle: "Business Automation & AI Integration Services",
    seoDescription:
      "Business automation solutions and AI integration services from Novahomin: workflow automation, API integration, chatbots and process optimization.",
    heading: "Business automation and AI integration that saves time",
    intro:
      "We connect your systems, automate repetitive workflows and integrate AI where it genuinely helps, with guardrails and clear ownership.",
  },
  {
    slug: "maintenance-support",
    number: "07",
    title: "Digital Maintenance & Support",
    icon: "support",
    description:
      "Keep your digital products secure, reliable, optimized, and ready to grow.",
    outcome: "Fewer incidents and a product that stays current.",
    items: [
      "Website Maintenance",
      "Application Maintenance",
      "Performance Optimization",
      "Security Updates",
      "Technical Support",
    ],
    seoTitle: "Website & Application Maintenance Services",
    seoDescription:
      "Website maintenance, application maintenance, performance optimization, security updates and technical support from the Novahomin team.",
    heading: "Maintenance and support that keeps products reliable",
    intro:
      "We look after your websites and applications with regular updates, performance tuning, security patches and responsive technical support.",
  },
];

export const serveBySlug = (slug: string) => serveCategories.find((c) => c.slug === slug);
