import type { Metadata, Viewport } from "next";
import "./globals.css";
import { siteOrigin } from "@/lib/site";

const origin = siteOrigin();

/**
 * Runs before first paint. Enables the compact cinematic story (CSS is scoped to
 * html[data-cinema] and < 1024 px) only when scripting works and motion is welcome,
 * so the first frame is already the story layout. If the scroll library has not
 * started within 8 s of the first scroll (offline, blocked), fall back to the
 * static layout so no content stays hidden.
 */
const cinemaScript = `(function(){try{var d=document.documentElement;if(!matchMedia("(prefers-reduced-motion: no-preference)").matches)return;d.setAttribute("data-cinema","");var t;addEventListener("scroll",function(){t=t||setTimeout(function(){if(d.getAttribute("data-motion")!=="ready")d.removeAttribute("data-cinema")},8000)},{passive:true})}catch(e){}})()`;

const description =
  "Novahomin engineers websites, web applications, mobile apps, SaaS platforms and AI automation, with SEO and GEO built in.";

export const metadata: Metadata = {
  ...(origin
    ? { metadataBase: new URL(origin), alternates: { canonical: "/" } }
    : {}),
  title: "Novahomin — Engineering intelligent digital products",
  description,
  applicationName: "Novahomin",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Novahomin — Engineering intelligent digital products",
    description,
    type: "website",
    locale: "en_GB",
    siteName: "Novahomin",
  },
  twitter: {
    card: "summary",
    title: "Novahomin — Engineering intelligent digital products",
    description,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#080b10",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-GB" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: cinemaScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
