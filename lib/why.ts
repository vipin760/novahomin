/** "Why Novahomin": four brand differentiators, each linking to the most relevant service page. */

export type WhyIcon = "engineering" | "performance" | "ai" | "partnership";

export const whyPoints: {
  number: string;
  icon: WhyIcon;
  title: string;
  description: string;
  points: string[];
  href: string;
  linkLabel: string;
}[] = [
  {
    number: "01",
    icon: "engineering",
    title: "Built on Engineering, Not Guesswork.",
    description:
      "Our developers are involved from the first conversation, helping define the right architecture, technology stack, project scope, and implementation strategy.",
    points: [
      "Technical planning from day one",
      "Scalable architecture",
      "Maintainable code",
      "Practical development decisions",
    ],
    href: "/services/saas-software-development",
    linkLabel: "See our software development services",
  },
  {
    number: "02",
    icon: "performance",
    title: "Performance Is Part of the Process.",
    description:
      "We build digital products with speed, reliability, security, and scalability considered throughout the development lifecycle.",
    points: [
      "Performance-focused development",
      "Responsive experiences",
      "Technical SEO foundations",
      "Secure and optimized architecture",
    ],
    href: "/services/website-development",
    linkLabel: "See our website development services",
  },
  {
    number: "03",
    icon: "ai",
    title: "Intelligent Technology, Practical Results.",
    description:
      "We identify opportunities to integrate AI and automation where they genuinely improve workflows, productivity, and customer experiences.",
    points: [
      "AI integration where it adds value",
      "Workflow automation",
      "API connectivity",
      "Intelligent business solutions",
    ],
    href: "/services/automation-ai-solutions",
    linkLabel: "See our automation and AI services",
  },
  {
    number: "04",
    icon: "partnership",
    title: "Built for the Long Run.",
    description:
      "Our involvement doesn't have to end when a project goes live. We support continuous improvements, maintenance, optimization, and future expansion.",
    points: [
      "Ongoing technical support",
      "Product improvements",
      "Maintenance and updates",
      "Scalable future enhancements",
    ],
    href: "/services/maintenance-support",
    linkLabel: "See our maintenance and support services",
  },
];
