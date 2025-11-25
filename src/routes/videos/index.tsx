import {
  component$,
  useStylesScoped$,
  useSignal,
  useVisibleTask$,
  useTask$,
  $,
} from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { useLocation } from "@builder.io/qwik-city";
import { LuClapperboard } from "@qwikest/icons/lucide";
import { loadVideosServer } from "~/lib/data-loaders";
import styles from "./index.css?inline";
import VideoList from "~/components/video/VideoList";
import { ChannelHeader } from "~/components/channel/channel-header";
import { SearchBar } from "~/components/search/search-bar";
import {
  VideoFilters,
  type SortOption,
} from "~/components/video-filters/video-filters";
import { useAuthLoader, useSiteConfigLoader } from "../layout";

export default component$(() => {
  useStylesScoped$(styles);

  // Use shared loaders from layout instead of re-fetching
  const auth = useAuthLoader();
  const siteConfig = useSiteConfigLoader();
  const location = useLocation();

  const videoCount = useSignal(0);
  const searchQuery = useSignal("");
  const sortBy = useSignal<SortOption>("newest");

  // Handlers for filter changes
  const handleSortChange$ = $((value: string) => {
    sortBy.value = value as SortOption;
  });

  const handleResetFilters$ = $(() => {
    sortBy.value = "newest";
    searchQuery.value = "";
  });

  // Track URL changes to update search query reactively
  useTask$(({ track }) => {
    const url = track(() => location.url);
    const urlParams = new URLSearchParams(url.search);
    const query = urlParams.get("q");
    searchQuery.value = query || "";
  });

  // Load video count on client side
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(async () => {
    const videos = await loadVideosServer();
    videoCount.value = videos?.length || 0;
  });

  // Use site config for display, with fallbacks
  const channelName = siteConfig.value?.channelName || "Your Video Channel";
  const channelDescription =
    siteConfig.value?.channelDescription ||
    "Welcome to my self-hosted video streaming platform.";
  const bannerImage = siteConfig.value?.bannerImage || "";
  const avatarImage = siteConfig.value?.avatarImage || "";

  return (
    <div class="public-videos-page">
      <ChannelHeader
        channelName={channelName}
        channelDescription={channelDescription}
        videoCount={videoCount.value}
        isAuthenticated={auth.value.isAuthenticated}
        activeTab="videos"
        bannerImage={bannerImage}
        avatarImage={avatarImage}
      />
      <div class="site-container">
        <main class="site-content">
          {/* Mobile Search Bar */}
          <div class="mobile-search-section">
            <SearchBar placeholder="Search videos..." variant="page" />
          </div>

          <div class="videos-intro">
            <h2>
              <LuClapperboard /> Video Collection
            </h2>
            <p>
              Enjoy high-quality streaming with adaptive bitrate delivery. All
              videos are automatically optimized for your device and connection.
            </p>
            {searchQuery.value && (
              <p class="search-results-text">
                Search results for: <strong>"{searchQuery.value}"</strong>
              </p>
            )}
          </div>

          <div class="videos-layout">
            {/* Filter Sidebar */}
            <aside class="videos-sidebar">
              <VideoFilters
                currentSort={sortBy.value}
                onSortChange$={handleSortChange$}
                onResetFilters$={handleResetFilters$}
              />
            </aside>

            {/* Video Grid */}
            <div class="videos-main">
              <VideoList
                displayMode="grid"
                showTitles={true}
                enablePlayer={false}
                showActions={auth.value.isAuthenticated}
                showMetadata={true}
                sortBy={sortBy.value}
                isAdmin={auth.value.isAuthenticated}
                searchQuery={searchQuery.value}
                enablePagination={true}
                itemsPerPage={12}
              />
            </div>
          </div>
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
