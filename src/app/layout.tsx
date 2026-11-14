import type { Metadata } from "next";
import { Playfair_Display } from "next/font/google";
import "./globals.css";
import { ready } from "@/lib/db";
import { getBranding, getSettings } from "@/lib/content";
import { pageUrl } from "@/lib/utils";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-playfair",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  try {
    await ready();
    const settings = await getSettings();
    const branding = await getBranding();
    return {
      metadataBase: new URL(pageUrl()),
      title: { default: settings.seo_title || "AJ Classes", template: "%s · AJ Classes" },
      description: settings.seo_description,
      icons: { icon: branding.favicon || "/icon.svg" },
      openGraph: { title: settings.seo_title || "AJ Classes", description: settings.seo_description, url: pageUrl(), siteName: "AJ Classes", type: "website" },
      alternates: { canonical: pageUrl() },
    };
  } catch {
    return { title: "AJ Classes", description: "AJ Classes" };
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={playfair.variable} data-scroll-behavior="smooth">
      <body className={`${playfair.className} antialiased`}>{children}</body>
    </html>
  );
}
