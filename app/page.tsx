import { DemoStats } from "@/components/landing/DemoStats";
import { FeatureCards } from "@/components/landing/FeatureCards";
import { Hero } from "@/components/landing/Hero";
import { ProblemSection } from "@/components/landing/ProblemSection";

export default function HomePage() {
  return (
    <div className="pb-10">
      <Hero />
      <div className="section-wrap section-band space-y-12">
        <ProblemSection />
        <FeatureCards />
      </div>
      <DemoStats />
    </div>
  );
}
