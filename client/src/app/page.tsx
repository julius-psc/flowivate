import Hero from '../components/landing-page/Hero';
import Features from '../components/landing-page/Features'
import Display from '../components/landing-page/Display'

export default function LandingPage() {
  return (
    <div className="h-screen w-screen bg-secondary-black">
      <Hero />
      <Features />
      <Display />
    </div>
  );
}