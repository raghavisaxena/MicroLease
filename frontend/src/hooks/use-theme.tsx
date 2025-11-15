import { useEffect, useState } from "react";

type Theme = "light" | "dark";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const stored = localStorage.getItem("theme");
      if (stored === "light" || stored === "dark") return stored;
    } catch (e) {}
    // default: light mode
    return "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    try {
      localStorage.setItem("theme", theme);
    } catch (e) {}
  }, [theme]);

  // If a previous saved preference was 'dark', override it to 'light' so users see the light theme by default now.
  // This is an explicit change requested by the user; it only runs once on mount.
  useEffect(() => {
    try {
      const stored = localStorage.getItem('theme');
      if (stored === 'dark') {
        setTheme('light');
        localStorage.setItem('theme', 'light');
      }
    } catch (e) {}
  }, []);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return { theme, toggleTheme } as const;
}

export default useTheme;
