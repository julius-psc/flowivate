"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Plus, Minus, Pencil, X, Check } from "lucide-react";
import { toast } from "sonner";

const WaterSkeleton = () => {
  return (
    <div className="p-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-xl border border-slate-200/50 dark:border-zinc-800/50 flex flex-col h-full animate-pulse">
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-gray-200 dark:bg-zinc-700 rounded"></div>
          <div className="h-3 w-24 bg-gray-200 dark:bg-zinc-700 rounded"></div>
        </div>
        <div className="h-4 w-20 bg-gray-200 dark:bg-zinc-700 rounded"></div>
      </div>

      <div className="flex flex-col items-center my-4">
        <div className="flex items-baseline justify-center mb-1">
          <div className="h-9 w-16 bg-gray-200 dark:bg-zinc-700 rounded mr-1"></div>
          <div className="h-5 w-16 bg-gray-200 dark:bg-zinc-700 rounded"></div>
        </div>
        <div className="h-4 w-28 bg-gray-200 dark:bg-zinc-700 rounded mt-2"></div>
      </div>

      <div className="w-full mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gray-300 dark:bg-zinc-600 rounded-full flex-shrink-0"></div>
          <div className="h-6 flex-grow bg-gray-200 dark:bg-zinc-700 rounded-full"></div>
          <div className="w-9 h-9 bg-gray-300 dark:bg-zinc-600 rounded-full flex-shrink-0"></div>
        </div>
      </div>

      <div className="h-6 mb-2"></div>

      <div className="flex justify-center mt-auto pt-2">
        <div className="h-10 w-40 bg-gray-300 dark:bg-zinc-600 rounded-full"></div>
      </div>
    </div>
  );
};

const Water = () => {
  const [waterAmount, setWaterAmount] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(2000);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [editableGoal, setEditableGoal] = useState(dailyGoal.toString());
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(true);
  const { status } = useSession();

  const increment = 250;

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
            throw new Error(
              errorData.message ||
                `Failed to fetch water data (${response.status})`,
            );
          }

          const data = await response.json();
          setWaterAmount(data.totalAmount || 0);
        } catch (err) {
          console.error("Failed to fetch initial water amount:", err);
          const message =
            err instanceof Error
              ? err.message
              : "An unknown error occurred fetching data.";
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
    } else {
      setIsLoading(true);
      setIsFetching(true);
    }
  }, [status]);

  const handleIncrement = () => {
    if (waterAmount < dailyGoal) {
      setWaterAmount((prev) => Math.min(prev + increment, dailyGoal));
    }
  };

  const handleDecrement = () => {
    if (waterAmount > 0) {
      setWaterAmount((prev) => Math.max(prev - increment, 0));
    }
  };

  const handleSetGoal = () => {
    const newGoal = parseInt(editableGoal, 10);
    if (!isNaN(newGoal) && newGoal > 0) {
      setDailyGoal(newGoal);
      setIsEditingGoal(false);
      toast.success("Water goal updated!");
      if (waterAmount > newGoal) {
        setWaterAmount(newGoal);
      }
    } else {
      toast.error("Please enter a valid goal (e.g., 2000).");
      setEditableGoal(dailyGoal.toString());
    }
  };

  const handleCancelEdit = () => {
    setIsEditingGoal(false);
    setEditableGoal(dailyGoal.toString());
  };

  const handleSave = async () => {
    if (status !== "authenticated") {
      toast.error("You must be logged in to save your water intake.");
      return;
    }

    setIsLoading(true);

    try {
      const today = new Date();
      const year = today.getFullYear();
      const month = (today.getMonth() + 1).toString().padStart(2, "0");
      const day = today.getDate().toString().padStart(2, "0");
      const dateString = `${year}-${month}-${day}`;

      const response = await fetch("/api/features/water", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ waterAmount: waterAmount, date: dateString }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.message || `Failed to save data (${response.status})`,
        );
      }

      toast.success(result.message || "Water intake saved successfully!");
    } catch (err) {
      console.error("Failed to save water amount:", err);
      const message =
        err instanceof Error
          ? err.message
          : "An unknown error occurred.";
      toast.error(`Error saving water intake: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const percentage = Math.min((waterAmount / dailyGoal) * 100, 100);
  const remainingWater = dailyGoal - waterAmount;
  const isSaveDisabled =
    isFetching || isLoading || status !== "authenticated" || isEditingGoal;

  if (status === "loading" || isFetching) {
    return <WaterSkeleton />;
  }

  return (
    <div className="p-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-xl border border-slate-200/50 dark:border-zinc-800/50 flex flex-col h-full">
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <h1 className="text-sm text-secondary-black dark:text-secondary-white opacity-40">
            WATER INTAKE
          </h1>
        </div>

        {isEditingGoal ? (
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={editableGoal}
              onChange={(e) => setEditableGoal(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSetGoal()}
              className="w-20 text-sm p-1 rounded-md bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              onClick={handleSetGoal}
              className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-slate-300 transition-colors"
            >
              <Check size={16} />
            </button>
            <button
              onClick={handleCancelEdit}
              className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-slate-300 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Goal: {dailyGoal}ml
            </span>
            <button
              onClick={() => {
                setIsEditingGoal(true);
                setEditableGoal(dailyGoal.toString());
              }}
              className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-slate-300 transition-colors"
            >
              <Pencil size={14} />
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center my-4">
        <div className="text-center">
          <span className="text-4xl font-bold text-gray-800 dark:text-white">
            {waterAmount}
          </span>
          <span className="text-lg text-gray-500 dark:text-gray-300 ml-1">
            / {dailyGoal}ml
          </span>
        </div>
        <p
          className={`mt-2 text-sm font-medium ${
            remainingWater > 0
              ? "text-gray-500 dark:text-gray-400"
              : "text-green-500 dark:text-green-400"
          }`}
        >
          {remainingWater > 0
            ? `${remainingWater}ml remaining`
            : "Goal achieved! 🎉"}
        </p>
      </div>

      <div className="w-full">
        <div className="flex items-center gap-3">
          <button
            onClick={handleDecrement}
            disabled={waterAmount === 0 || isLoading || isEditingGoal}
            className="p-2 rounded-full bg-white dark:bg-zinc-800/50 border border-slate-200/50 dark:border-zinc-700/50 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-zinc-700/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Minus size={16} strokeWidth={2.5} />
          </button>
          <div className="relative h-6 flex-grow bg-secondary-black/5 dark:bg-zinc-800 rounded-full overflow-hidden border border-slate-200/50 dark:border-zinc-700/50">
            <div
              className="absolute h-full top-0 left-0 rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${percentage}%`,
                background:
                  "linear-gradient(90deg, rgba(147,197,253,0.8) 0%, rgba(59,130,246,0.9) 100%)",
              }}
            />
          </div>
          <button
            onClick={handleIncrement}
            disabled={waterAmount >= dailyGoal || isLoading || isEditingGoal}
            className="p-2 rounded-full bg-white dark:bg-zinc-800/50 border border-slate-200/50 dark:border-zinc-700/50 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-zinc-700/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <div className="h-6 mb-2"></div>

      <div className="flex justify-center mt-auto pt-2">
        <button
          onClick={handleSave}
          disabled={isSaveDisabled}
          className="bg-primary-blue text-white hover:bg-primary-blue dark:text-white dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed mx-2.5 px-6 py-2 rounded-full text-sm font-medium transition-colors duration-200"
        >
          {isLoading && !isFetching ? "Saving..." : "Log water"}
        </button>
      </div>
    </div>
  );
};

export default Water;