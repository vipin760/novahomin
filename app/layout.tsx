import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import "lenis/dist/lenis.css";
import "./globals.css";
import { Motion } from "@/components/motion";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { motionScript } from "@/lib/motion-script";
import { siteOrigin } from "@/lib/site";

/** Same typeface as the Finvelle reference: Manrope for headings and body. */
const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-manrope",
  display: "swap",
});

const origin = siteOrigin();

const description =
  "Novahomin engineers websites, web applications, mobile apps, SaaS platforms and AI automation, with SEO and GEO built in.";

export const metadata: Metadata = {
  ...(origin ? { metadataBase: new URL(origin), alternates: { canonical: "./" } } : {}),
  title: {
    default: "Novahomin — Build your digital products with confidence",
    template: "%s — Novahomin",
  },
  description,
  applicationName: "Novahomin",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Novahomin — Build your digital products with confidence",
    description,
    type: "website",
    locale: "en_GB",
    siteName: "Novahomin",
  },
  twitter: {
    card: "summary",
    title: "Novahomin — Build your digital products with confidence",
    description,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f9f6f3",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={manrope.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: motionScript }} />
      </head>
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <Suspense fallback={null}>
          <SiteHeader />
        </Suspense>
        <main id="main">{children}</main>
        <SiteFooter />
        <Suspense fallback={null}>
          <Motion />
        </Suspense>
      </body>
    </html>
  );
}
