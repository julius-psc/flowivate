import Navbar from "../components/landing-page/Navbar";
import Hero from "../components/landing-page/Hero";
import About from "../components/landing-page/About";

import Pricing from "../components/landing-page/Pricing";
import FAQ from "../components/landing-page/FAQ";
import CTA from "../components/landing-page/Cta";
import Footer from "../components/landing-page/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen w-full bg-[#121212]">
      <Navbar />
      <Hero />
      <About />
      <Pricing />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
}