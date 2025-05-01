"use client";

import { useState, useEffect, FormEvent } from "react";
import { toast } from "sonner";
import { X } from "lucide-react"; // Using lucide-react for delete icon

export default function Affirmations() {
  const [affirmations, setAffirmations] = useState<string[]>([]);
  const [newAffirmation, setNewAffirmation] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null); // Track which item is being deleted
  const [error, setError] = useState<string | null>(null);

  // --- Fetch initial affirmations ---
  useEffect(() => {
    const fetchAffirmations = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/features/affirmations');

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Error: ${response.statusText} (${response.status})`);
        }

        const data = await response.json();
        setAffirmations(data.affirmations || []);

      } catch (err) {
        console.error("Failed to fetch affirmations:", err);
        setError(err instanceof Error ? err.message : "An unknown error occurred while fetching affirmations.");
        toast.error("Could not load affirmations.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAffirmations();
  }, []);

  // --- Add new affirmation ---
  const handleAddAffirmation = async (event: FormEvent) => {
    event.preventDefault();
    const trimmedAffirmation = newAffirmation.trim();

    if (!trimmedAffirmation) {
      toast.warning("Please enter an affirmation.");
      return;
    }

    setIsAdding(true);

    toast.promise(
      fetch('/api/features/affirmations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ affirmation: trimmedAffirmation }),
      }).then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: `HTTP error ${response.status}` }));
          throw new Error(errorData.message || `Failed to add affirmation (${response.status})`);
        }
        return response.json();
      }),
      {
        loading: 'Adding affirmation...',
        success: (data) => {
          setAffirmations((prev) => [...prev, data.affirmation]);
          setNewAffirmation("");
          return "Affirmation added successfully!";
        },
        error: (err) => {
          console.error("Failed to add affirmation:", err);
          return err instanceof Error ? err.message : "Could not add affirmation.";
        },
        finally: () => {
          setIsAdding(false);
        }
      }
    );
  };

  // --- Delete affirmation ---
  const handleDeleteAffirmation = async (index: number, affirmation: string) => {
    setIsDeleting(affirmation);

    toast.promise(
      fetch('/api/features/affirmations', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ affirmation }),
      }).then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: `HTTP error ${response.status}` }));
          throw new Error(errorData.message || `Failed to delete affirmation (${response.status})`);
        }
        return response.json();
      }),
      {
        loading: 'Deleting affirmation...',
        success: () => {
          setAffirmations((prev) => prev.filter((_, i) => i !== index));
          return "Affirmation deleted successfully!";
        },
        error: (err) => {
          console.error("Failed to delete affirmation:", err);
          return err instanceof Error ? err.message : "Could not delete affirmation.";
        },
        finally: () => {
          setIsDeleting(null);
        }
      }
    );
  };

  return (
    <div className="relative p-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-xl border border-slate-200/50 dark:border-zinc-800/50 flex flex-col overflow-hidden h-full">
      <h1 className="text-sm text-secondary-black dark:text-secondary-white opacity-40 mb-4 flex-shrink-0">
        AFFIRMATIONS
      </h1>

      {/* Loading State */}
      {isLoading && 
        <div className="flex-grow flex items-center justify-center">
          <p className="text-sm text-slate-500 dark:text-zinc-400">Loading affirmations...</p>
        </div>
      }

      {/* Error State */}
      {error && !isLoading && 
        <div className="flex-grow flex items-center justify-center">
          <p className="text-sm text-red-600 dark:text-red-400">Error: {error}</p>
        </div>
      }

      {/* Affirmations List */}
      {!isLoading && !error && (
        <div className="flex-grow overflow-y-auto mb-4 space-y-2">
          {affirmations.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-slate-500 dark:text-zinc-400 text-center italic">No affirmations yet. Add one below!</p>
            </div>
          ) : (
            affirmations.map((affirmation, index) => (
              <div
                key={index}
                className="flex items-center justify-between group px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-primary font-medium">•</span>
                  <p className="text-sm text-black/80 dark:text-white/80">{affirmation}</p>
                </div>
                <button
                  onClick={() => handleDeleteAffirmation(index, affirmation)}
                  disabled={isDeleting === affirmation}
                  className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity p-1 rounded-full hover:bg-slate-200 dark:hover:bg-zinc-700"
                  aria-label="Delete affirmation"
                >
                  <X size={16} className="text-slate-500 dark:text-zinc-400" />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Input and Add Button Area */}
      <form onSubmit={handleAddAffirmation} className="mt-auto flex gap-2 flex-shrink-0">
        <input
          type="text"
          placeholder="Add affirmation..."
          value={newAffirmation}
          onChange={(e) => setNewAffirmation(e.target.value)}
          className="flex-1 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white/70 dark:bg-zinc-800/70 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 dark:focus:ring-primary/30 disabled:opacity-50"
          disabled={isAdding || isLoading}
        />
        <button
          type="submit"
          className="rounded-lg bg-primary text-secondary-black dark:text-secondary-white text-sm px-4 py-2 hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isAdding || isLoading}
        >
          {isAdding ? "Adding..." : "Add"}
        </button>
      </form>
    </div>
  );
}