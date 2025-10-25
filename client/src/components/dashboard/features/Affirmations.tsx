"use client";

import { useState, useEffect, FormEvent, useRef } from "react";
import { toast } from "sonner";
import { X, Plus, List, RefreshCcw, Check } from "lucide-react";

const AffirmationsSkeleton = () => {
  return (
    <div className="relative p-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-xl border border-slate-200/50 dark:border-zinc-800/50 flex flex-col overflow-hidden h-full animate-pulse">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="h-3 w-20 bg-gray-200 dark:bg-zinc-700 rounded"></div>
        <div className="h-5 w-12 bg-gray-200 dark:bg-zinc-700 rounded-md"></div>
      </div>

      <div className="flex-grow flex flex-col items-center justify-center relative mb-4">
        <div className="h-4 w-3/4 bg-gray-200 dark:bg-zinc-700 rounded"></div>
        <div className="h-4 w-1/2 bg-gray-200 dark:bg-zinc-700 rounded mt-2"></div>
      </div>

      <div className="flex-shrink-0 flex items-center justify-center">
        <div className="h-9 w-9 bg-gray-200 dark:bg-zinc-700 rounded-lg"></div>
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
  const [viewMode, setViewMode] = useState<"display" | "manage">("display");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchAffirmations = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/features/affirmations");
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message ||
              `Error: ${response.statusText} (${response.status})`
          );
        }
        const data = await response.json();
        const fetchedAffirmations = data.affirmations || [];
        setAffirmations(fetchedAffirmations);
        if (fetchedAffirmations.length > 0) {
          setCurrentIndex(
            Math.floor(Math.random() * fetchedAffirmations.length)
          );
        }
      } catch (err) {
        console.error("Failed to fetch affirmations:", err);
        setError(
          err instanceof Error
            ? err.message
            : "An unknown error occurred while fetching affirmations."
        );
        toast.error("Could not load affirmations.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAffirmations();
  }, []);

  useEffect(() => {
    if (viewMode === "manage") {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [viewMode]);

  const handleAddAffirmation = async (event: FormEvent) => {
    event.preventDefault();
    const trimmedAffirmation = newAffirmation.trim();

    if (!trimmedAffirmation) {
      toast.warning("Please enter an affirmation.");
      inputRef.current?.focus();
      return;
    }

    setIsAdding(true);

    toast.promise(
      fetch("/api/features/affirmations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
        success: (data) => {
          const newAffirmations = [...affirmations, data.affirmation];
          setAffirmations(newAffirmations);
          if (newAffirmations.length === 1) {
            setCurrentIndex(0);
          }
          setNewAffirmation("");
          return "Affirmation added successfully!";
        },
        error: (err) => {
          console.error("Failed to add affirmation:", err);
          inputRef.current?.focus();
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

  const handleDeleteAffirmation = async (
    index: number,
    affirmation: string
  ) => {
    setIsDeleting(affirmation);

    toast.promise(
      fetch("/api/features/affirmations", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
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
        success: () => {
          setAffirmations((prev) =>
            prev.filter((_, i) => {
              if (i === index && index === currentIndex) {
                if (prev.length > 1) {
                  showNextAffirmation(true);
                } else {
                  setCurrentIndex(0);
                }
              } else if (i < currentIndex) {
                setCurrentIndex((prevIndex) => Math.max(0, prevIndex - 1));
              }
              return i !== index;
            })
          );
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

  const showNextAffirmation = (forceNew = false) => {
    if (affirmations.length < 2) return;

    setIsFading(true);

    setTimeout(() => {
      let nextIndex = currentIndex;
      while (forceNew && nextIndex === currentIndex) {
        nextIndex = Math.floor(Math.random() * affirmations.length);
      }
      if (!forceNew) {
        nextIndex = (currentIndex + 1) % affirmations.length;
      }
      setCurrentIndex(nextIndex);
      setIsFading(false);
    }, 150);
  };

  const shuffleAffirmation = () => {
    if (affirmations.length < 2) return;

    setIsFading(true);
    setTimeout(() => {
      let nextIndex = currentIndex;
      while (nextIndex === currentIndex) {
        nextIndex = Math.floor(Math.random() * affirmations.length);
      }
      setCurrentIndex(nextIndex);
      setIsFading(false);
    }, 150);
  };

  if (isLoading) {
    return <AffirmationsSkeleton />;
  }

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
      </div>
    );
  }

  return (
    <div className="relative p-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-xl border border-slate-200/50 dark:border-zinc-800/50 flex flex-col overflow-hidden h-full">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h1 className="text-sm text-secondary-black dark:text-secondary-white opacity-40 uppercase tracking-wider">
          Affirmations
        </h1>
        <button
          onClick={() =>
            setViewMode(viewMode === "display" ? "manage" : "display")
          }
          className="flex items-center gap-1 text-xs text-primary/70 dark:text-primary-foreground/70 hover:text-primary dark:hover:text-primary-foreground transition-colors px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-zinc-800/50"
          aria-label={
            viewMode === "display" ? "Manage affirmations" : "Done managing"
          }
        >
          {viewMode === "display" ? <List size={14} /> : <Check size={14} />}
          {viewMode === "display" ? "Manage" : "Done"}
        </button>
      </div>

      {viewMode === "display" && (
        <div className="flex-grow flex flex-col items-center justify-center relative">
          <div className="flex-grow flex items-center justify-center w-full px-4">
            {affirmations.length > 0 ? (
              <p
                className={`text-lg md:text-xl font-medium text-black/80 dark:text-white/80 text-center transition-opacity duration-150 ${
                  isFading ? "opacity-0" : "opacity-100"
                }`}
              >
                {affirmations[currentIndex]}
              </p>
            ) : (
              <p className="text-sm text-slate-500 dark:text-zinc-400 text-center italic">
                Click &#34;Manage&#34; to add your first affirmation.
              </p>
            )}
          </div>
          <div className="flex-shrink-0 pt-4">
            <button
              onClick={shuffleAffirmation}
              disabled={affirmations.length < 2 || isFading}
              className="flex items-center justify-center h-9 w-9 rounded-lg bg-slate-100 dark:bg-zinc-800/70 text-primary/80 dark:text-primary-foreground/80 hover:bg-slate-200 dark:hover:bg-zinc-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Show new affirmation"
            >
              <RefreshCcw size={16} />
            </button>
          </div>
        </div>
      )}

      {viewMode === "manage" && (
        <div className="flex-grow flex flex-col overflow-hidden">
          <div className="flex-grow overflow-y-auto space-y-2">
            {affirmations.length === 0 ? (
              <div className="flex items-center justify-center h-full min-h-[50px]">
                <p className="text-sm text-slate-500 dark:text-zinc-400 text-center italic">
                  No affirmations yet. Add one below!
                </p>
              </div>
            ) : (
              affirmations.map((affirmation, index) => (
                <div
                  key={index}
                  className="group/item flex items-center justify-between px-3 py-1 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors min-h-[32px]"
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
                    <X
                      size={16}
                      className="text-slate-500 dark:text-zinc-400"
                    />
                  </button>
                </div>
              ))
            )}
          </div>
          <form
            onSubmit={handleAddAffirmation}
            className="mt-auto flex flex-col gap-2 flex-shrink-0 pt-4"
          >
            <input
              ref={inputRef}
              type="text"
              placeholder="I am..."
              value={newAffirmation}
              onChange={(e) => setNewAffirmation(e.target.value)}
              className="mx-1 rounded-xl border-2 text-secondary-black dark:text-secondary-white border-slate-300 dark:border-zinc-700  dark:bg-zinc-800/90 px-2 py-2 text-sm transition-all duration-200 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/20 dark:focus:ring-primary/10 disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={isAdding}
              autoComplete="off"
            />
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-1 rounded-lg bg-primary text-sm px-4 py-2 text-secondary-white hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isAdding || !newAffirmation.trim()}
            >
              <Plus size={16} />
              Add
            </button>
          </form>
        </div>
      )}
    </div>
  );
}