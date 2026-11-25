import type { CategoryIcon } from "@/lib/project-meta";

const paths: Record<CategoryIcon | "check" | "arrow" | "external" | "apple" | "android" | "monitor" | "layers" | "folder" | "code", string> = {
  mobile: "M8 3h8a1 1 0 011 1v16a1 1 0 01-1 1H8a1 1 0 01-1-1V4a1 1 0 011-1zM11 18h2",
  web: "M3 5h18v12H3zM8 21h8M12 17v4",
  monitor: "M3 5h18v12H3zM8 21h8M12 17v4",
  saas: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  cart: "M3 4h2l2 11h11l2-8H6M9 20a1 1 0 100-2 1 1 0 000 2zM17 20a1 1 0 100-2 1 1 0 000 2z",
  enterprise: "M12 3l9 5-9 5-9-5zM3 13l9 5 9-5M3 17l9 5 9-5",
  layers: "M12 3l9 5-9 5-9-5zM3 13l9 5 9-5M3 17l9 5 9-5",
  folder: "M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z",
  check: "M5 12.5l4.5 4.5L19 7.5",
  arrow: "M5 12h14M13 6l6 6-6 6",
  external: "M7 17L17 7M8 7h9v9",
  apple: "M16 12.5c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9s-1.8-.8-3-.8C6.5 7.3 5 8.2 4.2 9.6c-1.7 2.9-.4 7.2 1.2 9.5.8 1.1 1.7 2.4 2.9 2.4 1.2 0 1.600-.8 3-.8s1.800.8 3 .8 2-1.100 2.800-2.200c.9-1.300 1.200-2.500 1.200-2.600-.1 0-2.300-.9-2.300-3.500zM14.200 5.200c.6-.8 1.100-1.800.9-2.800-.9 0-2 .6-2.600 1.400-.6.700-1.100 1.700-.9 2.700 1 .1 2-.5 2.600-1.300z",
  android: "M6 18V9h12v9a1 1 0 01-1 1h-1v3M8 19v3M6 9a6 6 0 0112 0M9.500 5.500L8.500 4M14.500 5.500l1-1.500M3 11v5M21 11v5",
  code: "M8 8l-4 4 4 4M16 8l4 4-4 4M14 5l-4 14",
};

export function PIcon({ name, size = 20 }: { name: keyof typeof paths; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d={paths[name]} />
    </svg>
  );
}
