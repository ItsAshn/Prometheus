import { $, component$, Slot, useStore, useTask$ } from "@builder.io/qwik";
import { server$ } from "@builder.io/qwik-city";
import { Footer } from "~/components/footer/footer";
import { Sidebar } from "~/components/sidebar/sidebar";
import { ThemeToggle } from "~/components/theme-toggle/theme-toggle";
import {
  checkAdminAuthServer,
  logoutAdminServer,
} from "~/lib/admin-auth-utils";

interface SiteConfig {
  channelName: string;
  channelDescription: string;
  lastUpdated: string;
}

export default component$(() => {
  const authStore = useStore({
    isAuthenticated: false,
    isLoading: true,
    username: "",
  });

  const siteStore = useStore({
    config: null as SiteConfig | null,
    isLoadingConfig: true,
  });

  // Server function to load site configuration
  const loadSiteConfig = server$(async function () {
    try {
      const response = await fetch(`${this.url.origin}/api/site-config`);
      if (response.ok) {
        const config = await response.json();
        return { success: true, config };
      }
      return { success: false, config: null };
    } catch {
      return { success: false, config: null };
    }
  });

  // Check authentication status and load site config on component load
  useTask$(async () => {
    const [authStatus, configResult] = await Promise.all([
      checkAdminAuthServer(),
      loadSiteConfig(),
    ]);

    authStore.isAuthenticated = authStatus.isAuthenticated;
    authStore.username = authStatus.user?.username || "";
    authStore.isLoading = false;

    if (configResult.success) {
      siteStore.config = configResult.config;
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
    <div>
      <Sidebar
        channelName={channelName}
        isAuthenticated={authStore.isAuthenticated}
        username={authStore.username}
        isLoading={authStore.isLoading}
        onLogout={handleLogout}
      />
      <ThemeToggle />
      <Slot />
      <Footer />
    </div>
  );
});
