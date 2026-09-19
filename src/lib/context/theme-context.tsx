"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = "light" | "dark" | "midnight" | "soft-light";

export interface ThemeOption {
  id: Theme;
  label: string;
  description: string;
}

export const THEMES: ThemeOption[] = [
  {
    id: "light",
    label: "Light",
    description: "Clean white & original CRM purple",
  },
  {
    id: "dark",
    label: "Dark",
    description: "Dark gray background with purple accent",
  },
  {
    id: "midnight",
    label: "Midnight",
    description: "Deep premium navy with purple glow",
  },
  {
    id: "soft-light",
    label: "Soft Light",
    description: "Softer off-white background with comfortable contrast",
  },
];

const THEME_STORAGE_KEY = "crm-theme";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  themes: ThemeOption[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
      if (
        savedTheme &&
        (savedTheme === "light" ||
          savedTheme === "dark" ||
          savedTheme === "midnight" ||
          savedTheme === "soft-light")
      ) {
        setThemeState(savedTheme);
        document.documentElement.setAttribute("data-theme", savedTheme);
      } else {
        document.documentElement.setAttribute("data-theme", "light");
      }
    } catch {
      document.documentElement.setAttribute("data-theme", "light");
    }
    setMounted(true);
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (e) {
      console.warn("Failed to persist theme to localStorage:", e);
    }
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
