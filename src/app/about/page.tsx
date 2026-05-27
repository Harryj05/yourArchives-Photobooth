import type { Metadata } from "next";
import AboutSection from "@/components/sections/AboutSection";
import ScrollablePage from "@/components/ScrollablePage";

export const metadata: Metadata = {
  title: "About — yourArchives",
  description: "The story behind yourArchives — a digital photobooth made to preserve memories with elegance.",
  openGraph: {
    title: "About — yourArchives",
    description: "The story behind yourArchives — a digital photobooth made to preserve memories with elegance.",
    type: "article",
    images: ["/icons/og.png"],
  },
};

export default function AboutPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center pt-24 pb-12">
      <ScrollablePage />
      <AboutSection />
    </main>
  );
}
