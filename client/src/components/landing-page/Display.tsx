"use client";
import React from "react";
import Image from "next/image";
import { Play, Zap, Target, Brain } from "lucide-react";
import dashPreview from "../../assets/images/dashboard-preview.png";

export default function Display() {
  return (
    <div className="min-h-screen bg-secondary-black px-2 py-2">
      <div className="w-full min-h-screen rounded-3xl overflow-hidden border border-white/10 backdrop-blur-xl bg-white/5 relative">
        {/* Content */}
        <div className="relative z-10 px-6 md:px-10 py-16">
          {/* Header Section */}
          <div className="text-center mb-16">
            <div className="mb-6 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-white/90 font-medium backdrop-blur-sm inline-flex items-center gap-2">
              <Play size={14} className="text-primary-blue" />
              See it in action
            </div>

            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              Your workspace,
              <br />
              <span className="text-white/90">reimagined</span>
            </h2>

            <p className="text-lg text-white/70 max-w-2xl mx-auto leading-relaxed">
              Experience a dashboard that adapts to your workflow, learns from
              your habits, and evolves with your productivity needs.
            </p>
          </div>

          {/* Dashboard Preview Section */}
          <div className="max-w-7xl mx-auto">
            <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm p-4 md:p-6 mb-16">
              {/* Dashboard Image Container */}
              <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-white/10">
                {/* Placeholder for your dashboard image */}
                <div className="w-full h-full bg-gradient-to-br from-primary-blue/20 to-purple-500/20 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-white/10 flex items-center justify-center">
                      <Brain size={32} className="text-white/70" />
                    </div>
                    <p className="text-white/60 text-sm">
                      Your dashboard image goes here
                    </p>
                    <p className="text-white/40 text-xs mt-1">
                      Replace this div with your Image component
                    </p>
                  </div>
                </div>

                <Image
                  src={dashPreview}
                  alt="Productivity Dashboard"
                  fill
                  className="object-cover"
                />
              </div>

              {/* Dashboard stats overlay */}
              <div className="absolute top-8 right-8 flex gap-3">
                <div className="px-3 py-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-white/90 text-sm font-medium">
                      Live
                    </span>
                  </div>
                </div>

                <div className="px-3 py-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/10">
                  <span className="text-white/90 text-sm font-medium">
                    v2.1
                  </span>
                </div>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {/* Feature 1 */}
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="w-12 h-12 rounded-xl bg-primary-blue/20 flex items-center justify-center mb-4">
                  <Zap size={24} className="text-primary-blue" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  Intelligent Automation
                </h3>
                <p className="text-white/70 leading-relaxed">
                  Smart workflows that learn your patterns and automate
                  repetitive tasks, letting you focus on what matters most.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4">
                  <Target size={24} className="text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  Goal-Driven Design
                </h3>
                <p className="text-white/70 leading-relaxed">
                  Every element is crafted to support your objectives, with
                  clear progress tracking and milestone celebrations.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-4">
                  <Brain size={24} className="text-emerald-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  Adaptive Interface
                </h3>
                <p className="text-white/70 leading-relaxed">
                  The dashboard evolves with your habits, surfacing relevant
                  information when you need it most.
                </p>
              </div>
            </div>

            {/* Bottom CTA */}
            <div className="text-center mt-16">
              <div className="mb-6">
                <p className="text-white/60 text-base">
                  Ready to transform your productivity?
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
                <button className="relative px-8 py-4 rounded-full bg-primary-blue text-white font-semibold text-base hover:bg-primary-blue-hover transition-all duration-300 ease-out border border-primary-blue/30">
                  <span className="absolute inset-0 rounded-full ring-2 ring-primary-blue/20 animate-pulse pointer-events-none"></span>
                  <span className="relative z-10">
                    Experience the dashboard
                  </span>
                </button>

                <button className="px-6 py-4 rounded-full border border-white/20 text-white/80 font-medium text-base hover:bg-white/5 hover:text-white hover:border-white/30 transition-all duration-300">
                  Watch demo
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}