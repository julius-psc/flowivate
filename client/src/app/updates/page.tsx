"use client";
import Navbar from "@/components/landing-page/Navbar";
import Footer from "@/components/landing-page/Footer";
import React from "react";

// Types
type UpdateTag = "AI" | "Performance" | "Reasoning" | "Multi-modal" | "UI/UX" | "Fix";

interface UpdateFeature {
  text: string;
  detail?: string;
}

interface Update {
  version: string;
  date: string;
  title: string;
  description?: string;
  tags: UpdateTag[];
  features?: UpdateFeature[];
  fixes?: string[];
  codeSnippet?: {
    language: string;
    code: string;
  };
}

// Changelog Data
const updates: Update[] = [
  {
    version: "1.0",
    date: "January 3, 2026",
    title: "Flowivate Launch",
    tags: ["AI", "UI/UX", "Performance"],
    features: [
      { text: "Meet Lumo,", detail: "your AI-powered productivity companion" },
      { text: "Focus Suite,", detail: "deep work timers, ambient sounds, and distraction blocking" },
      { text: "Radically Modular,", detail: "customize your workspace exactly how you need it" },
      { text: "Visual Momentum,", detail: "track your progress with beautiful, motivating dashboards" },
    ],
  },
  {
    version: "0.9-beta",
    date: "December 20, 2025",
    title: "API & Developer Tools",
    tags: ["Performance"],
    codeSnippet: {
      language: "typescript",
      code: `// Initialize Flowivate client
import { Flowivate } from '@flowivate/sdk';

const client = new Flowivate({
  apiKey: process.env.FLOWIVATE_API_KEY,
});

await client.focus.startSession({ duration: 25 });`
    },
    features: [
      { text: "Public API,", detail: "integrate Flowivate into your existing tools" },
      { text: "Webhooks,", detail: "real-time notifications for focus sessions" },
      { text: "SDK for TypeScript,", detail: "type-safe client library" },
    ],
  },
];

export default function UpdatesPage() {
  return (
    <div className="min-h-screen bg-[#121212] text-white antialiased">
      <Navbar />

      <main className="max-w-3xl mx-auto px-6 pt-40 pb-32">

        {/* Header */}
        <header className="mb-24">
          <h1 className="text-[2.5rem] font-semibold tracking-[-0.02em] text-white mb-3">
            Changelog
          </h1>
        </header>

        {/* Updates List */}
        <div className="space-y-0">
          {updates.map((update, idx) => {
            const isLatest = idx === 0;

            return (
              <article
                key={idx}
                className={`relative grid grid-cols-[140px_1fr] gap-12 pb-16 mb-16 border-b border-zinc-800/50 last:border-b-0 last:mb-0 last:pb-0`}
              >

                {/* Left: Date & Version */}
                <div className="pt-0.5">
                  <time className="block text-sm text-zinc-500 mb-2">{update.date}</time>
                  <span className={`text-sm font-medium ${isLatest ? 'text-primary-blue' : 'text-white'}`}>
                    {update.version}
                  </span>
                </div>

                {/* Right: Content */}
                <div>
                  {/* Title Row with Dot */}
                  <div className="flex items-center gap-4 mb-5">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isLatest ? 'bg-primary-blue' : 'bg-white'}`} />
                    <h2 className={`text-xl font-semibold tracking-[-0.01em] ${isLatest ? 'text-white' : 'text-zinc-200'}`}>
                      {update.title}
                    </h2>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-6 ml-6">
                    {update.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 rounded-md text-xs font-medium bg-zinc-800 text-zinc-400"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Description */}
                  {update.description && (
                    <p className="text-zinc-400 text-[15px] leading-relaxed mb-6 ml-6">
                      {update.description}
                    </p>
                  )}

                  {/* Code Snippet */}
                  {update.codeSnippet && (
                    <div className="mb-8 ml-6 rounded-lg overflow-hidden border border-zinc-800 bg-[#0d0d0d]">
                      <div className="px-4 py-2.5 border-b border-zinc-800 flex items-center justify-between">
                        <span className="text-xs text-zinc-600 font-mono">{update.codeSnippet.language}</span>
                        <div className="flex gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-zinc-700" />
                          <div className="w-2 h-2 rounded-full bg-zinc-700" />
                          <div className="w-2 h-2 rounded-full bg-zinc-700" />
                        </div>
                      </div>
                      <div className="p-4 overflow-x-auto">
                        <pre className="font-mono text-[13px] text-zinc-400 leading-relaxed">
                          <code>{update.codeSnippet.code}</code>
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Features List */}
                  {update.features && update.features.length > 0 && (
                    <div className="mb-6 ml-6">
                      <ul className="space-y-2.5">
                        {update.features.map((feature, i) => (
                          <li key={i} className="text-[15px] leading-relaxed">
                            <span className="mr-2 text-zinc-600">•</span>
                            <span className="text-white font-medium">{feature.text}</span>
                            {feature.detail && (
                              <span className="text-zinc-500"> {feature.detail}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Fixes List */}
                  {update.fixes && update.fixes.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-zinc-800/50 ml-6">
                      <h3 className="text-xs font-medium text-zinc-600 uppercase tracking-wider mb-4">Bug Fixes</h3>
                      <ul className="space-y-2">
                        {update.fixes.map((fix, i) => (
                          <li key={i} className="flex items-baseline text-[14px] text-zinc-500">
                            <span className="mr-3 text-zinc-600">•</span>
                            <span>{fix}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                </div>
              </article>
            );
          })}
        </div>
      </main>

      <Footer />
    </div>
  );
}
