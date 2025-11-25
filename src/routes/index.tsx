import {
  component$,
  useStylesScoped$,
  useSignal,
  useVisibleTask$,
} from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import {
  LuSlidersHorizontal,
  LuClapperboard,
  LuSettings,
} from "@qwikest/icons/lucide";
import { loadVideosServer } from "~/lib/data-loaders";
import VideoList from "~/components/video/VideoList";
import { ChannelHeader } from "~/components/channel/channel-header";
import { useAuthLoader, useSiteConfigLoader } from "./layout";
import { CONFIG } from "~/lib/constants";
import styles from "./index.css?inline";

export default component$(() => {
  useStylesScoped$(styles);

  // Use shared loaders from layout instead of re-fetching
  const auth = useAuthLoader();
  const siteConfig = useSiteConfigLoader();

  const videoCount = useSignal(0);

  // Load video count on client side only (not critical for SSR)
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(async () => {
    const videos = await loadVideosServer();
    videoCount.value = videos?.length || 0;
  });

  // Use site config for display, with fallbacks
  const channelName = siteConfig.value?.channelName || "Your Video Channel";
  const channelDescription =
    siteConfig.value?.channelDescription ||
    "Welcome to my self-hosted video streaming platform. Here you can find all my videos and content.";
  const bannerImage = siteConfig.value?.bannerImage || "";
  const avatarImage = siteConfig.value?.avatarImage || "";

  return (
    <div class="channel-page">
      <ChannelHeader
        channelName={channelName}
        channelDescription={channelDescription}
        videoCount={videoCount.value}
        isAuthenticated={auth.value.isAuthenticated}
        activeTab="home"
        bannerImage={bannerImage}
        avatarImage={avatarImage}
      />

      <div class="channel-content">
        <div class="content-container">
          {auth.value.isAuthenticated && (
            <section class="admin-quick-actions">
              <h3 class="section-title">Admin Quick Actions</h3>
              <div class="quick-actions-grid">
                <a href="/admin" class="action-card">
                  <span class="action-icon">
                    <LuSlidersHorizontal />
                  </span>
                  <div class="action-info">
                    <h4>Dashboard</h4>
                    <p>View overview & stats</p>
                  </div>
                </a>
                <a href="/admin/videos" class="action-card">
                  <span class="action-icon">
                    <LuClapperboard />
                  </span>
                  <div class="action-info">
                    <h4>Manage Videos</h4>
                    <p>Upload & organize content</p>
                  </div>
                </a>
                <a href="/admin/config" class="action-card">
                  <span class="action-icon">
                    <LuSettings />
                  </span>
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
              count={CONFIG.VIDEO.HOME_PAGE_COUNT}
              showTitles={true}
              displayMode="grid"
              enablePlayer={false}
              showActions={auth.value.isAuthenticated}
              showMetadata={true}
              isAdmin={auth.value.isAuthenticated}
            />
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
