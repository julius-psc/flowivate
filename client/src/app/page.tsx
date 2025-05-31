import Hero from '../components/landing-page/Hero';
import Features from '../components/landing-page/Features'

export default function LandingPage() {
  return (
    <div className="h-screen w-screen bg-secondary-black">
      <Hero />
      <Features />
    </div>
  );
}