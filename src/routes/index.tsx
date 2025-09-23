import {
  component$,
  useStore,
  useTask$,
  useVisibleTask$,
  $,
} from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { server$ } from "@builder.io/qwik-city";
import { ThemeToggle } from "~/components/theme-toggle/theme-toggle";

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

  // Server function to check admin auth status
  const checkAdminAuth = server$(async function () {
    try {
      const verifyResponse = await fetch(`${this.url.origin}/api/auth/verify`, {
        headers: {
          Cookie: this.request.headers.get("cookie") || "",
        },
      });

      if (verifyResponse.ok) {
        const data = await verifyResponse.json();
        return {
          isAuthenticated: true,
          username: data.user.username,
        };
      }

      return {
        isAuthenticated: false,
        username: "",
      };
    } catch {
      return {
        isAuthenticated: false,
        username: "",
      };
    }
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

  // Server function for admin logout
  const logoutAdmin = server$(async function () {
    try {
      const response = await fetch(`${this.url.origin}/api/auth/verify`, {
        method: "POST",
        headers: {
          Cookie: this.request.headers.get("cookie") || "",
        },
      });

      // Clear the cookie on the server side as well
      this.cookie.delete("admin-auth-token", { path: "/" });

      return response.ok;
    } catch {
      return false;
    }
  });

  // Check authentication status and load site config on component load
  useTask$(async () => {
    const [authStatus, configResult] = await Promise.all([
      checkAdminAuth(),
      loadSiteConfig(),
    ]);

    console.log("Auth status check:", authStatus); // Debug log
    authStore.isAuthenticated = authStatus.isAuthenticated;
    authStore.username = authStatus.username;
    authStore.isLoading = false;

    if (configResult.success) {
      siteStore.config = configResult.config;
    }
    siteStore.isLoadingConfig = false;
  });

  // Also check when page becomes visible (after redirect)
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(() => {
    const recheckAuth = async () => {
      const status = await checkAdminAuth();
      console.log("Visible task auth check:", status); // Debug log
      authStore.isAuthenticated = status.isAuthenticated;
      authStore.username = status.username;
      authStore.isLoading = false;
    };
    recheckAuth();
  });

  const handleLogout = $(async () => {
    try {
      await logoutAdmin();
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
  const channelDescription =
    siteStore.config?.channelDescription ||
    "Welcome to my self-hosted video streaming platform. Here you can find all my videos and content.";

  return (
    <div class="public-site">
      <ThemeToggle />
      <header class="site-header">
        <h1>{channelName}</h1>
        <nav class="site-nav">
          {authStore.isLoading ? (
            <div class="auth-loading">Loading...</div>
          ) : authStore.isAuthenticated ? (
            <div class="admin-status">
              <span class="admin-welcome">🔧 Admin: {authStore.username}</span>
              <a href="/admin" class="admin-link">
                Dashboard
              </a>
              <button onClick$={handleLogout} class="logout-link">
                Logout
              </button>
            </div>
          ) : (
            <a href="/admin" class="admin-link">
              Admin Login
            </a>
          )}
        </nav>
      </header>

      <main class="site-content">
        <section class="hero">
          <h2>{channelName}</h2>
          <p>{channelDescription}</p>
          {authStore.isAuthenticated && (
            <div class="admin-notice">
              <h3>🔓 Administrator Access Active</h3>
              <p>
                Welcome back, <strong>{authStore.username}</strong>!
              </p>
              <p>
                You are currently logged in as an administrator and have full
                access to the system.
              </p>
              <div class="admin-actions">
                <a href="/admin" class="admin-action-btn">
                  🎛️ Open Admin Dashboard
                </a>
                <a href="/admin/config" class="admin-action-btn">
                  🎨 Site Configuration
                </a>
                <button onClick$={handleLogout} class="logout-action-btn">
                  🚪 Logout
                </button>
              </div>
            </div>
          )}
        </section>

        <section class="features">
          <div class="feature-grid">
            <div class="feature-card">
              <h3>🎬 Video Library</h3>
              <p>Watch videos with high-quality HLS streaming</p>
              <p class="feature-action">
                <a href="/videos" class="feature-link">
                  → Browse Videos
                </a>
              </p>
            </div>

            <div class="feature-card">
              <h3>🌐 Public Access</h3>
              <p>This page is accessible to everyone on the internet</p>
            </div>

            <div class="feature-card">
              <h3>🔒 Secure Admin</h3>
              <p>Admin area is protected and accessible via /admin route</p>
              {authStore.isAuthenticated && (
                <p class="admin-access">
                  <a href="/admin" class="feature-admin-link">
                    → Go to Admin Dashboard
                  </a>
                </p>
              )}
            </div>

            <div class="feature-card">
              <h3>🐳 Docker Ready</h3>
              <p>Configured through environment variables in Docker Compose</p>
            </div>
          </div>
        </section>
      </main>

      <footer class="site-footer">
        <p>&copy; 2025 {channelName}</p>
      </footer>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Your Video Channel",
  meta: [
    {
      name: "description",
      content:
        "Welcome to my self-hosted video streaming platform. Here you can find all my videos and content.",
    },
  ],
};
