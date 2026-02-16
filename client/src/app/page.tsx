import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Navbar from "../components/landing-page/Navbar";
import Hero from "../components/landing-page/Hero";
import About from "../components/landing-page/About";

import Pricing from "../components/landing-page/Pricing";
import FAQ from "../components/landing-page/FAQ";
import CTA from "../components/landing-page/Cta";
import Footer from "../components/landing-page/Footer";

export default async function LandingPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }
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