import React from "react";
import Image from "next/image";
import deskPreview from "../../../public/assets/illustrations/desktop-preview.png";

export default function Preview({ className = "" }: { className?: string }) {
  return (
    <section
      className={`relative w-full max-w-7xl mx-auto px-4 py-24 ${className}`}
    >
      {/* Header content */}
      <div className="text-center mb-12 max-w-3xl mx-auto">
        <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 text-center">
          Your Dashboard
          <br />
          <span className="text-white/80">designed around your lifestyle.</span>
        </h2>
        <p className="text-xl text-white/60 max-w-2xl mx-auto text-center">
          Customize your space with modular widgets, habit tracking, smart AI
          tools, and more – everything you need to stay focused and grow, your
          way.
        </p>
      </div>

      {/* Dashboard Preview */}
      <div className="relative mb-16">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-green-400/20 rounded-2xl blur-xl z-0" />

        {/* Image */}
        <div className="relative border-8 border-secondary-white/5 rounded-2xl overflow-hidden z-10 shadow-xl">
          <Image
            src={deskPreview}
            alt="Flowivate Dashboard Preview"
            width={1400}
            height={900}
            className="w-full h-auto"
          />
        </div>
      </div>

      {/* Feature highlights */}
      <div className="grid md:grid-cols-3 gap-8 text-center max-w-5xl mx-auto">
        {[
          {
            title: "Modular Widgets",
            desc: "Enable only what you need — task tracker, timers, journals, and more.",
          },
          {
            title: "AI-Powered Insights",
            desc: "Flowivate learns your habits to guide better focus and wellness.",
          },
          {
            title: "Tailored for You",
            desc: "Theme it. Move it. Customize it. This dashboard evolves with your goals.",
          },
        ].map(({ title, desc }) => (
          <div key={title}>
            <h3 className="text-xl font-semibold text-secondary-white mb-2">
              {title}
            </h3>
            <p className="text-secondary-white/60">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
