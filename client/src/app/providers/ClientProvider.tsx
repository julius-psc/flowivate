// app/providers/ClientProvider.tsx
"use client"; // This directive is essential

import React, { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

// You might want to move DashboardProvider here too if it's client-side context
// import { DashboardProvider } from "../context/DashboardContext";

export default function ClientProvider({ children }: { children: ReactNode }) {
  // Use React.useState to ensure QueryClient is only created once per component instance
  // This prevents recreating the client on every render within this client boundary
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Example: Data considered fresh for 1 minute
            staleTime: 1000 * 60 * 1,
            // Example: Refetch data when the browser window regains focus
            refetchOnWindowFocus: true,
          },
        },
      })
  );

  return (
    // SessionProvider should usually wrap QueryClientProvider if your queries
    // depend on the session status or data.
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        {/* If DashboardProvider is client context, it can go here */}
        {/* <DashboardProvider> */}
              {children}
        {/* </DashboardProvider> */}

        {/* Optional: React Query DevTools for debugging */}
        {/* These will only show up in development environments */}
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </SessionProvider>
  );
}
