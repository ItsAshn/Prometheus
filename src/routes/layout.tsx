import {
  $,
  component$,
  Slot,
  useStore,
  useTask$,
  useStylesScoped$,
} from "@builder.io/qwik";
import { ThemeToggle } from "~/components/theme-toggle/theme-toggle";
import {
  checkAdminAuthServer,
  logoutAdminServer,
} from "~/lib/admin-auth-utils";
import { loadSiteConfigServer } from "~/lib/data-loaders";
import styles from "./layout.css?inline";

interface SiteConfig {
  channelName: string;
  channelDescription: string;
  lastUpdated: string;
}

export default component$(() => {
  useStylesScoped$(styles);

  const authStore = useStore({
    isAuthenticated: false,
    isLoading: true,
    username: "",
  });

  const siteStore = useStore({
    config: null as SiteConfig | null,
    isLoadingConfig: true,
  });

  // Check authentication status and load site config on component load
  useTask$(async () => {
    const [authStatus, config] = await Promise.all([
      checkAdminAuthServer(),
      loadSiteConfigServer(),
    ]);

    authStore.isAuthenticated = authStatus.isAuthenticated;
    authStore.username = authStatus.user?.username || "";
    authStore.isLoading = false;

    if (config) {
      siteStore.config = config;
    }
    siteStore.isLoadingConfig = false;
  });

  const handleLogout = $(async () => {
    try {
      await logoutAdminServer();
      authStore.isAuthenticated = false;
      authStore.username = "";

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
  const channelName = siteStore.config?.channelName || "Your Video Channel";

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
            {!authStore.isLoading && (
              <>
                {authStore.isAuthenticated ? (
                  <>
                    <div class="user-info">
                      <span>👤</span>
                      <span class="user-name">{authStore.username}</span>
                    </div>
                    <a href="/admin" class="btn-header btn-admin">
                      Dashboard
                    </a>
                    <button
                      onClick$={handleLogout}
                      class="btn-header btn-logout"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <a href="/admin" class="btn-header btn-admin">
                    Admin Login
                  </a>
                )}
              </>
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
