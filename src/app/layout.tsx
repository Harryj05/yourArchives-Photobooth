import type { Metadata } from "next";
import { Playfair_Display, DM_Sans, Cormorant_Garamond } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  weight: ["400", "700", "900"],
  style: ["normal", "italic"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
  weight: ["300", "400", "500"],
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  display: "swap",
  weight: ["300", "400", "600"],
  style: ["normal", "italic"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "yourArchives — Preserve Your Memories Forever",
  description:
    "A premium digital photobooth that preserves memories, media, and personal history in beautiful interactive archives. Cinematic. Nostalgic. Timeless.",
  keywords: ["digital archives", "memory preservation", "photo archives", "personal history", "media vault", "photobooth"],
  manifest: "/manifest.json",
  applicationName: "yourArchives",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "yourArchives" },
  formatDetection: { telephone: false },
  openGraph: {
    title: "yourArchives — Preserve Your Memories Forever",
    description: "A digital photobooth that preserves memories in beautiful interactive archives.",
    type: "website",
    images: ["/icons/og.png"],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#1c1c1c",
};

import CustomCursor from "@/components/CustomCursor";
import Navbar from "@/components/Navbar";
import PageTransition from "@/components/PageTransition";
import ErrorBoundary from "@/components/ErrorBoundary";
import Footer from "@/components/Footer";
import InstallPrompt from "@/components/InstallPrompt";
import { AuthProvider } from "@/context/AuthContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${dmSans.variable} ${cormorant.variable}`}>
      <body className="antialiased font-serif bg-[#E5E5E5] w-full h-full overflow-hidden text-zinc-900">
        <AuthProvider>
          <CustomCursor />

          {/* Consistent Silvery Background - Persistent at Root level */}
          <div
            className="fixed inset-0 z-[-1] pointer-events-none"
            style={{
              background: 'radial-gradient(circle at center, #FCFCFC 0%, #F5F5F5 40%, #E5E5E5 100%)'
            }}
          />

          <Navbar />

          <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[9999] focus:p-4 focus:bg-white">
            Skip to main content
          </a>

          <ErrorBoundary>
            <main id="main-content" className="relative w-full h-full overflow-hidden">
              <PageTransition>
                {children}
              </PageTransition>
              <Footer />
            </main>
          </ErrorBoundary>

          {/* Film Grain (Global Studio Texture) */}
          <div className="studio-overlay film-grain" style={{ pointerEvents: 'none' }} />

          {/* Mobile install banner — only shows on user's 2nd+ visit */}
          <InstallPrompt />
        </AuthProvider>
      </body>
    </html>
  );
}



