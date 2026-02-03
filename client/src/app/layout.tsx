import "./globals.css";
import ThemeProvider from "../../themes/ThemeProvider";
import DarkModeInit from "../../themes/DarkModeInit";
import { Metadata } from "next";
import { Toaster } from "sonner";
import CookieConsent from "../components/CookieConsent";

export const metadata: Metadata = {
  title: "Flowivate",
  description: "Your productivity and focus hub.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          href="https://api.fontshare.com/v2/css?f[]=general-sans@400,500,600,700&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem("theme") || "system";
                const root = document.documentElement;
                if (theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
                  root.classList.add("dark");
                } else {
                  root.classList.remove("dark");
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <CookieConsent />
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="default"
          storageKey="background-theme"
          disableTransitionOnChange
        >
          <DarkModeInit />
          <Toaster
            position="top-center"
            richColors
            theme="dark"
          />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
