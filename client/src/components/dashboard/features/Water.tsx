"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Plus, Minus } from "lucide-react";
import { IconBucketDroplet } from "@tabler/icons-react";
import { toast } from "sonner"; // Import Sonner toast

// --- Skeleton Loader Component (Unchanged) ---
const WaterSkeleton = () => {
  return (
    // Match outer container style from Water component
    <div className="p-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-xl border border-slate-200/50 dark:border-zinc-800/50 flex flex-col h-full animate-pulse">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <div className="h-3 w-24 bg-gray-200 dark:bg-zinc-700 rounded"></div> {/* "WATER INTAKE" placeholder */}
      </div>

      {/* Main Display Skeleton */}
      <div className="flex flex-col items-center mb-6">
        {/* Icon Placeholder */}
        <div className="w-10 h-10 bg-gray-300 dark:bg-zinc-600 rounded-full mb-3"></div>
        {/* Amount Text Placeholders */}
        <div className="flex items-baseline justify-center mb-1">
          <div className="h-8 w-16 bg-gray-200 dark:bg-zinc-700 rounded mr-1"></div> {/* Current amount */}
          <div className="h-5 w-16 bg-gray-200 dark:bg-zinc-700 rounded"></div> {/* Total amount */}
        </div>
        {/* Remaining Text Placeholder */}
        <div className="h-4 w-28 bg-gray-200 dark:bg-zinc-700 rounded mt-1"></div> {/* Remaining text */}
      </div>

      {/* Progress Bar Area Skeleton */}
      <div className="w-full mb-4">
        {/* Labels Placeholder */}
        <div className="flex justify-between mb-1 px-10 text-xs"> {/* Approximate positioning */}
            <div className="h-3 w-3 bg-gray-200 dark:bg-zinc-700 rounded"></div> {/* 0 */}
            <div className="h-3 w-4 bg-gray-200 dark:bg-zinc-700 rounded"></div> {/* 1L */}
            <div className="h-3 w-4 bg-gray-200 dark:bg-zinc-700 rounded"></div> {/* 2L */}
        </div>
        {/* Controls + Bar Placeholder */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-300 dark:bg-zinc-600 rounded-full flex-shrink-0"></div> {/* Decrement Button */}
          <div className="h-6 flex-grow bg-gray-200 dark:bg-zinc-700 rounded-full"></div> {/* Progress Bar */}
          <div className="w-10 h-10 bg-gray-300 dark:bg-zinc-600 rounded-full flex-shrink-0"></div> {/* Increment Button */}
        </div>
      </div>

      {/* Placeholder for status message area height (removed actual content) */}
      <div className="h-6 mb-2"></div>

      {/* Save Button Placeholder */}
      {/* Using mt-auto might be needed if the parent flex container height is fixed/guaranteed */}
      <div className="flex justify-center mt-auto pt-2"> {/* Added pt-2 for spacing similar to original layout */}
        <div className="h-10 w-40 bg-gray-300 dark:bg-zinc-600 rounded-full"></div> {/* Save Button */}
      </div>
    </div>
  );
};


// --- Main Water Component (with Sonner Toasts) ---
const Water = () => {
  const [waterAmount, setWaterAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(true); // Used for BOTH initial fetch AND saving
  const [isFetching, setIsFetching] = useState(true); // Specifically for initial fetch state
  // REMOVED: error and successMessage states are no longer needed
  // const [error, setError] = useState<string | null>(null);
  // const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { status } = useSession();

  const dailyGoal = 2000;
  const increment = 250;

  // Fetch initial water amount
  useEffect(() => {
    const fetchInitialWater = async () => {
      if (status === "authenticated") {
        setIsFetching(true); 
        try {
          const response = await fetch("/api/features/water", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          });
  
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Failed to fetch water data (${response.status})`);
          }
  
          const data = await response.json();
          setWaterAmount(data.totalAmount || 0); 
  
        } catch (err) {
          console.error("Failed to fetch initial water amount:", err);
          const message = err instanceof Error ? err.message : "An unknown error occurred fetching data.";
          toast.error(`Failed to load water data: ${message}`);
        } finally {
          setIsFetching(false);
          setIsLoading(false);
        }
      } else if (status === "unauthenticated") {
        setWaterAmount(0);
        setIsFetching(false);
        setIsLoading(false); 
      }

    };
  
    if (status === "authenticated" || status === "unauthenticated") {
        fetchInitialWater();
    } else { // status === "loading"
        
        setIsLoading(true);
        setIsFetching(true);
    }
  
  }, [status]);

  const handleIncrement = () => {
    if (waterAmount < dailyGoal) {
      setWaterAmount((prev) => Math.min(prev + increment, dailyGoal));
      // setError(null); // No longer needed
      // setSuccessMessage(null); // No longer needed
    }
  };

  const handleDecrement = () => {
    if (waterAmount > 0) {
      setWaterAmount((prev) => Math.max(prev - increment, 0));
      // setError(null); // No longer needed
      // setSuccessMessage(null); // No longer needed
    }
  };

  const handleSave = async () => {
    if (status !== "authenticated") {
      toast.error("You must be logged in to save your water intake.");
      return;
    }
  
    setIsLoading(true); // Indicate saving process
  
    try {
      // Get the current date and format it as YYYY-MM-DD
      const today = new Date();
      const year = today.getFullYear();
      const month = (today.getMonth() + 1).toString().padStart(2, '0'); // Month is 0-indexed, add 1
      const day = today.getDate().toString().padStart(2, '0');
      const dateString = `${year}-${month}-${day}`; // Format as YYYY-MM-DD
  
      const response = await fetch("/api/features/water", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        // Include the dateString in the request body
        body: JSON.stringify({ waterAmount: waterAmount, date: dateString }),
      });
  
      const result = await response.json().catch(() => ({}));
  
      if (!response.ok) {
        throw new Error(result.message || `Failed to save data (${response.status})`);
      }
  
      console.log("Save successful:", result);
      toast.success(result.message || "Water intake saved successfully!");
  
    } catch (err) {
      console.error("Failed to save water amount:", err);
      const message = err instanceof Error ? err.message : "An unknown error occurred.";
      toast.error(`Error saving water intake: ${message}`);
    } finally {
      setIsLoading(false); // End saving process
    }
  };

  const percentage = Math.min((waterAmount / dailyGoal) * 100, 100);
  const remainingWater = dailyGoal - waterAmount;
  // Disable save if: fetching initial data, currently saving, or not authenticated.
  const isSaveDisabled = isFetching || isLoading || status !== "authenticated";

  // --- Determine when to show Skeleton ---
  // Show skeleton if session is loading OR if we are fetching initial data
  if (status === "loading" || isFetching) {
    return <WaterSkeleton />;
  }

  // --- Actual Component Render ---
  return (
    <div className="p-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-xl border border-slate-200/50 dark:border-zinc-800/50 flex flex-col h-full">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <h1 className="text-sm text-secondary-black dark:text-secondary-white opacity-40">WATER INTAKE</h1>
      </div>
      <div className="flex flex-col items-center mb-6">
        <div className="relative mb-3">
          <IconBucketDroplet className="w-10 h-10 text-primary dark:text-primary" />
        </div>
        <div className="text-center">
          <span className="text-3xl font-bold text-gray-800 dark:text-white">{waterAmount}</span>
          <span className="text-lg text-gray-500 dark:text-gray-300 ml-1">/ {dailyGoal}ml</span>
        </div>
        <p className={`mt-2 text-sm font-medium ${remainingWater > 0 ? "text-gray-500 dark:text-gray-400" : "text-green-500 dark:text-green-400"}`}>
          {remainingWater > 0 ? `${remainingWater}ml remaining` : "Goal achieved! 🎉"}
        </p>
      </div>

      {/* Water progress bar with controls */}
      <div className="w-full">
        <div className="flex justify-between mb-1 text-xs text-gray-400 dark:text-gray-500">
          <span>0</span>
          <span>1L</span>
          <span>2L</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDecrement}
            disabled={waterAmount === 0 || isLoading} // Disable during save
            className={`p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Minus size={20} strokeWidth={2.5} />
          </button>
          <div className="relative h-6 flex-grow bg-secondary-black/5 rounded-full overflow-hidden">
            <div
              className="absolute h-full top-0 left-0 transition-all duration-700 ease-out rounded-r-full"
              style={{
                width: `${percentage}%`,
                background: "linear-gradient(90deg, rgba(147,197,253,0.8) 0%, rgba(59,130,246,0.9) 100%)",
              }}
            >
              <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-white to-transparent opacity-30"></div>
            </div>
            <div className="absolute inset-0 flex justify-between items-center px-4 pointer-events-none">
              {[1, 2, 3, 4, 5, 6, 7].map((_, index) => (
                <div key={index} className="h-3 w-px bg-primary/20 dark:bg-gray-600" />
              ))}
            </div>
          </div>
          <button
            onClick={handleIncrement}
            disabled={waterAmount >= dailyGoal || isLoading} // Disable during save
            className={`p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Plus size={20} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* REMOVED: Status Message Area - replaced by toasts */}
      <div className="h-6 mb-2">
         {/* Kept for spacing, content removed */}
         {/* Optionally display non-error/success messages here if needed */}
         {/* Example: {isLoading && !isFetching && <p className="text-sm text-gray-500 dark:text-gray-400 text-center">Saving...</p>} */}
      </div>


      {/* Save Button */}
      <div className="flex justify-center mt-auto pt-2"> {/* Added pt-2 to push button down slightly */}
        <button
          onClick={handleSave}
          disabled={isSaveDisabled}
          className={` bg-primary text-secondary-white text-primary-black mx-2.5 px-6 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${isSaveDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-200 dark:hover:bg-zinc-700'}`}
        >
          {/* Text inside button now indicates saving state */}
          {isLoading && !isFetching ? "Saving..." : "Log water"}
          {status !== "authenticated" && " (Login Required)"}
        </button>
      </div>
    </div>
  );
};

export default Water;