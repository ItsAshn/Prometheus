import {
  component$,
  useSignal,
  useVisibleTask$,
  $,
  useStylesScoped$,
} from "@builder.io/qwik";
import { LuSun, LuMoon } from "@qwikest/icons/lucide";
import styles from "./theme-toggle.css?inline";

export const ThemeToggle = component$(() => {
  useStylesScoped$(styles);
  const currentTheme = useSignal<"light" | "dark">("light");

  // Load theme on mount
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    const theme = savedTheme || (prefersDark ? "dark" : "light");

    currentTheme.value = theme as "light" | "dark";
    document.documentElement.setAttribute("data-theme", theme);
  });

  const toggleTheme$ = $(() => {
    const newTheme = currentTheme.value === "light" ? "dark" : "light";
    currentTheme.value = newTheme;
    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  });

  return (
    <button
      class="theme-toggle"
      onClick$={toggleTheme$}
      aria-label={`Switch to ${currentTheme.value === "light" ? "dark" : "light"} mode`}
      title={`Switch to ${currentTheme.value === "light" ? "dark" : "light"} mode`}
    >
      {currentTheme.value === "light" ? (
        <span class="theme-icon">
          <LuMoon />
        </span>
      ) : (
        <span class="theme-icon">
          <LuSun />
        </span>
      )}
    </button>
  );
});
