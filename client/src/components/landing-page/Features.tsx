"use client";
import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Brain,
  CheckSquare,
  Timer,
  Hourglass,
  Music,
  Heart,
  Cloud,
  Moon,
  Droplet,
  BookOpen,
  Feather,
  Sun,
} from "lucide-react";
import logo from "../../assets/brand/logo-v1.5-white.svg";

// Register GSAP plugin client-side
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const features = [
  {
    icon: Brain,
    name: "AI Assistant",
    color: "bg-purple-500/20 border-purple-400/30",
  },
  {
    icon: CheckSquare,
    name: "Tasks",
    color: "bg-blue-500/20 border-blue-400/30",
  },
  { icon: Timer, name: "Pomodoro", color: "bg-red-500/20 border-red-400/30" },
  {
    icon: Hourglass,
    name: "Deep Work",
    color: "bg-indigo-500/20 border-indigo-400/30",
  },
  {
    icon: Music,
    name: "Ambient Sounds",
    color: "bg-green-500/20 border-green-400/30",
  },
  {
    icon: Cloud,
    name: "Meditation",
    color: "bg-teal-500/20 border-teal-400/30",
  },
  {
    icon: Sun,
    name: "Affirmations",
    color: "bg-yellow-500/20 border-yellow-400/30",
  },
  { icon: Heart, name: "Mood", color: "bg-pink-500/20 border-pink-400/30" },
  {
    icon: Moon,
    name: "Sleep Tracker",
    color: "bg-gray-500/20 border-gray-400/30",
  },
  {
    icon: Droplet,
    name: "Water Tracker",
    color: "bg-sky-500/20 border-sky-400/30",
  },
  {
    icon: Feather,
    name: "Journaling",
    color: "bg-orange-500/20 border-orange-400/30",
  },
  {
    icon: BookOpen,
    name: "Book Tracking",
    color: "bg-lime-500/20 border-lime-400/30",
  },
];

export default function Features() {
  const sectionRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<Array<HTMLDivElement | null>>([]);
  const centralBoxRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);

  // Floating particles
  const [particleData, setParticleData] = useState<
    {
      left: string;
      top: string;
      animationDelay: string;
      animationDuration: string;
    }[]
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
      // Calculate initial scattered positions with more spread
      const scatteredPositions = features.map((_, index) => {
        const angle = (index / features.length) * Math.PI * 2;
        const radius = 200 + Math.random() * 100; // More spread
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        return {
          x,
          y,
          rotation: Math.random() * 360,
          scale: 0.6 + Math.random() * 0.4,
        };
      });

      // Calculate final circular positions
      const finalPositions = features.map((_, index) => {
        const angle = (index / features.length) * Math.PI * 2;
        const radius = 120; // Consistent radius for final circle
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        return { x, y, rotation: 0, scale: 1 };
      });

      // Set initial positions
      featuresRef.current.forEach((feature, index) => {
        if (!feature) return;
        gsap.set(feature, {
          x: scatteredPositions[index].x,
          y: scatteredPositions[index].y,
          rotation: scatteredPositions[index].rotation,
          scale: scatteredPositions[index].scale,
          opacity: 0.7,
        });
      });

      // Hide central elements initially
      gsap.set(centralBoxRef.current, {
        scale: 0.3,
        opacity: 0,
        zIndex: 10,
        filter: "blur(10px)",
      });
      gsap.set(logoRef.current, {
        scale: 0,
        rotation: -90,
        opacity: 0,
      });

      // Create main timeline with enhanced scroll trigger
      const mainTl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "+=150%", // Longer scroll distance for smoother animation
          pin: true,
          scrub: 0.5, // Slower scrub for smoother feel
          anticipatePin: 1,
          invalidateOnRefresh: true, // Recalculate on resize
          onUpdate: (self) => {
            // Optional: Add progress-based effects
            const progress = self.progress;
            if (containerRef.current) {
              containerRef.current.style.transform = `scale(${
                0.95 + progress * 0.05
              })`;
            }
          },
        },
      });

      // Stage 1: Gather features (0-60% of scroll)
      mainTl.to(
        featuresRef.current,
        {
          x: (i) => finalPositions[i].x,
          y: (i) => finalPositions[i].y,
          rotation: (i) => finalPositions[i].rotation,
          scale: (i) => finalPositions[i].scale,
          opacity: 1,
          duration: 0.6,
          ease: "power2.out",
          stagger: 0.02, // Slight stagger for more organic feel
        },
        0
      );

      // Stage 2: Reveal central box (20-80% of scroll)
      mainTl.to(
        centralBoxRef.current,
        {
          scale: 1,
          opacity: 1,
          filter: "blur(0px)",
          duration: 0.4,
          ease: "power2.out",
        },
        0.2
      );

      // Stage 3: Animate logo (40-100% of scroll)
      mainTl.to(
        logoRef.current,
        {
          scale: 1,
          rotation: 0,
          opacity: 1,
          duration: 0.4,
          ease: "elastic.out(1, 0.3)",
        },
        0.4
      );

      // Stage 4: Final polish - subtle breathing effect
      mainTl.to(
        centralBoxRef.current,
        {
          scale: 1.05,
          duration: 0.2,
          ease: "power2.inOut",
          yoyo: true,
          repeat: 1,
        },
        0.8
      );

      // Enhanced hover effects with better performance
      featuresRef.current.forEach((featureEl) => {
        if (!featureEl) return;

        const hoverTl = gsap.timeline({ paused: true });
        hoverTl.to(featureEl, {
          scale: 1.15,
          rotation: 8,
          y: -5,
          duration: 0.3,
          ease: "power2.out",
        });

        const onMouseEnter = () => {
          hoverTl.restart();
        };

        const onMouseLeave = () => {
          hoverTl.reverse();
        };

        featureEl.addEventListener("mouseenter", onMouseEnter);
        featureEl.addEventListener("mouseleave", onMouseLeave);

        // Cleanup function
        return () => {
          featureEl.removeEventListener("mouseenter", onMouseEnter);
          featureEl.removeEventListener("mouseleave", onMouseLeave);
        };
      });

      // Refresh ScrollTrigger on window resize
      const handleResize = () => {
        ScrollTrigger.refresh();
      };

      window.addEventListener("resize", handleResize);

      // Cleanup
      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }, sectionRef);

    return () => {
      ctx.revert();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="min-h-screen bg-secondary-black py-8 overflow-hidden relative"
    >
      {/* Heading */}
      <div className="text-center mb-20 relative z-10">
        <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
          All your favourite tools
          <br />
          <span className="text-white/80">in one space.</span>
        </h2>
        <p className="text-xl text-white/60 max-w-2xl mx-auto">
          Everything you need for productivity, focus, and personal growth –
          unified in a single, intelligent workspace.
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
          className="absolute w-80 h-80 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center transition-all duration-300 shadow-2xl"
        >
          {/* Logo */}
          <div ref={logoRef} className="w-24 h-24 relative">
            <Image
              src={logo}
              alt="Logo"
              fill
              className="object-contain opacity-90"
            />
          </div>
        </div>

        {/* Features */}
        {features.map((feature, index) => (
          <div
            key={feature.name}
            ref={(el) => {
              featuresRef.current[index] = el;
            }}
            className={`absolute w-16 h-16 rounded-xl ${feature.color} backdrop-blur-sm border flex items-center justify-center cursor-pointer group transition-all duration-300 shadow-lg`}
          >
            <div className="flex flex-col items-center gap-1">
              <feature.icon
                size={20}
                className="text-white group-hover:text-white/80 transition-colors"
              />
              <span className="text-xs text-white/80 font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap absolute -bottom-8 bg-black/50 px-2 py-1 rounded backdrop-blur-sm">
                {feature.name}
              </span>
            </div>
          </div>
        ))}

        {/* Enhanced Particles */}
        <div className="absolute inset-0 pointer-events-none">
          {particleData.map((particle, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-gradient-to-r from-white/20 to-white/10 rounded-full animate-pulse"
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
    </section>
  );
}

