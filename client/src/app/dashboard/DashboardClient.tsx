"use client";

import React, { useState, useEffect } from "react";
import { useDashboard } from "@/context/DashboardContext";
import { featureComponents } from "@/components/dashboard/features/featureMap";
import TimeDisplay from "@/components/dashboard/TimeDisplay";
import Link from "next/link";
import { useTheme } from "next-themes";
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
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Masonry from "react-masonry-css";
import type { FeatureKey } from "@/components/dashboard/features/featureMap";
import WithProGuard from "@/components/dashboard/recyclable/withProGuard";

interface DashboardClientProps {
  subscriptionStatus: "active" | "canceled" | "past_due" | "free";
}

export default function DashboardClient({
  subscriptionStatus,
}: DashboardClientProps) {
  const { selectedFeatures, removeFeature, reorderFeatures } = useDashboard();
  const [activeId, setActiveId] = useState<FeatureKey | null>(null);
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const emptyTextColor = !mounted
    ? "text-transparent"
    : theme === "jungle" || theme === "ocean"
    ? "text-white"
    : "text-gray-500 dark:text-gray-400";

  const addFeaturesTextColor = !mounted
    ? "text-transparent"
    : theme === "jungle" || theme === "ocean"
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
              className="flex items-center gap-2 px-6 transition-colors text-primary-white hover:text-primary-black focus:outline-none"
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
              strategy={verticalListSortingStrategy}
            >
              <Masonry
                breakpointCols={breakpointColumnsObj}
                className="flex p-4"
                columnClassName="flex flex-col"
              >
                {selectedFeatures.map((featureKey) => {
                  const { component: FeatureComponent, isPro } =
                    featureComponents[featureKey];
                  return (
                    <SortableFeature
                      key={featureKey}
                      id={featureKey}
                      onRemove={() => removeFeature(featureKey)}
                      FeatureComponent={() => (
                        <WithProGuard
                          subscriptionStatus={subscriptionStatus}
                          isProOnly={!!isPro}
                        >
                          <FeatureComponent />
                        </WithProGuard>
                      )}
                    />
                  );
                })}
              </Masonry>
            </SortableContext>

            <DragOverlay>
              {activeId && (
                <div className="rounded-xl border border-dashed border-gray-400 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 p-3 shadow-lg">
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
  id: string;
  FeatureComponent: React.FC;
  onRemove: () => void;
}

function SortableFeature({
  id,
  FeatureComponent,
  onRemove,
}: SortableFeatureProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform) || undefined,
    transition: transition || undefined,
    zIndex: isDragging ? 50 : "auto",
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="relative group rounded-xl transition-all duration-200 ease-in-out bg-background break-inside-avoid"
    >
      {/* Top buttons */}
      <div className="absolute -top-4 -right-2 opacity-0 group-hover:opacity-100 flex items-center gap-2 backdrop-blur-lg bg-white/20 dark:bg-gray-900/20 border border-white/30 dark:border-gray-700/30 rounded-full px-3 py-1.5 shadow-lg transition-all duration-200 z-40">
        <button
          onClick={onRemove}
          className="text-gray-600 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400 rounded-full p-1 transition-colors"
          aria-label={`Hide ${id} feature`}
        >
          <IconEyeOff size={16} />
        </button>
        <div className="w-1 h-1 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
        <div
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 p-1 rounded-full transition-colors"
          aria-label={`Drag ${id} feature`}
        >
          <IconGripVertical size={16} />
        </div>
      </div>

      {/* Actual Feature */}
      <div className="p-2">
        <FeatureComponent />
      </div>
    </div>
  );
}