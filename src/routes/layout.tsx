import {
  $,
  component$,
  Slot,
  useStylesScoped$,
  useVisibleTask$,
} from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
import { ThemeToggle } from "~/components/theme-toggle/theme-toggle";
import {
  checkAdminAuthServer,
  logoutAdminServer,
} from "~/lib/admin-auth-utils";
import { loadSiteConfigServer } from "~/lib/data-loaders";
import { getCurrentThemeCSS } from "~/lib/theme-utils";
import styles from "./layout.css?inline";

// Shared data loaders - loaded once per request, available to all child routes
export const useThemeLoader = routeLoader$(async () => {
  const themeCSS = await getCurrentThemeCSS();
  return { themeCSS };
});

export const useAuthLoader = routeLoader$(async () => {
  return await checkAdminAuthServer();
});

export const useSiteConfigLoader = routeLoader$(async () => {
  return await loadSiteConfigServer();
});

export default component$(() => {
  const theme = useThemeLoader();
  const auth = useAuthLoader();
  const siteConfig = useSiteConfigLoader();
  useStylesScoped$(styles);

  // Inject theme CSS into document head
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ cleanup }) => {
    const styleId = "dynamic-theme-css";
    let styleEl = document.getElementById(styleId) as HTMLStyleElement;

    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }

    styleEl.textContent = theme.value.themeCSS;

    cleanup(() => {
      styleEl?.remove();
    });
  });

  const handleLogout = $(async () => {
    try {
      await logoutAdminServer();

      // Clear client-side cookie as additional measure
      if (typeof document !== "undefined") {
        document.cookie =
          "admin-auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      }

      // Force page reload to clear auth state
      window.location.reload();
    } catch {
      console.error("Logout failed");
    }
  });

  // Use site config for display, with fallbacks
  const channelName = siteConfig.value?.channelName || "Your Video Channel";

  return (
    <div class="layout-container">
      <header class="top-header">
        <div class="header-content">
          <div class="header-left">
            <a href="/" class="logo-link">
              <span class="logo-icon">📺</span>
              <span class="logo-text">{channelName}</span>
            </a>
            <nav class="nav-links">
              <a href="/" class="nav-link">
                Home
              </a>
              <a href="/videos" class="nav-link">
                Videos
              </a>
            </nav>
          </div>

          <div class="header-right">
            <ThemeToggle />
            {auth.value.isAuthenticated ? (
              <>
                <div class="user-info">
                  <span>👤</span>
                  <span class="user-name">{auth.value.user?.username}</span>
                </div>
                <a href="/admin" class="btn-header btn-admin">
                  Dashboard
                </a>
                <button onClick$={handleLogout} class="btn-header btn-logout">
                  Logout
                </button>
              </>
            ) : (
              <a href="/admin" class="btn-header btn-admin">
                Admin Login
              </a>
            )}
          </div>
        </div>
      </header>

      <main class="main-content">
        <Slot />
      </main>
    </div>
  );
});
