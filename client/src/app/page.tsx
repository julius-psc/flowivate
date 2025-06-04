import Hero from '../components/landing-page/Hero';
import Features from '../components/landing-page/Features'
import Pricing from '../components/landing-page/Pricing'
import Footer from '../components/landing-page/Footer'


export default function LandingPage() {
  return (
    <div className="h-screen w-screen bg-secondary-black">
      <Hero />
      <Features />
      <Pricing />
      <Footer />
    </div>
  );
}