import {
  $,
  component$,
  Slot,
  useStylesScoped$,
  useVisibleTask$,
  useSignal,
} from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
import { LuMonitor, LuUser, LuMenu, LuX } from "@qwikest/icons/lucide";
import { ThemeToggle } from "~/components/theme-toggle/theme-toggle";
import { Footer } from "~/components/footer/footer";
import { SearchBar } from "~/components/search/search-bar";
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
  const isMobileMenuOpen = useSignal(false);
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

  const toggleMobileMenu = $(() => {
    isMobileMenuOpen.value = !isMobileMenuOpen.value;
  });

  return (
    <div class="layout-container">
      {/* Skip to main content link for keyboard navigation */}
      <a href="#main-content" class="skip-to-content">
        Skip to main content
      </a>

      <header class="top-header" role="banner">
        <div class="header-content">
          <div class="header-left">
            <a href="/" class="logo-link" aria-label="Home">
              <span class="logo-icon" aria-hidden="true">
                <LuMonitor />
              </span>
              <span class="logo-text">{channelName}</span>
            </a>
            <nav class="nav-links" aria-label="Primary navigation">
              <a
                href="/"
                class="nav-link"
                aria-current={
                  typeof window !== "undefined" &&
                  window.location.pathname === "/"
                    ? "page"
                    : undefined
                }
              >
                Home
              </a>
              <a
                href="/videos"
                class="nav-link"
                aria-current={
                  typeof window !== "undefined" &&
                  window.location.pathname === "/videos"
                    ? "page"
                    : undefined
                }
              >
                Videos
              </a>
            </nav>
          </div>

          {/* Search Bar - Desktop */}
          <div class="header-search" role="search">
            <SearchBar placeholder="Search videos..." />
          </div>

          <div class="header-right">
            <ThemeToggle />
            {auth.value.isAuthenticated ? (
              <>
                <div class="user-info" aria-label="User information">
                  <span aria-hidden="true">
                    <LuUser />
                  </span>
                  <span class="user-name">{auth.value.user?.username}</span>
                </div>
                <a
                  href="/admin"
                  class="btn-header btn-admin"
                  aria-label="Go to admin dashboard"
                >
                  Dashboard
                </a>
                <button
                  onClick$={handleLogout}
                  class="btn-header btn-logout"
                  aria-label="Logout from admin account"
                >
                  Logout
                </button>
              </>
            ) : (
              <a
                href="/admin"
                class="btn-header btn-admin"
                aria-label="Admin login"
              >
                Admin Login
              </a>
            )}

            {/* Mobile Menu Toggle */}
            <button
              class="mobile-menu-toggle"
              onClick$={toggleMobileMenu}
              aria-label="Toggle mobile menu"
              aria-expanded={isMobileMenuOpen.value}
            >
              <span class="hamburger-icon">
                {isMobileMenuOpen.value ? <LuX /> : <LuMenu />}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen.value && (
          <nav class="mobile-nav" aria-label="Mobile navigation">
            <a href="/" class="mobile-nav-link" onClick$={toggleMobileMenu}>
              Home
            </a>
            <a
              href="/videos"
              class="mobile-nav-link"
              onClick$={toggleMobileMenu}
            >
              Videos
            </a>
            <a
              href="/about"
              class="mobile-nav-link"
              onClick$={toggleMobileMenu}
            >
              About
            </a>
            {auth.value.isAuthenticated && (
              <a
                href="/admin"
                class="mobile-nav-link"
                onClick$={toggleMobileMenu}
              >
                Dashboard
              </a>
            )}
          </nav>
        )}
      </header>

      <main class="main-content" id="main-content" role="main">
        <Slot />
      </main>

      <Footer channelName={channelName} />
    </div>
  );
});
