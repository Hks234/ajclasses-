import type { Metadata } from "next";
import { Inter, Manrope, Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ready } from "@/lib/db";
import { getBranding, getSettings } from "@/lib/content";
import { pageUrl } from "@/lib/utils";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

export async function generateMetadata(): Promise<Metadata> {
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
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} ${inter.variable} ${jakarta.variable} ${playfair.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}
