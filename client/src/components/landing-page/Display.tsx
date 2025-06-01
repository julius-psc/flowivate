"use client";
import React from "react";
import { Clock, TrendingUp, CheckCircle, Brain, Target, Zap } from "lucide-react";
import dashbPreview from "../../assets/images/dashboard-preview.png";

export default function Display() {
  return (
    <div className="min-h-screen bg-slate-900 px-2 py-2">
      <div className="w-full min-h-screen rounded-3xl overflow-hidden border border-white/10 backdrop-blur-xl bg-white/5 relative">
        {/* Content */}
        <div className="relative z-10 px-6 md:px-10 py-16">
          {/* Header Section */}
          <div className="text-center mb-16">
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
            <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm p-2 mb-16">
              {/* Dashboard Image Container */}
              <div className="relative w-full h-96 rounded-xl overflow-hidden">
                <img 
                  src={dashbPreview} 
                  alt="Dashboard Preview" 
                  className="w-full h-full object-cover"
                />
                {/* Overlay gradient for better text readability if needed */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
            </div>

            {/* Science-Backed Section - Simplified */}
            <div className="text-center mb-16">
              <h3 className="text-3xl font-bold text-white mb-8">
                Science-Backed Design
              </h3>

              <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-white/10 backdrop-blur-sm group hover:bg-white/10 transition-all duration-300">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Brain size={32} className="text-blue-400" />
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-3">
                    Habit Formation
                  </h4>
                  <p className="text-white/70 text-sm leading-relaxed">
                    Built on proven behavioral science to create lasting habits through smart cue-reward loops.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-white/10 backdrop-blur-sm group hover:bg-white/10 transition-all duration-300">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Target size={32} className="text-emerald-400" />
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-3">
                    Focus Research
                  </h4>
                  <p className="text-white/70 text-sm leading-relaxed">
                    Uses cognitive load theory to optimize your workflow and reduce mental fatigue.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-white/10 backdrop-blur-sm group hover:bg-white/10 transition-all duration-300">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Zap size={32} className="text-purple-400" />
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-3">
                    Positive Psychology
                  </h4>
                  <p className="text-white/70 text-sm leading-relaxed">
                    Integrates wellbeing research to boost motivation and track meaningful progress.
                  </p>
                </div>
              </div>
            </div>

            {/* Productivity Metrics */}
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-8">
                Built for Results
              </h3>

              <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-white/10 backdrop-blur-sm group hover:bg-white/10 transition-all duration-300">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Clock size={32} className="text-blue-400" />
                  </div>
                  <div className="text-3xl font-bold text-white mb-2">40%</div>
                  <div className="text-white/90 font-medium mb-1">
                    Time Efficiency
                  </div>
                  <p className="text-white/60 text-sm">
                    Average improvement in task completion speed
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-white/10 backdrop-blur-sm group hover:bg-white/10 transition-all duration-300">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <CheckCircle size={32} className="text-emerald-400" />
                  </div>
                  <div className="text-3xl font-bold text-white mb-2">85%</div>
                  <div className="text-white/90 font-medium mb-1">
                    Goal Success Rate
                  </div>
                  <p className="text-white/60 text-sm">
                    Users who achieve their monthly objectives
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-white/10 backdrop-blur-sm group hover:bg-white/10 transition-all duration-300">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <TrendingUp size={32} className="text-purple-400" />
                  </div>
                  <div className="text-3xl font-bold text-white mb-2">3.2x</div>
                  <div className="text-white/90 font-medium mb-1">
                    Productivity Boost
                  </div>
                  <p className="text-white/60 text-sm">
                    Average increase in daily output
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}