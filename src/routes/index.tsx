import {
  component$,
  useStore,
  useTask$,
  useVisibleTask$,
  $,
  useStylesScoped$,
} from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { server$ } from "@builder.io/qwik-city";
import styles from "./index.css?inline";

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
      <main class="site-content">
        <section class="hero">
          <div class="hero-content">
            <h2>{channelName}</h2>
            <p class="hero-description">{channelDescription}</p>
            <div class="hero-features">
              <span class="feature-tag">🚫 Ad-Free</span>
              <span class="feature-tag">🔒 Private</span>
              <span class="feature-tag">⚡ Fast Streaming</span>
              <span class="feature-tag">📱 Mobile Ready</span>
            </div>
            <div class="hero-actions">
              <a href="/videos" class="cta-primary">
                📺 Browse Videos
              </a>
              {!authStore.isAuthenticated && (
                <a href="/admin" class="cta-secondary">
                  🔧 Admin Access
                </a>
              )}
            </div>
          </div>

          {authStore.isAuthenticated && (
            <div class="admin-notice">
              <h3>🔓 Administrator Access Active</h3>
              <p>
                Welcome back, <strong>{authStore.username}</strong>! You have
                full control over your video platform.
              </p>
              <div class="admin-actions">
                <a href="/admin" class="btn btn-primary btn-lg">
                  🎛️ Dashboard
                </a>
                <a href="/admin/videos" class="btn btn-primary btn-lg">
                  📹 Manage Videos
                </a>
                <a href="/admin/config" class="btn btn-primary btn-lg">
                  ⚙️ Settings
                </a>
                <button
                  onClick$={handleLogout}
                  class="btn btn-destructive btn-lg"
                >
                  🚪 Logout
                </button>
              </div>
            </div>
          )}
        </section>

        <section class="features">
          <div class="section-header">
            <h3>Platform Features</h3>
            <p>
              Professional video hosting with complete control over your content
            </p>
          </div>

          <div class="feature-grid">
            <div class="feature-card">
              <div class="feature-icon">🎬</div>
              <h4>HLS Streaming</h4>
              <p>
                Automatic video conversion for adaptive quality streaming across
                all devices
              </p>
              <a href="/videos" class="feature-link">
                Browse Library →
              </a>
            </div>

            <div class="feature-card">
              <div class="feature-icon">📤</div>
              <h4>Easy Upload</h4>
              <p>
                Drag and drop video files up to 5GB. Supports multiple formats
                including MP4, AVI, MOV
              </p>
            </div>

            <div class="feature-card">
              <div class="feature-icon">🔐</div>
              <h4>Secure Access</h4>
              <p>
                Protected admin area with JWT authentication and encrypted
                session management
              </p>
            </div>

            <div class="feature-card">
              <div class="feature-icon">🌐</div>
              <h4>Universal Playback</h4>
              <p>
                Works on all modern browsers and devices with responsive design
              </p>
            </div>

            <div class="feature-card">
              <div class="feature-icon">⚡</div>
              <h4>Fast & Clean</h4>
              <p>
                Lightweight interface focused on your content without ads or
                distractions
              </p>
            </div>

            <div class="feature-card">
              <div class="feature-icon">🐳</div>
              <h4>Easy Deployment</h4>
              <p>
                Docker ready for simple setup and environment-based
                configuration
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Video Channel - Self-Hosted Platform",
  meta: [
    {
      name: "description",
      content:
        "Watch videos on my self-hosted streaming platform. High-quality HLS streaming with no ads and complete privacy.",
    },
    {
      name: "keywords",
      content: "video, streaming, self-hosted, HLS, video platform, ad-free",
    },
    {
      name: "viewport",
      content: "width=device-width, initial-scale=1.0",
    },
  ],
};
