"use client";
import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  CheckSquare,
  Clock,
  BookOpen,
  Heart,
  Calendar,
  Target,
  Coffee,
  Zap,
} from "lucide-react";
import logo from "../../assets/brand/logo-v1.5-white.svg";

// Register GSAP plugin client-side
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const features = [
  { icon: CheckSquare, name: "Tasks", color: "bg-blue-500/20 border-blue-400/30" },
  { icon: Clock, name: "Pomodoro", color: "bg-red-500/20 border-red-400/30" },
  { icon: BookOpen, name: "Journaling", color: "bg-green-500/20 border-green-400/30" },
  { icon: BookOpen, name: "Books", color: "bg-purple-500/20 border-purple-400/30" },
  { icon: Heart, name: "Mood", color: "bg-pink-500/20 border-pink-400/30" },
  { icon: Calendar, name: "Calendar", color: "bg-orange-500/20 border-orange-400/30" },
  { icon: Target, name: "Goals", color: "bg-indigo-500/20 border-indigo-400/30" },
  { icon: Coffee, name: "Breaks", color: "bg-amber-500/20 border-amber-400/30" },
  { icon: Zap, name: "Focus", color: "bg-cyan-500/20 border-cyan-400/30" },
];

export default function Features() {
  const sectionRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<Array<HTMLDivElement | null>>([]);
  const centralBoxRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);

  // Floating particles
  const [particleData, setParticleData] = useState<
    { left: string; top: string; animationDelay: string; animationDuration: string }[]
  >([]);

  useEffect(() => {
    const randomParticles = Array.from({ length: 20 }).map(() => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 3}s`,
      animationDuration: `${2 + Math.random() * 3}s`,
    }));
    setParticleData(randomParticles);
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Initial scatter
      featuresRef.current.forEach((feature, index) => {
        if (!feature) return;
        const angle = (index / features.length) * Math.PI * 2;
        const radius = 300 + Math.random() * 200;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        gsap.set(feature, {
          x,
          y,
          rotation: Math.random() * 360,
          scale: 0.8 + Math.random() * 0.4,
        });
      });

      // Hide central box and logo initially
      gsap.set(centralBoxRef.current, { scale: 0.6, opacity: 0, zIndex: 10 });
      gsap.set(logoRef.current, { scale: 0, rotation: -45, opacity: 0 });

      // ScrollTrigger timeline
      gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
          end: "bottom top",
          scrub: 0.5,
          onUpdate: (self) => {
            const progress = self.progress;

            // Animate features inward
            featuresRef.current.forEach((feature, index) => {
              if (!feature) return;
              const targetAngle = (index / features.length) * Math.PI * 2;
              const targetRadius = 100;
              const targetX = Math.cos(targetAngle) * targetRadius;
              const targetY = Math.sin(targetAngle) * targetRadius;

              gsap.to(feature, {
                x: targetX * (1 - progress),
                y: targetY * (1 - progress),
                rotation: 0,
                scale: 1,
                duration: 0.3,
                ease: "power2.out",
              });
            });

            // Central box animation
            gsap.to(centralBoxRef.current, {
              scale: 0.8 + 0.2 * progress,
              opacity: Math.min(1, progress * 2),
              zIndex: progress > 0.5 ? 20 : 10,
              duration: 0.3,
              ease: "power2.out",
            });

            // Logo animation
            if (progress > 0.6) {
              gsap.to(logoRef.current, {
                scale: 1,
                rotation: 0,
                opacity: 1,
                duration: 0.6,
                ease: "elastic.out(1, 0.4)",
              });
            } else {
              gsap.to(logoRef.current, {
                scale: 0,
                rotation: -45,
                opacity: 0,
                duration: 0.3,
                ease: "power2.in",
              });
            }
          },
        },
      });

      // Hover effects
      featuresRef.current.forEach((featureEl) => {
        if (!featureEl) return;
        const hoverTl = gsap.timeline({ paused: true });
        hoverTl.to(featureEl, {
          scale: 1.1,
          rotation: 5,
          duration: 0.3,
          ease: "power2.out",
        });
        featureEl.addEventListener("mouseenter", () => hoverTl.play());
        featureEl.addEventListener("mouseleave", () => hoverTl.reverse());
      });
    }, sectionRef);

    return () => {
      ctx.revert();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="min-h-screen bg-secondary-black py-20 overflow-hidden relative"
    >
      {/* Heading */}
      <div className="text-center mb-20 relative z-10">
        <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
          All your favourite tools
          <br />
          <span className="text-white/80">in one space.</span>
        </h2>
        <p className="text-xl text-white/60 max-w-2xl mx-auto">
          Everything you need for productivity, focus, and personal growth – unified in a single, intelligent workspace.
        </p>
      </div>

      {/* Animation container */}
      <div
        ref={containerRef}
        className="relative w-full h-[600px] flex items-center justify-center"
      >
        {/* Central box */}
        <div
          ref={centralBoxRef}
          className="absolute w-80 h-80 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center transition-transform duration-300"
        >
          {/* Logo */}
          <div ref={logoRef} className="w-24 h-24 relative">
            <Image src={logo} alt="Logo" fill className="object-contain opacity-90" />
          </div>
        </div>

        {/* Features */}
        {features.map((feature, index) => (
          <div
            key={feature.name}
            ref={(el) => {
              featuresRef.current[index] = el;
            }}
            className={`absolute w-16 h-16 rounded-xl ${feature.color} backdrop-blur-sm border flex items-center justify-center cursor-pointer group transition-all duration-300`}
          >
            <div className="flex flex-col items-center gap-1">
              <feature.icon size={20} className="text-white group-hover:text-white/80" />
              <span className="text-xs text-white/80 font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap absolute -bottom-8">
                {feature.name}
              </span>
            </div>
          </div>
        ))}

        {/* Particles */}
        <div className="absolute inset-0 pointer-events-none">
          {particleData.map((particle, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/20 rounded-full animate-pulse"
              style={{
                left: particle.left,
                top: particle.top,
                animationDelay: particle.animationDelay,
                animationDuration: particle.animationDuration,
              }}
            />
          ))}
        </div>
      </div>

      {/* Bottom text */}
      <div className="text-center mt-20 relative z-10">
        <p className="text-lg text-white/50 max-w-3xl mx-auto">
          Watch as your scattered workflow transforms into a unified productivity powerhouse. Each tool seamlessly integrates to create your perfect digital workspace.
        </p>
      </div>
    </section>
  );
}
