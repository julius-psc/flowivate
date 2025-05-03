import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css"; // Make sure your global styles are imported

// Import the necessary providers
import ClientProvider from "@/app/providers/ClientProvider"; // Adjust path if necessary
import ThemeProvider from "@/app/providers/ThemeProvider"; // Adjust path if necessary

// Setup Geist fonts (ensure these paths/variables are correct for your project)
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Define metadata for your application
export const metadata: Metadata = {
  title: "Your App Title", // Customize your title
  description: "Your App Description", // Customize your description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Add suppressHydrationWarning as recommended by next-themes
    // Ensure NO whitespace/newlines between <html> opening tag and <body> opening tag
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class" // Use class-based theme switching
          defaultTheme="system" // Default to system preference
          enableSystem // Allow syncing with system preference
          disableTransitionOnChange // Prevent transitions on theme change initially
        >
          {/* ClientProvider might be wrapping specific context or libraries */}
          {/* Ensure its placement here is correct for your app's logic */}
          <ClientProvider>{children}</ClientProvider>
        </ThemeProvider>
      </body>
      {/* Ensure NO whitespace/newlines between </body> closing tag and </html> closing tag */}
    </html>
  );
}