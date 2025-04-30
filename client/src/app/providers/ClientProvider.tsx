"use client"; // This directive is essential

import React, { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster as SonnerToaster } from "sonner";

// Define props if you want to pass them from layout (Optional)
// interface ClientProviderProps {
//   children: ReactNode;
//   toasterPosition?: React.ComponentProps<typeof SonnerToaster>['position'];
//   toasterRichColors?: boolean;
// }

export default function ClientProvider({ children }: { children: ReactNode }) {
// Or use the interface: export default function ClientProvider({ children, toasterPosition, toasterRichColors }: ClientProviderProps) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <SessionProvider>
      {/* SonnerToaster is rendered here, applying props directly */}
      <SonnerToaster
        position="top-center" // Applied here
        richColors          // Applied here
        theme={'system'}    // Your existing theme setting
        className="toaster group"
        toastOptions={{
          classNames: {
            toast:
              'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
            description: 'group-[.toast]:text-muted-foreground',
            actionButton:
              'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
            cancelButton:
              'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
          },
        }}
        // Pass props from ClientProvider if using the optional interface above:
        // position={toasterPosition || "top-center"}
        // richColors={toasterRichColors}
      />
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </SessionProvider>
  );
}