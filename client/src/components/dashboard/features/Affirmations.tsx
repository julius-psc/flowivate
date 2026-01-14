"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { ChevronLeft, List, RefreshCcw } from "lucide-react";
import { IconTrash } from "@tabler/icons-react";
import { useTheme } from "next-themes";
import { specialSceneThemeNames } from "@/lib/themeConfig";
import { Skeleton } from "@/components/ui/Skeleton";

const AffirmationsSkeleton: React.FC<{ isSpecialTheme: boolean }> = ({
  isSpecialTheme,
}) => {
  return (
    <div
      className={`relative p-4 backdrop-blur-md rounded-xl flex flex-col overflow-hidden h-full ${isSpecialTheme
        ? "dark bg-zinc-900/50 border border-zinc-800/50"
        : "bg-white/80 dark:bg-zinc-900/80 border border-slate-200/50 dark:border-zinc-800/50"
        }`}
    >
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-5 w-12 rounded-md" />
      </div>

      <div className="flex-grow flex flex-col items-center justify-center relative mb-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2 mt-2" />
      </div>

      <div className="flex-shrink-0 flex items-center justify-center">
        <Skeleton className="h-9 w-9 rounded-lg" />
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
  const [isMounted, setIsMounted] = useState(false); // Add isMounted state
  const inputRef = useRef<HTMLInputElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    setIsMounted(true); // Set mounted on client
  }, []);

  // Calculate theme *after* mount and ensure boolean type
  const isSpecialTheme =
    isMounted && // Check if mounted
    !!theme && // Ensure theme is defined
    specialSceneThemeNames.includes(
      theme as (typeof specialSceneThemeNames)[number]
    );

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
      } catch (err: unknown) { // Type as unknown
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
  }, []); // Empty dependency array means fetch only once on mount

  // Auto-rotate affirmations every 5 minutes in display mode
  useEffect(() => {
    if (viewMode !== "display" || affirmations.length < 2) return;

    const intervalId = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % affirmations.length);
        setIsFading(false);
      }, 150);
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(intervalId);
  }, [viewMode, affirmations.length]);

  useEffect(() => {
    if (viewMode === "manage") {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [viewMode]);

  const handleAddAffirmation = async () => {
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
            setCurrentIndex(0); // Set index to 0 if it was the first one added
          }
          setNewAffirmation("");
          return "Affirmation added successfully!";
        },
        error: (err: unknown) => { // Type as unknown
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
          setAffirmations((prev) => {
            // Create new array *before* calculating next index
            const nextAffirmations = prev.filter((_, i) => i !== index);

            // Calculate next index based on the *old* array length and currentIndex
            if (index === currentIndex) {
              if (prev.length > 1) {
                // Need to find a valid next index from the remaining items
                setCurrentIndex(prevIndex => (prevIndex % nextAffirmations.length));
              } else {
                setCurrentIndex(0); // Reset if list becomes empty
              }
            } else if (index < currentIndex) {
              // Adjust currentIndex if an item before it was deleted
              setCurrentIndex((prevIndex) => Math.max(0, prevIndex - 1));
            }
            // Return the new filtered array
            return nextAffirmations;
          });
          return "Affirmation deleted successfully!";
        },
        error: (err: unknown) => { // Type as unknown
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
      // Ensure a *different* index if forceNew is true
      while (forceNew && nextIndex === currentIndex) {
        nextIndex = Math.floor(Math.random() * affirmations.length);
      }
      // Simple increment if not forcing new
      if (!forceNew) {
        nextIndex = (currentIndex + 1) % affirmations.length;
      }
      setCurrentIndex(nextIndex);
      setIsFading(false);
    }, 150); // Duration matches CSS transition
  };

  const shuffleAffirmation = () => {
    // Re-use showNextAffirmation logic with forceNew = true
    showNextAffirmation(true);
  };

  // Define conditional classes based on mount and theme state
  const containerBaseClasses = "relative p-4 backdrop-blur-md rounded-xl flex flex-col overflow-hidden h-full transition-opacity duration-300";
  const containerPreMountClasses = "bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800/50 opacity-0";
  const containerPostMountClasses = isSpecialTheme
    ? "dark bg-zinc-900/50 border border-zinc-800/50 opacity-100"
    : "bg-white/80 dark:bg-zinc-900/80 border border-slate-200/50 dark:border-zinc-800/50 opacity-100";


  // --- Render logic ---

  // Show skeleton if loading OR if not mounted yet
  if (isLoading || !isMounted) {
    // Pass the boolean value directly, even if it's potentially false before mount
    return <AffirmationsSkeleton isSpecialTheme={!!isSpecialTheme} />;
  }

  if (error) {
    return (
      <div
        className={`${containerBaseClasses} ${isMounted ? containerPostMountClasses : containerPreMountClasses // Apply conditional classes even for error state
          } items-center justify-center`} // Added centering for error message
      >
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
    <div
      className={`${containerBaseClasses} ${isMounted ? containerPostMountClasses : containerPreMountClasses // Apply conditional classes
        }`}
    >
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        {viewMode === "manage" ? (
          <button
            onClick={() => setViewMode("display")}
            className={`flex items-center gap-1 transition-colors rounded-md ${isSpecialTheme
              ? 'text-white/40 hover:text-white/60'
              : 'text-secondary-black/40 dark:text-secondary-white/40 hover:text-secondary-black/60 dark:hover:text-secondary-white/60'
              }`}
            aria-label="Back to affirmations"
          >
            <ChevronLeft size={16} />
            <span className="text-sm uppercase tracking-wider">
              Affirmations
            </span>
          </button>
        ) : (
          <>
            <h1 className="text-sm text-secondary-black dark:text-secondary-white opacity-40 uppercase tracking-wider">
              Affirmations
            </h1>
            <button
              onClick={() => setViewMode("manage")}
              className={`flex items-center gap-1 text-xs transition-colors px-2 py-1 rounded-md ${isSpecialTheme
                ? 'text-white/70 hover:text-white hover:bg-white/10'
                : 'text-primary/70 dark:text-primary-foreground/70 hover:text-primary dark:hover:text-primary-foreground hover:bg-slate-100 dark:hover:bg-zinc-800/50'
                }`}
              aria-label="Manage affirmations"
            >
              <List size={14} />
              Manage
            </button>
          </>
        )}
      </div>

      {viewMode === "display" && (
        <div className="flex-grow flex flex-col items-center justify-center relative">
          <div className="flex-grow flex items-center justify-center w-full px-4">
            {affirmations.length > 0 ? (
              <p
                className={`text-lg md:text-xl font-medium ${isSpecialTheme ? 'text-white/90' : 'text-black/80 dark:text-white/80'} text-center transition-opacity duration-150 ${isFading ? "opacity-0" : "opacity-100"
                  }`}
              >
                {affirmations[currentIndex]}
              </p>
            ) : (
              <p className={`text-sm text-center italic ${isSpecialTheme ? 'text-white/50' : 'text-slate-500 dark:text-zinc-400'}`}>
                Click &#34;Manage&#34; to add your first affirmation.
              </p>
            )}
          </div>
          <div className="flex-shrink-0 pt-4">
            <button
              onClick={shuffleAffirmation}
              disabled={affirmations.length < 2 || isFading}
              className={`flex items-center justify-center h-9 w-9 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed ${isSpecialTheme
                ? 'bg-white/10 text-white/80 hover:bg-white/20'
                : 'bg-slate-100 dark:bg-zinc-800/70 text-primary/80 dark:text-primary-foreground/80 hover:bg-slate-200 dark:hover:bg-zinc-800'
                }`}
              aria-label="Show new affirmation"
            >
              <RefreshCcw size={16} />
            </button>
          </div>
        </div>
      )}

      {viewMode === "manage" && (
        <div className="flex-grow flex flex-col overflow-hidden">
          <div className="flex-grow overflow-y-auto space-y-2 pr-1 mr-[-4px]"> {/* Added padding/margin for scrollbar */}
            {affirmations.length === 0 ? (
              <div className="flex items-center justify-center h-full min-h-[50px]">
                <p className={`text-sm text-center italic ${isSpecialTheme ? 'text-white/50' : 'text-slate-500 dark:text-zinc-400'}`}>
                  No affirmations yet. Add one below!
                </p>
              </div>
            ) : (
              affirmations.map((affirmation, index) => (
                <div
                  key={`${affirmation}-${index}`} // Use a more stable key if possible, but index is fallback
                  className={`group/item flex items-center justify-between px-3 py-1 rounded-lg transition-colors min-h-[32px] ${isSpecialTheme ? 'hover:bg-white/5' : 'hover:bg-slate-50 dark:hover:bg-zinc-800'
                    }`}
                >
                  <div className="flex items-center gap-3 min-w-0"> {/* Added min-w-0 */}
                    <span className="text-primary font-medium flex-shrink-0">•</span>
                    <p className={`text-sm truncate ${isSpecialTheme ? 'text-white/90' : 'text-black/80 dark:text-white/80'}`}> {/* Added truncate */}
                      {affirmation}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteAffirmation(index, affirmation)}
                    disabled={isDeleting === affirmation}
                    className={`opacity-0 group-hover/item:opacity-100 focus:opacity-100 transition-opacity p-1.5 rounded-md flex-shrink-0 ${isSpecialTheme
                      ? 'hover:bg-red-500/20'
                      : 'hover:bg-red-100/80 dark:hover:bg-red-900/50'
                      }`}
                    aria-label="Delete affirmation"
                  >
                    <IconTrash
                      size={14}
                      className="text-red-500 dark:text-red-400"
                    />
                  </button>
                </div>
              ))
            )}
          </div>
          <div className="mt-auto flex-shrink-0 pt-4">
            <input
              ref={inputRef}
              type="text"
              placeholder="Add affirmation... (press Enter)"
              value={newAffirmation}
              onChange={(e) => setNewAffirmation(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isAdding && newAffirmation.trim()) {
                  e.preventDefault();
                  handleAddAffirmation();
                }
              }}
              className={`w-full bg-transparent border-none outline-none px-1 py-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed ${isSpecialTheme
                ? 'text-white/90 placeholder:text-white/40'
                : 'text-secondary-black dark:text-secondary-white placeholder:text-slate-400 dark:placeholder:text-zinc-500'
                }`}
              disabled={isAdding}
              autoComplete="off"
            />
          </div>
        </div>
      )}
    </div>
  );
}