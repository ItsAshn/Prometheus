import {
  component$,
  useStore,
  useTask$,
  useVisibleTask$,
  useStylesScoped$,
  useSignal,
} from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { server$ } from "@builder.io/qwik-city";
import VideoList from "~/components/video/VideoList";
import { ChannelHeader } from "~/components/channel/channel-header";
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

  // Also check when page becomes visible (after redirect)
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(() => {
    const recheckAuth = async () => {
      const status = await checkAdminAuth();
      authStore.isAuthenticated = status.isAuthenticated;
      authStore.username = status.username;
      authStore.isLoading = false;
    };
    recheckAuth();
  });

  // Use site config for display, with fallbacks
  const channelName = siteStore.config?.channelName || "Your Video Channel";
  const channelDescription =
    siteStore.config?.channelDescription ||
    "Welcome to my self-hosted video streaming platform. Here you can find all my videos and content.";

  return (
    <div class="channel-page">
      <ChannelHeader
        channelName={channelName}
        channelDescription={channelDescription}
        videoCount={videoCount.value}
        isAuthenticated={authStore.isAuthenticated}
        activeTab="home"
      />

      <div class="channel-content">
        <div class="content-container">
          {authStore.isAuthenticated && (
            <section class="admin-quick-actions">
              <h3 class="section-title">Admin Quick Actions</h3>
              <div class="quick-actions-grid">
                <a href="/admin" class="action-card">
                  <span class="action-icon">🎛️</span>
                  <div class="action-info">
                    <h4>Dashboard</h4>
                    <p>View overview & stats</p>
                  </div>
                </a>
                <a href="/admin/videos" class="action-card">
                  <span class="action-icon">�</span>
                  <div class="action-info">
                    <h4>Manage Videos</h4>
                    <p>Upload & organize content</p>
                  </div>
                </a>
                <a href="/admin/config" class="action-card">
                  <span class="action-icon">⚙️</span>
                  <div class="action-info">
                    <h4>Settings</h4>
                    <p>Configure your channel</p>
                  </div>
                </a>
              </div>
            </section>
          )}

          <section class="latest-videos-section">
            <div class="section-header">
              <h3 class="section-title">Latest Videos</h3>
              <a href="/videos" class="view-all-link">
                View All →
              </a>
            </div>
            <VideoList
              count={6}
              showTitles={true}
              displayMode="grid"
              enablePlayer={false}
              showActions={authStore.isAuthenticated}
              showMetadata={true}
              isAdmin={authStore.isAuthenticated}
            />
          </section>

          <section class="about-section">
            <h3 class="section-title">About This Channel</h3>
            <div class="about-content">
              <div class="about-card">
                <span class="about-icon">🚫</span>
                <h4>Ad-Free Experience</h4>
                <p>Enjoy content without interruptions or advertisements</p>
              </div>
              <div class="about-card">
                <span class="about-icon">🔒</span>
                <h4>Private & Secure</h4>
                <p>Self-hosted platform with complete data control</p>
              </div>
              <div class="about-card">
                <span class="about-icon">⚡</span>
                <h4>Fast Streaming</h4>
                <p>HLS adaptive streaming for smooth playback</p>
              </div>
              <div class="about-card">
                <span class="about-icon">📱</span>
                <h4>Mobile Ready</h4>
                <p>Watch anywhere on any device</p>
              </div>
            </div>
          </section>
        </div>
      </div>
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
