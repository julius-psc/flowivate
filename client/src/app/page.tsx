import Hero from '../components/landing-page/Hero';
import Features from '../components/landing-page/Features'
import Pricing from '../components/landing-page/Pricing'
import Footer from '../components/landing-page/Footer'
import Preview from '../components/landing-page/Preview'

export default function LandingPage() {
  return (
    <div className="min-h-screen w-full bg-secondary-black overflow-x-hidden">
      <Hero />
      <Features />
      <Preview />
      <Pricing />
      <Footer />
    </div>
  );
}