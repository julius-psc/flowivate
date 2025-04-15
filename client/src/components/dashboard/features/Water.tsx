"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Plus, Minus } from "lucide-react";
import { IconDropletFilled } from "@tabler/icons-react";

const Water = () => {
  const [waterAmount, setWaterAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(true); // For loading state
  const [error, setError] = useState<string | null>(null); // For error messages
  const [successMessage, setSuccessMessage] = useState<string | null>(null); // For success feedback
  const { status } = useSession(); // Get session status

  const dailyGoal = 2000; // 2L daily goal
  const increment = 250; // 250ml increments

  // Fetch initial water amount on component mount
  useEffect(() => {
    const fetchInitialWater = async () => {
      if (status === "authenticated") {
        setIsLoading(true);
        setError(null);
        try {
          const response = await fetch("/api/features/water", {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Failed to fetch water data (${response.status})`);
          }

          const data = await response.json();
          setWaterAmount(data.waterAmount || 0);
        } catch (err) {
          console.error("Failed to fetch initial water amount:", err);
          setError(err instanceof Error ? err.message : "An unknown error occurred fetching data.");
        } finally {
          setIsLoading(false);
        }
      } else if (status === "unauthenticated") {
        setWaterAmount(0);
      }
    };

    fetchInitialWater();
  }, [status]);

  const handleIncrement = () => {
    if (waterAmount < dailyGoal) {
      setWaterAmount((prev) => Math.min(prev + increment, dailyGoal));
      setError(null);
      setSuccessMessage(null);
    }
  };

  const handleDecrement = () => {
    if (waterAmount > 0) {
      setWaterAmount((prev) => Math.max(prev - increment, 0));
      setError(null);
      setSuccessMessage(null);
    }
  };

  const handleSave = async () => {
    if (status !== "authenticated") {
      setError("You must be logged in to save your water intake.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/features/water", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ waterAmount: waterAmount }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `Failed to save data (${response.status})`);
      }

      console.log("Save successful:", result);
      setSuccessMessage(result.message || "Water intake saved successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Failed to save water amount:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const percentage = Math.min((waterAmount / dailyGoal) * 100, 100);
  const remainingWater = dailyGoal - waterAmount;
  const isSaveDisabled = waterAmount === 0 || isLoading || status !== "authenticated";

  // Skeleton Loader
  if (isLoading || status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-bg-dark rounded-lg w-full max-w-md mx-auto border border-gray-200 dark:border-gray-800/50">
        <div className="animate-pulse">
          <div className="flex flex-col items-center mb-6">
            <div className="relative mb-3">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            </div>
            <div className="text-center">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24 mx-auto"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 mx-auto mt-2"></div>
            </div>
          </div>
          <div className="w-full mb-6">
            <div className="flex justify-between mb-1">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4"></div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="h-6 flex-grow bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            </div>
          </div>
          <div className="h-6 mb-2"></div>
          <div className="w-full h-10 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-bg-dark rounded-lg w-full max-w-md mx-auto border border-gray-200 dark:border-gray-800/50">
      {/* Header with water icon and amount */}
      <div className="flex flex-col items-center mb-6">
        <div className="relative mb-3">
          <IconDropletFilled className="w-10 h-10 text-primary-blue dark:text-primary-blue" />
          <div className="absolute -bottom-1 -right-1 bg-primary-blue dark:bg-primary-blue text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            +
          </div>
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
      <div className="w-full mb-6">
        <div className="flex justify-between mb-1 text-xs text-gray-400 dark:text-gray-500">
          <span>0</span>
          <span>1L</span>
          <span>2L</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDecrement}
            disabled={waterAmount === 0 || isLoading}
            className={`p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Minus size={20} strokeWidth={2.5} />
          </button>
          <div className="relative h-6 flex-grow bg-blue-50 dark:bg-gray-700 rounded-full overflow-hidden">
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
                <div key={index} className="h-3 w-px bg-blue-200 dark:bg-gray-600" />
              ))}
            </div>
          </div>
          <button
            onClick={handleIncrement}
            disabled={waterAmount >= dailyGoal || isLoading}
            className={`p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Plus size={20} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Status Messages */}
      <div className="h-6 mb-2 text-center">
        {isLoading && <p className="text-sm text-gray-500 dark:text-gray-400">Saving...</p>}
        {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}
        {successMessage && <p className="text-sm text-green-500 dark:text-green-400">{successMessage}</p>}
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={isSaveDisabled}
        className={`w-full py-3 px-6 rounded-xl bg-primary-blue dark:bg-primary-blue text-white font-medium transition-all duration-300 hover:bg-blue-600 dark:hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed ${
          waterAmount >= dailyGoal && !isLoading ? "animate-pulse" : ""
        }`}
      >
        {isLoading ? "Saving..." : waterAmount >= dailyGoal ? "Well Done! Save" : "Save Water Intake"}
        {status !== "authenticated" && " (Login Required)"}
      </button>
    </div>
  );
};

export default Water;