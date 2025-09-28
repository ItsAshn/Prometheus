import {
  component$,
  useStore,
  useVisibleTask$,
  $,
  useStylesScoped$,
} from "@builder.io/qwik";
import styles from "./theme-toggle.css?inline";

interface ThemeStore {
  isDark: boolean;
  isVisible: boolean;
}

export const ThemeToggle = component$(() => {
  useStylesScoped$(styles);
  const theme = useStore<ThemeStore>({
    isDark: false,
    isVisible: true,
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

    // Scroll detection for hiding/showing toggle
    let lastScrollY = window.scrollY;
    let scrollTimeout: number;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Hide on scroll down, show on scroll up or when at top
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        theme.isVisible = false;
      } else {
        theme.isVisible = true;
      }

      lastScrollY = currentScrollY;

      // Auto-show after scroll stops
      clearTimeout(scrollTimeout);
      scrollTimeout = window.setTimeout(() => {
        theme.isVisible = true;
      }, 1000);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimeout);
    };
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
    <div
      class={`theme-toggle-container ${theme.isVisible ? "visible" : "hidden"}`}
    >
      <button
        class="theme-toggle"
        onClick$={toggleTheme}
        aria-label="Toggle theme"
        title={theme.isDark ? "Switch to light mode" : "Switch to dark mode"}
      >
        <span class="theme-icon">{theme.isDark ? "☀️" : "🌙"}</span>
        <span class="theme-label">{theme.isDark ? "Light" : "Dark"}</span>
      </button>
    </div>
  );
});
