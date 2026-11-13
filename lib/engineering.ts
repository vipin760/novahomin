/** "How We Engineer": four principles. `focus` picks which parts of the architecture diagram light up. */

export type ArchGroup = "client" | "api" | "integrate" | "core" | "secure" | "ai" | "data" | "ops" | "cloud";

export const engineeringPrinciples: {
  number: string;
  label: string;
  headline: string;
  description: string;
  points: string[];
  focus: ArchGroup[];
}[] = [
  {
    number: "01",
    label: "Engineering Excellence",
    headline: "Technology decisions that make sense.",
    description:
      "We select the right architecture, frameworks, and technologies based on your actual business requirements, prioritizing maintainability, scalability, and long-term value.",
    points: ["Scalable architecture", "Clean and maintainable code", "Technology-driven problem solving"],
    focus: ["api", "core", "data"],
  },
  {
    number: "02",
    label: "Performance & Reliability",
    headline: "Built for speed. Designed for reliability.",
    description:
      "We prioritize performance, security, accessibility, and usability throughout the development lifecycle to deliver dependable digital experiences.",
    points: ["Performance optimization", "Security best practices", "Responsive experiences"],
    focus: ["client", "secure", "cloud"],
  },
  {
    number: "03",
    label: "Intelligent Innovation",
    headline: "Making technology work smarter.",
    description:
      "We identify practical opportunities for AI, automation, and system integrations to simplify operations and improve business efficiency.",
    points: ["Practical AI integration", "Intelligent workflow automation", "Seamless system connectivity"],
    focus: ["ai", "integrate", "api"],
  },
  {
    number: "04",
    label: "Continuous Evolution",
    headline: "Launch is just the beginning.",
    description:
      "We believe digital products should continuously improve. We support ongoing optimization, maintenance, and technical improvements as businesses grow.",
    points: ["Continuous improvements", "Technical maintenance", "Future-ready architecture"],
    focus: ["ops", "core", "data"],
  },
];
