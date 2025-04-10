"use client";

import { useDashboard } from '@/context/DashboardContext';
import { featureComponents } from '@/components/dashboard/features/featureMap';
import TimeDisplay from '@/components/dashboard/TimeDisplay';
import Link from 'next/link';

export default function Dashboard() {
  const { selectedFeatures } = useDashboard(); // Get selected features from context

  return (
    <div className="w-full h-full flex-1 flex flex-col"> {/* Make the Dashboard component take full available space */}
      {selectedFeatures.length === 0 ? (
        // --- Empty State ---
        // Use TimeDisplay centered vertically and horizontally
        <div className="flex flex-col items-center justify-center flex-1"> {/* Make this inner div take full available space */}
           <TimeDisplay isCenteredFullScreen={false} /> {/* Let the outer flex handle centering */}
           <div className="mt-8 text-center p-6 border border-dashed border-gray-400 dark:border-gray-700 rounded-lg">
              <p className="text-gray-600 dark:text-gray-400">Your dashboard is empty.</p>
              <Link href="/dashboard/personal" className="text-blue-500 hover:underline mt-2 inline-block">
                 Add features
              </Link>
           </div>
        </div>
      ) : (
        // --- Populated State ---
        <div className="flex flex-col flex-1"> {/* Ensure this wraps the time and grid, taking full space */}
          <div className="flex justify-center items-center py-4"> {/* Center the time display */}
            <TimeDisplay />
          </div>

          {/* Masonry-like grid using CSS Columns */}
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4 overflow-y-auto flex-1"> {/* Make the grid scrollable if needed and take remaining space */}
            {selectedFeatures.map((featureKey) => {
              const FeatureComponent = featureComponents[featureKey];
              return (
                // Important: Apply break-inside-avoid to prevent items from splitting across columns
                <div key={featureKey} className="break-inside-avoid">
                  <FeatureComponent />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}