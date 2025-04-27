"use client";

import { useState } from "react";

export default function Affirmations() {
  const [affirmations, setAffirmations] = useState<string[]>([
    "I am focused and resilient.",
    "Every day, I grow stronger and wiser.",
    "I create my future through my actions.",
  ]);
  const [newAffirmation, setNewAffirmation] = useState("");

  const addAffirmation = () => {
    if (newAffirmation.trim()) {
      setAffirmations([...affirmations, newAffirmation.trim()]);
      setNewAffirmation("");
    }
  };

  return (
    <div className="relative p-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-xl border border-slate-200/50 dark:border-zinc-800/50 flex flex-col overflow-hidden">
      <h1 className="text-sm text-secondary-black dark:text-secondary-white opacity-40 mb-4">
        AFFIRMATIONS
      </h1>
      <div className="flex flex-col gap-2 overflow-auto">
        {affirmations.map((affirmation, index) => (
          <div
            key={index}
            className="text-sm text-black/70 dark:text-white/70 flex items-start gap-2"
          >
            <span className="text-slate-400 dark:text-zinc-500">•</span>
            <span>{affirmation}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <input
          type="text"
          placeholder="Add affirmation..."
          value={newAffirmation}
          onChange={(e) => setNewAffirmation(e.target.value)}
          className="flex-1 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white/70 dark:bg-zinc-800/70 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 dark:focus:ring-primary/30"
        />
        <button
          onClick={addAffirmation}
          className="rounded-lg bg-primary text-white text-sm px-3 py-1 hover:bg-primary/90 transition"
        >
          Add
        </button>
      </div>
    </div>
  );
}
