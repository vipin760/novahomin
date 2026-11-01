import type { Metadata, Viewport } from "next";
import "./globals.css";
import { siteOrigin } from "@/lib/site";

const origin = siteOrigin();

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
    <html lang="en-GB">
      <body>{children}</body>
    </html>
  );
}
