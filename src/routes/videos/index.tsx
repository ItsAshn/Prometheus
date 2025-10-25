import {
  component$,
  useStylesScoped$,
  useStore,
  useTask$,
  useSignal,
} from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { checkAdminAuthServer } from "~/lib/admin-auth-utils";
import { loadSiteConfigServer, loadVideosServer } from "~/lib/data-loaders";
import styles from "./index.css?inline";
import VideoList from "~/components/video/VideoList";
import { ChannelHeader } from "~/components/channel/channel-header";

interface SiteConfig {
  channelName: string;
  channelDescription: string;
  lastUpdated: string;
  bannerImage?: string;
  avatarImage?: string;
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

  // Check authentication status and load site config on component load
  useTask$(async () => {
    const [authStatus, config, videos] = await Promise.all([
      checkAdminAuthServer(),
      loadSiteConfigServer(),
      loadVideosServer(),
    ]);

    authStore.isAuthenticated = authStatus.isAuthenticated;
    authStore.username = authStatus.user?.username || "";
    authStore.isLoading = false;

    if (config) {
      siteStore.config = config;
    }
    siteStore.isLoadingConfig = false;

    videoCount.value = videos?.length || 0;
  });

  const channelName = siteStore.config?.channelName || "Your Video Channel";
  const channelDescription =
    siteStore.config?.channelDescription ||
    "Welcome to my self-hosted video streaming platform.";
  const bannerImage = siteStore.config?.bannerImage || "";
  const avatarImage = siteStore.config?.avatarImage || "";

  return (
    <div class="public-videos-page">
      <ChannelHeader
        channelName={channelName}
        channelDescription={channelDescription}
        videoCount={videoCount.value}
        isAuthenticated={authStore.isAuthenticated}
        activeTab="videos"
        bannerImage={bannerImage}
        avatarImage={avatarImage}
      />
      <div class="site-container">
        <main class="site-content">
          <div class="videos-intro">
            <h2>🎬 Video Collection</h2>
            <p>
              Enjoy high-quality streaming with adaptive bitrate delivery. All
              videos are automatically optimized for your device and connection.
            </p>
          </div>

          <VideoList
            displayMode="grid"
            showTitles={true}
            enablePlayer={false}
            showActions={authStore.isAuthenticated}
            showMetadata={true}
            sortBy="newest"
            isAdmin={authStore.isAuthenticated}
          />
        </main>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Video Library",
  meta: [
    {
      name: "description",
      content: "Watch videos with HLS streaming",
    },
  ],
};
