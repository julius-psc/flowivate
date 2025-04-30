"use client";

import { useState } from "react";
import { toast } from "sonner"; // Import Sonner toast

export default function Affirmations() {
  const [affirmations, setAffirmations] = useState<string[]>([
    "I am focused and resilient.",
    "Every day, I grow stronger and wiser.",
    "I create my future through my actions.",
  ]);
  const [newAffirmation, setNewAffirmation] = useState("");

  const addAffirmation = () => {
    const trimmedAffirmation = newAffirmation.trim();
    if (trimmedAffirmation) {
      setAffirmations([...affirmations, trimmedAffirmation]);
      setNewAffirmation("");
      // Optional: Add success toast if desired
      // toast.success("Affirmation added!");
    } else {
      // Show warning if input is empty or only whitespace
      toast.warning("Affirmation cannot be empty.");
    }
  };

  // Handle Enter key press in input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      addAffirmation();
    }
  };

  return (
    <div className="relative p-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-xl border border-slate-200/50 dark:border-zinc-800/50 flex flex-col overflow-hidden">
      <h1 className="text-sm text-secondary-black dark:text-secondary-white opacity-40 mb-4">
        AFFIRMATIONS
      </h1>
      {/* Use max-h-[calc(100%-Xrem)] and overflow-auto if list can get long */}
      <div className="flex flex-col gap-2 overflow-auto flex-grow mb-4">
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
      <div className="mt-auto flex gap-2 flex-shrink-0">
        {" "}
        {/* Use mt-auto to push to bottom */}
        <input
          type="text"
          placeholder="Add affirmation..."
          value={newAffirmation}
          onChange={(e) => setNewAffirmation(e.target.value)}
          onKeyDown={handleKeyDown} // Added keydown handler
          className="flex-1 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white/70 dark:bg-zinc-800/70 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 dark:focus:ring-primary/30 text-black dark:text-white" // Added text colors
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