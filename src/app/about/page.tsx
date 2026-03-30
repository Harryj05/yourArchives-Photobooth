import AboutSection from "@/components/sections/AboutSection";

export const metadata = {
  title: "About | yourArchives",
  description: "Learn more about the philosophy behind yourArchives.",
};

export default function AboutPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center pt-24 pb-12">
      <AboutSection />
    </main>
  );
}
