import type { Metadata, Viewport } from "next";
import { Geist_Mono, Inter, Space_Grotesk } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Providers } from "./providers";
import { SiteHeader } from "@/components/layout/site-header";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const inter = Inter({ variable: "--font-sans", subsets: ["latin"] });
const grotesk = Space_Grotesk({ variable: "--font-heading", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "RealEstate — Buy verified land in Ghana, right on the map",
    template: "%s · RealEstate",
  },
  description:
    "Ghana's trust-first land marketplace. Browse satellite maps, select the exact plots you want, verify titles and buy with escrow protection — from Accra to Tamale.",
  keywords: ["land for sale Ghana", "buy plot Accra", "verified land", "escrow land purchase", "Ghana real estate"],
  openGraph: {
    title: "RealEstate — Buy verified land in Ghana",
    description: "Select the exact plot you want on a live satellite map and buy with escrow protection.",
    type: "website",
    locale: "en_GH",
    siteName: "RealEstate",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf9f6" },
    { media: "(prefers-color-scheme: dark)", color: "#131a16" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${inter.variable} ${grotesk.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col overflow-x-hidden">
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <SiteHeader />
            <div className="flex-1">{children}</div>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
