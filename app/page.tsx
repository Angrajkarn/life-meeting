import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/hero";
import { Features } from "@/components/features";
import { VisualFeatures } from "@/components/visual-features";
import { Stats } from "@/components/stats";
import { Footer } from "@/components/footer";
import { Preloader } from "@/components/preloader";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#e0e0ff] dark:bg-[#1a1a2e] text-slate-900 overflow-x-hidden selection:bg-primary/30">
      <Preloader />
      <Navbar />

      {/* Hero Section */}
      <Hero />

      {/* Live Stats */}


      {/* Visual Features Showcase */}
      <VisualFeatures />

      {/* Features Bento Grid */}
      <div id="features">
        <Features />
      </div>

      {/* CTA Section */}


      {/* Footer */}
      <Footer />
    </main>
  );
}
