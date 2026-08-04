"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from "next-themes";

const ThemeContext = createContext({
  theme: "light",
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="light" forcedTheme="light" enableSystem={false}>
      <ThemeBridge>{children}</ThemeBridge>
    </NextThemesProvider>
  );
}

function ThemeBridge({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useNextTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggle = () => {
    setTheme("light");
  };

  const currentTheme = mounted ? (theme || "light") : "light";

  return (
    <ThemeContext.Provider value={{ theme: currentTheme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
