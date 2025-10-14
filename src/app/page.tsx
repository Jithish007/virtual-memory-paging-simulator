import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import TheorySection from "@/components/TheorySection";
import SimulatorSection from "@/components/SimulatorSection";
import ResultsSection from "@/components/ResultsSection";
import AboutSection from "@/components/AboutSection";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
      <TheorySection />
      <SimulatorSection />
      <ResultsSection />
      <AboutSection />
      
      <footer className="bg-primary/5 border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-muted-foreground">
            © 2024 Virtual Memory & Paging Simulator. Computer Organization and Architecture Project.
          </p>
        </div>
      </footer>
    </div>
  );
}