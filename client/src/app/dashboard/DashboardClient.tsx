"use client";

import React, { useState, useEffect } from "react";
import { useDashboard } from "@/context/DashboardContext";
import { featureComponents } from "@/components/dashboard/features/featureMap";
import TimeDisplay from "@/components/dashboard/TimeDisplay";
import Link from "next/link";
import { useTheme } from "next-themes";
import { specialSceneThemeNames } from "@/lib/themeConfig";
import {
  IconEyeOff,
  IconGripVertical,
  IconCubePlus,
} from "@tabler/icons-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Masonry from "react-masonry-css";
import type { FeatureKey } from "@/components/dashboard/features/featureMap";
import WithProGuard from "@/components/dashboard/recyclable/withProGuard";
import { motion } from "motion/react";

interface DashboardClientProps {
  subscriptionStatus: "active" | "canceled" | "past_due" | "free";
}

export default function DashboardClient({
  subscriptionStatus,
}: DashboardClientProps) {
  const { selectedFeatures, removeFeature, reorderFeatures, highlightedFeature } = useDashboard();
  const [activeId, setActiveId] = useState<FeatureKey | null>(null);
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isSpecialTheme =
    mounted &&
    !!theme &&
    specialSceneThemeNames.includes(
      theme as (typeof specialSceneThemeNames)[number]
    );

  const emptyTextColor = !mounted
    ? "text-transparent"
    : isSpecialTheme
      ? "text-white/70"
      : "text-gray-500 dark:text-gray-400";

  const addFeaturesTextColor = !mounted
    ? "text-transparent"
    : isSpecialTheme
      ? "text-white hover:text-white/80"
      : "text-secondary-black dark:text-secondary-white hover:text-secondary-black/80 dark:hover:text-secondary-white/80";

  const sensors = useSensors(useSensor(PointerSensor));

  const onDragStart = (event: DragStartEvent) =>
    setActiveId(event.active.id as FeatureKey);
  const onDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    if (event.active.id !== event.over?.id) {
      const oldIndex = selectedFeatures.indexOf(event.active.id as FeatureKey);
      const newIndex = selectedFeatures.indexOf(event.over?.id as FeatureKey);
      reorderFeatures(oldIndex, newIndex);
    }
  };

  const breakpointColumnsObj = {
    default: 4,
    1280: 3,
    1024: 2,
    640: 1,
  };

  if (!mounted) {
    return <div className="w-full h-full flex-1 flex flex-col items-center justify-center">Loading Dashboard...</div>;
  }

  return (
    <div className="w-full h-full flex-1 flex flex-col">
      {selectedFeatures.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1">
          <TimeDisplay isCenteredFullScreen={false} />
          <div className="mt-8 flex flex-col items-center justify-center p-8 rounded-lg">
            <p className={`text-sm mb-2 ${emptyTextColor}`}>
              Your dashboard is empty
            </p>
            <Link
              href="/dashboard/features"
              className="flex items-center gap-2 px-6 transition-colors focus:outline-none"
            >
              <div
                className={`flex justify-center items-center font-medium ${addFeaturesTextColor}`}
              >
                <span>Add features</span>
                <IconCubePlus className="ml-2" size={20} />
              </div>
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="flex justify-center items-center py-4">
            <TimeDisplay />
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
          >
            <SortableContext
              items={selectedFeatures}
              strategy={rectSortingStrategy}
            >
              <Masonry
                breakpointCols={breakpointColumnsObj}
                className="flex p-4"
                columnClassName="flex flex-col px-2"
              >
                {selectedFeatures.map((featureKey) => {
                  const { isPro } = featureComponents[featureKey];
                  return (
                    <SortableFeature
                      key={featureKey}
                      id={featureKey}
                      onRemove={() => removeFeature(featureKey)}
                      isSpecialTheme={isSpecialTheme}
                      isHighlighted={highlightedFeature === featureKey}
                      isPro={isPro}
                      subscriptionStatus={subscriptionStatus}
                    />
                  );
                })}
              </Masonry>
            </SortableContext>

            <DragOverlay>
              {activeId && (
                <div className={`rounded-xl p-3 shadow-lg ${isSpecialTheme
                  ? "dark bg-zinc-800/70 border border-zinc-700/50 backdrop-blur-lg" // Slightly darker frost for overlay
                  : "bg-white/90 dark:bg-gray-800/90 border border-gray-400 dark:border-gray-700 backdrop-blur-sm"
                  }`}>
                  {React.createElement(featureComponents[activeId].component)}
                </div>
              )}
            </DragOverlay>
          </DndContext>
        </>
      )}
    </div>
  );
}

interface SortableFeatureProps {
  id: FeatureKey;
  onRemove: () => void;
  isSpecialTheme: boolean;
  isHighlighted?: boolean;
  isPro?: boolean;
  subscriptionStatus: "active" | "canceled" | "past_due" | "free";
}


function SortableFeature({
  id,
  onRemove,
  isSpecialTheme,
  isHighlighted,
  isPro,
  subscriptionStatus
}: SortableFeatureProps) {
  // ... hooks (useSortable, useRef) ...
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  // Use a local ref for scrolling, merging with dnd-kit's setNodeRef
  const localRef = React.useRef<HTMLDivElement>(null);
  const combinedRef = (node: HTMLDivElement) => {
    // Call dnd-kit's ref callback
    setNodeRef(node);
    // Set our local ref
    localRef.current = node;
  };

  useEffect(() => {
    if (isHighlighted && localRef.current) {
      localRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [isHighlighted]);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform) || undefined,
    transition: transition || undefined,
    zIndex: isDragging ? 50 : "auto",
    opacity: isDragging ? 0.5 : 1,
    marginBottom: '1rem',
  };

  const buttonsContainerBg = isSpecialTheme
    ? "bg-zinc-900/60 dark:bg-zinc-900/60 border-zinc-800/50"
    : "bg-white/50 dark:bg-gray-900/50 border-white/30 dark:border-gray-700/30";
  const buttonIconColor = isSpecialTheme
    ? "text-white/70 dark:text-white/70"
    : "text-gray-600 dark:text-gray-300";
  const buttonHoverIconColor = isSpecialTheme
    ? "hover:text-white dark:hover:text-white"
    : "hover:text-gray-800 dark:hover:text-gray-100";
  const deleteHoverColor = isSpecialTheme
    ? "hover:text-red-400 dark:hover:text-red-400"
    : "hover:text-red-500 dark:hover:text-red-400";
  const separatorColor = isSpecialTheme ? "bg-white/30" : "bg-gray-400 dark:bg-gray-500";

  const FeatureComponent = featureComponents[id].component;

  return (
    <motion.div
      ref={combinedRef}
      style={style}
      {...attributes}
      animate={isHighlighted ? {
        x: [0, -8, 8, -8, 8, 0],
        rotate: [0, -1, 1, -1, 1, 0],
        scale: [1, 1.05, 1, 1.05, 1],
        transition: { duration: 0.6, ease: "easeInOut", repeat: 1 }
      } : {}}
      className={`relative group transition-all duration-300 ease-in-out break-inside-avoid rounded-xl ${isHighlighted ? "ring-4 ring-primary ring-opacity-50 shadow-[0_0_30px_rgba(var(--primary-rgb),0.6)] z-10" : ""}`}
    >
      <div className={`absolute -top-3 right-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 flex items-center gap-1.5 backdrop-blur-lg border rounded-full px-2 py-1 shadow-md transition-all duration-200 z-40 ${buttonsContainerBg}`}>
        <button
          onClick={onRemove}
          className={`rounded-full p-1 transition-colors ${buttonIconColor} ${deleteHoverColor}`}
          aria-label={`Hide ${id} feature`}
        >
          <IconEyeOff size={16} />
        </button>
        <div className={`w-px h-3 ${separatorColor}`}></div>
        <div
          {...listeners}
          className={`cursor-grab active:cursor-grabbing p-1 rounded-full transition-colors ${buttonIconColor} ${buttonHoverIconColor}`}
          aria-label={`Drag ${id} feature`}
        >
          <IconGripVertical size={16} />
        </div>
      </div>

      <div>
        <WithProGuard
          subscriptionStatus={subscriptionStatus}
          isProOnly={!!isPro}
        >
          <FeatureComponent />
        </WithProGuard>
      </div>
    </motion.div>
  );
}