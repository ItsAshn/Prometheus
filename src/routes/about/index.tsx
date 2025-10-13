import {
  component$,
  useStylesScoped$,
  useStore,
  useTask$,
  useSignal,
} from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { server$ } from "@builder.io/qwik-city";
import styles from "./index.css?inline";
import { ChannelHeader } from "~/components/channel/channel-header";

interface SiteConfig {
  channelName: string;
  channelDescription: string;
  aboutText?: string;
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

  const videoCount = useSignal(0);

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

  // Server function to get video count
  const getVideoCount = server$(async function () {
    try {
      const response = await fetch(`${this.url.origin}/api/video/list`);
      if (response.ok) {
        const result = await response.json();
        return result.success ? result.videos.length : 0;
      }
      return 0;
    } catch {
      return 0;
    }
  });

  // Check authentication status and load site config on component load
  useTask$(async () => {
    const [authStatus, configResult, count] = await Promise.all([
      checkAdminAuth(),
      loadSiteConfig(),
      getVideoCount(),
    ]);

    authStore.isAuthenticated = authStatus.isAuthenticated;
    authStore.username = authStatus.username;
    authStore.isLoading = false;

    if (configResult.success) {
      siteStore.config = configResult.config;
    }
    siteStore.isLoadingConfig = false;

    videoCount.value = count;
  });

  const channelName = siteStore.config?.channelName || "Your Video Channel";
  const channelDescription =
    siteStore.config?.channelDescription ||
    "Welcome to my self-hosted video streaming platform.";
  const aboutText =
    siteStore.config?.aboutText ||
    "Welcome to my channel! This is a self-hosted video streaming platform where I share my content. All videos are hosted on my own infrastructure, ensuring complete privacy and control. Enjoy ad-free streaming with adaptive quality based on your connection speed.";

  return (
    <div class="about-page">
      <ChannelHeader
        channelName={channelName}
        channelDescription={channelDescription}
        videoCount={videoCount.value}
        isAuthenticated={authStore.isAuthenticated}
        activeTab="about"
      />
      <div class="about-container">
        <main class="about-content">
          <div class="about-header">
            <h2>📖 About This Channel</h2>
          </div>

          <div class="about-text-section">
            {siteStore.isLoadingConfig ? (
              <div class="loading-state">
                <div class="loading-spinner"></div>
                <p>Loading about information...</p>
              </div>
            ) : (
              <div class="about-text">
                {aboutText.split("\n").map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            )}
          </div>

          <div class="about-features">
            <h3>Platform Features</h3>
            <div class="features-grid">
              <div class="feature-item">
                <span class="feature-icon">🚫</span>
                <h4>Ad-Free Experience</h4>
                <p>
                  Enjoy uninterrupted viewing without any advertisements or
                  sponsored content.
                </p>
              </div>
              <div class="feature-item">
                <span class="feature-icon">🔒</span>
                <h4>Private & Secure</h4>
                <p>
                  Self-hosted infrastructure with complete control over your
                  data and privacy.
                </p>
              </div>
              <div class="feature-item">
                <span class="feature-icon">⚡</span>
                <h4>Fast Streaming</h4>
                <p>
                  HLS adaptive streaming technology for smooth playback on any
                  connection.
                </p>
              </div>
              <div class="feature-item">
                <span class="feature-icon">📱</span>
                <h4>Mobile Optimized</h4>
                <p>
                  Responsive design that works seamlessly across all devices and
                  screen sizes.
                </p>
              </div>
            </div>
          </div>

          {authStore.isAuthenticated && (
            <div class="admin-info-box">
              <h4>👤 Admin Access</h4>
              <p>
                You're logged in as an administrator. You can edit the about
                text in the{" "}
                <a href="/admin/config" class="config-link">
                  Site Configuration
                </a>{" "}
                page.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: "About - Video Channel",
  meta: [
    {
      name: "description",
      content: "Learn more about this self-hosted video streaming platform",
    },
  ],
};
