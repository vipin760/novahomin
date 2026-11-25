const paths = {
  dashboard: "M4 13h6V4H4zm0 7h6v-5H4zm10 0h6V11h-6zm0-16v5h6V4z",
  mail: "M4 6h16v12H4zM4 7l8 6 8-6",
  users: "M16 19v-1a4 4 0 00-4-4H7a4 4 0 00-4 4v1M9.5 10a3 3 0 100-6 3 3 0 000 6zM21 19v-1a4 4 0 00-3-3.9M15.5 4.2a3 3 0 010 5.6",
  user: "M12 12a4 4 0 100-8 4 4 0 000 8zM5 20a7 7 0 0114 0",
  blog: "M5 4h10l4 4v12H5zM14 4v5h5M8 13h8M8 17h6",
  folder: "M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z",
  image: "M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M9 9.5h.01",
  settings: "M12 15a3 3 0 100-6 3 3 0 000 6zM19 12a7 7 0 00-.1-1.2l2-1.5-2-3.4-2.3 1a7 7 0 00-2-1.2L14.2 3h-4l-.4 2.7a7 7 0 00-2 1.2l-2.3-1-2 3.4 2 1.5A7 7 0 005 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.3-1a7 7 0 002 1.2l.4 2.7h4l.4-2.7a7 7 0 002-1.2l2.3 1 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z",
  search: "M11 18a7 7 0 100-14 7 7 0 000 14zM20 20l-4-4",
  menu: "M4 7h16M4 12h16M4 17h16",
  chevron: "M9 6l6 6-6 6",
  down: "M6 9l6 6 6-6",
  external: "M7 17L17 7M8 7h9v9",
  logout: "M10 5H5v14h5M15 8l4 4-4 4M19 12H9",
  plus: "M12 5v14M5 12h14",
  pen: "M4 20h4L19 9l-4-4L4 16zM14 6l4 4",
  trend: "M3 17l6-6 4 4 8-8M15 7h6v6",
  chart: "M4 19V9m6 10V5m6 14v-7m4 7H2",
  collapse: "M15 6l-6 6 6 6",
  globe: "M12 21a9 9 0 100-18 9 9 0 000 18zM3 12h18M12 3c2.5 2.5 3.5 5.5 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-5.5-3.5-9s1-6.5 3.5-9z",
  check: "M5 12.5l4.5 4.5L19 7.5",
  copy: "M9 9h11v11H9zM5 15V4h11",
  trash: "M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6",
  reply: "M9 14L4 9l5-5M4 9h10a6 6 0 016 6v3",
  bell: "M6 16V11a6 6 0 1112 0v5l2 2H4zM10 20a2 2 0 004 0",
  arrowUp: "M12 19V5M6 11l6-6 6 6",
  arrowDown: "M12 5v14M6 13l6 6 6-6",
} as const;

export type IconName = keyof typeof paths;

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={paths[name]} />
    </svg>
  );
}
