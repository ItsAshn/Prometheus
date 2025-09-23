import { component$, useStore, useVisibleTask$, $ } from "@builder.io/qwik";

interface ThemeStore {
  isDark: boolean;
}

export const ThemeToggle = component$(() => {
  const theme = useStore<ThemeStore>({
    isDark: false,
  });

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(() => {
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    theme.isDark = savedTheme === "dark" || (!savedTheme && prefersDark);

    // Apply theme to document
    if (theme.isDark) {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  });

  const toggleTheme = $(() => {
    theme.isDark = !theme.isDark;

    if (theme.isDark) {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("theme", "light");
    }
  });

  return (
    <button
      class="theme-toggle"
      onClick$={toggleTheme}
      aria-label="Toggle theme"
      title={theme.isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme.isDark ? "☀️" : "🌙"}
    </button>
  );
});
