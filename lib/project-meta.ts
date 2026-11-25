/** Shared (server + client) project vocabulary: categories, platforms and helpers. */
export const PROJECT_CATEGORIES = [
  { value: "Mobile App", label: "Mobile Apps", icon: "mobile" },
  { value: "Web App", label: "Web Apps", icon: "web" },
  { value: "SaaS", label: "SaaS Products", icon: "saas" },
  { value: "eCommerce", label: "eCommerce", icon: "cart" },
  { value: "Enterprise", label: "Enterprise", icon: "enterprise" },
] as const;

export type CategoryIcon = (typeof PROJECT_CATEGORIES)[number]["icon"] | "folder";

export const PROJECT_PLATFORMS = ["iOS App", "Android App", "Web App", "Admin Web"] as const;

/** Maps free-text categories ("Mobile app", "E-commerce", …) onto the fixed set; unknown text is kept as is. */
export function normalizeCategory(raw: string) {
  const text = raw.trim().toLowerCase();
  if (!text) return "";
  if (/mobile|android|ios/.test(text)) return "Mobile App";
  if (/saas/.test(text)) return "SaaS";
  if (/e-?commerce|shop|store/.test(text)) return "eCommerce";
  if (/enterprise|erp|crm|hospital/.test(text)) return "Enterprise";
  if (/web/.test(text)) return "Web App";
  return raw.trim();
}

export const categoryIcon = (category: string): CategoryIcon =>
  PROJECT_CATEGORIES.find((entry) => entry.value === normalizeCategory(category))?.icon ?? "folder";
