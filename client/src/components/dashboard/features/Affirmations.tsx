"use client";

import { useState, useEffect, FormEvent, useRef } from "react";
import { toast } from "sonner";
import { X, Plus } from "lucide-react";

// --- Skeleton Component for Affirmations ---
// (Paste the AffirmationsSkeleton component code from above here)
const AffirmationsSkeleton = () => {
  return (
    // Mimic the main container styles + add animate-pulse
    <div className="relative p-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-xl border border-slate-200/50 dark:border-zinc-800/50 flex flex-col overflow-hidden h-full animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        {/* Title placeholder */}
        <div className="h-3 w-20 bg-gray-200 dark:bg-zinc-700 rounded"></div>
        {/* 'New' button placeholder */}
        <div className="h-5 w-10 bg-gray-200 dark:bg-zinc-700 rounded-md"></div>
      </div>

      {/* List Area Skeleton */}
      <div className="flex-grow overflow-y-auto mb-4 space-y-2">
        {/* Placeholder for multiple affirmation items */}
        {[...Array(3)].map((_, index) => (
          <div
            key={index}
            className="flex items-center justify-between px-3 py-1 rounded-lg min-h-[32px]"
          >
            <div className="flex items-center gap-3 flex-1">
              {/* Bullet placeholder */}
              <div className="h-2 w-2 bg-gray-300 dark:bg-zinc-600 rounded-full"></div>
              {/* Text placeholder */}
              <div className="h-3 flex-1 bg-gray-200 dark:bg-zinc-700 rounded mr-6"></div>{" "}
              {/* mr-6 leaves space for potential hidden X */}
            </div>
            {/* No need for X button placeholder as it's hidden */}
          </div>
        ))}
        {/* Add one slightly shorter line */}
        <div className="flex items-center justify-between px-3 py-1 rounded-lg min-h-[32px]">
          <div className="flex items-center gap-3 flex-1">
            <div className="h-2 w-2 bg-gray-300 dark:bg-zinc-600 rounded-full"></div>
            <div className="h-3 w-3/4 bg-gray-200 dark:bg-zinc-700 rounded mr-6"></div>
          </div>
        </div>
      </div>

      {/* No skeleton needed for the input form as it's initially hidden */}
      {/* Add a placeholder for where the form *would* be to maintain height */}
      <div className="mt-auto flex gap-2 flex-shrink-0 pb-1 invisible">
        <div className="h-[46px] flex-1 rounded-xl bg-transparent"></div>{" "}
        {/* Match input height */}
        <div className="h-[40px] w-[60px] rounded-lg bg-transparent"></div>{" "}
        {/* Match button size */}
      </div>
    </div>
  );
};

export default function Affirmations() {
  const [affirmations, setAffirmations] = useState<string[]>([]);
  const [newAffirmation, setNewAffirmation] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInputVisible, setIsInputVisible] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // --- Fetch initial affirmations ---
  useEffect(() => {
    const fetchAffirmations = async () => {
      setIsLoading(true); // Keep this true at the start
      setError(null);
      try {
        // Simulate network delay for testing skeleton
        // await new Promise(resolve => setTimeout(resolve, 2000));

        const response = await fetch("/api/features/affirmations");

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message ||
              `Error: ${response.statusText} (${response.status})`
          );
        }

        const data = await response.json();
        setAffirmations(data.affirmations || []);
      } catch (err) {
        console.error("Failed to fetch affirmations:", err);
        setError(
          err instanceof Error
            ? err.message
            : "An unknown error occurred while fetching affirmations."
        );
        toast.error("Could not load affirmations.");
      } finally {
        setIsLoading(false); // Set loading false after fetch attempt
      }
    };

    fetchAffirmations();
  }, []);

  // --- Focus input when it becomes visible ---
  useEffect(() => {
    if (isInputVisible) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isInputVisible]);

  // --- Add new affirmation ---
  // (Keep handleAddAffirmation function exactly as it was)
  const handleAddAffirmation = async (event: FormEvent) => {
    event.preventDefault();
    const trimmedAffirmation = newAffirmation.trim();

    if (!trimmedAffirmation) {
      toast.warning("Please enter an affirmation.");
      inputRef.current?.focus(); // Keep focus if empty
      return;
    }

    setIsAdding(true);

    toast.promise(
      fetch("/api/features/affirmations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ affirmation: trimmedAffirmation }),
      }).then(async (response) => {
        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ message: `HTTP error ${response.status}` }));
          throw new Error(
            errorData.message ||
              `Failed to add affirmation (${response.status})`
          );
        }
        return response.json();
      }),
      {
        loading: "Adding affirmation...",
        success: (data) => {
          setAffirmations((prev) => [...prev, data.affirmation]);
          setNewAffirmation("");
          setIsInputVisible(false); // Hide input on success
          return "Affirmation added successfully!";
        },
        error: (err) => {
          console.error("Failed to add affirmation:", err);
          inputRef.current?.focus(); // Keep focus on error
          return err instanceof Error
            ? err.message
            : "Could not add affirmation.";
        },
        finally: () => {
          setIsAdding(false);
        },
      }
    );
  };

  // --- Delete affirmation ---
  // (Keep handleDeleteAffirmation function exactly as it was)
  const handleDeleteAffirmation = async (
    index: number,
    affirmation: string
  ) => {
    setIsDeleting(affirmation);

    toast.promise(
      fetch("/api/features/affirmations", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ affirmation }),
      }).then(async (response) => {
        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ message: `HTTP error ${response.status}` }));
          throw new Error(
            errorData.message ||
              `Failed to delete affirmation (${response.status})`
          );
        }
        return response.json();
      }),
      {
        loading: "Deleting affirmation...",
        success: () => {
          setAffirmations((prev) => prev.filter((_, i) => i !== index));
          return "Affirmation deleted successfully!";
        },
        error: (err) => {
          console.error("Failed to delete affirmation:", err);
          return err instanceof Error
            ? err.message
            : "Could not delete affirmation.";
        },
        finally: () => {
          setIsDeleting(null);
        },
      }
    );
  };

  // --- RENDER LOGIC ---

  // *** Use the Skeleton component when isLoading is true ***
  if (isLoading) {
    return <AffirmationsSkeleton />;
  }

  // Handle Error State (after loading check)
  if (error) {
    return (
      <div className="relative p-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-xl border border-slate-200/50 dark:border-zinc-800/50 flex flex-col overflow-hidden h-full items-center justify-center">
        <h1 className="text-sm text-secondary-black dark:text-secondary-white opacity-40 uppercase tracking-wider absolute top-4 left-4">
          Affirmations
        </h1>
        <p className="text-sm text-red-600 dark:text-red-400 text-center px-4">
          Error loading affirmations.
          <br />
          Please try refreshing.
        </p>
        {/* Optionally add a retry button here */}
      </div>
    );
  }

  // --- Render Actual Component Content (if not loading and no error) ---
  return (
    <div className="relative p-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-xl border border-slate-200/50 dark:border-zinc-800/50 flex flex-col overflow-hidden h-full">
      {/* Header Area: Title + New Affirmation Button */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h1 className="text-sm text-secondary-black dark:text-secondary-white opacity-40 uppercase tracking-wider">
          Affirmations
        </h1>
        {!isInputVisible && ( // Show button only if input is hidden
          <button
            onClick={() => setIsInputVisible(true)}
            className="flex items-center gap-1 text-xs text-primary/70 dark:text-primary-foreground/70 hover:text-primary dark:hover:text-primary-foreground transition-colors px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-zinc-800/50"
            aria-label="Add new affirmation"
          >
            <Plus size={14} />
            New
          </button>
        )}
      </div>

      {/* Affirmations List */}
      <div className="flex-grow overflow-y-auto mb-4 space-y-2">
        {affirmations.length === 0 && !isInputVisible ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-slate-500 dark:text-zinc-400 text-center italic">
              No affirmations yet. Add one!
            </p>
          </div>
        ) : (
          affirmations.map((affirmation, index) => (
            <div
              key={index}
              className="group/item flex items-center justify-between px-3 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800/50 transition-colors min-h-[32px]"
            >
              <div className="flex items-center gap-3">
                <span className="text-primary font-medium">•</span>
                <p className="text-sm text-black/80 dark:text-white/80">
                  {affirmation}
                </p>
              </div>
              <button
                onClick={() => handleDeleteAffirmation(index, affirmation)}
                disabled={isDeleting === affirmation}
                className="opacity-0 group-hover/item:opacity-100 focus:opacity-100 transition-opacity p-1 rounded-full hover:bg-slate-200 dark:hover:bg-zinc-700"
                aria-label="Delete affirmation"
              >
                <X size={16} className="text-slate-500 dark:text-zinc-400" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Input and Add Button Area (Conditionally Rendered) */}
      {isInputVisible && (
        <form
          onSubmit={handleAddAffirmation}
          className="mt-auto flex gap-2 flex-shrink-0 pb-1"
        >
          <input
            ref={inputRef}
            type="text"
            placeholder="I am..."
            value={newAffirmation}
            onChange={(e) => setNewAffirmation(e.target.value)}
            className="flex-1 rounded-xl border-2 border-slate-300 dark:border-zinc-700  dark:bg-zinc-800/90 px-4 py-3 text-sm transition-all duration-200 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/20 dark:focus:ring-primary/10 disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={isAdding} // Only disable based on isAdding here
            autoComplete="off"
          />
          <button
            type="submit"
            className="rounded-lg bg-primary text-sm px-4 py-2 text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isAdding || !newAffirmation.trim()}
          >
            {isAdding ? "Adding..." : "Add"}
          </button>
        </form>
      )}
    </div>
  );
}
