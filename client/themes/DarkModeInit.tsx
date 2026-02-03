"use client";

import { useLayoutEffect } from "react";

export default function DarkModeInit() {
    useLayoutEffect(() => {
        const applyTheme = () => {
            try {
                const theme = localStorage.getItem("theme") || "system";
                const root = document.documentElement;

                if (theme === "system") {
                    const prefersDark = window.matchMedia(
                        "(prefers-color-scheme: dark)"
                    ).matches;
                    root.classList.toggle("dark", prefersDark);
                } else {
                    root.classList.toggle("dark", theme === "dark");
                }
            } catch (e) {
                console.error("Error initializing dark mode", e);
            }
        };

        // Apply on mount
        applyTheme();

        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

        // Handle system theme changes
        const handleChange = () => applyTheme();
        mediaQuery.addEventListener("change", handleChange);

        // Handle cross-tab updates
        window.addEventListener("storage", handleChange);

        return () => {
            mediaQuery.removeEventListener("change", handleChange);
            window.removeEventListener("storage", handleChange);
        };
    }, []);

    return null;
}
