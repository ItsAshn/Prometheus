import {
  component$,
  useSignal,
  useVisibleTask$,
  useTask$,
  $,
  useStylesScoped$,
} from "@builder.io/qwik";
import { LuAlertTriangle, LuClapperboard, LuPlay } from "@qwikest/icons/lucide";
import { loadVideosServer } from "~/lib/data-loaders";
import { VideoPlayer } from "./video-player";
import type { VideoMetadata } from "~/lib/video/video-processor";
import styles from "./videoList.css?inline";

export interface VideoListProps {
  isAdmin?: boolean;
  count?: number; // Limit number of videos displayed
  showTitles?: boolean; // Show video titles
  displayMode?: "grid" | "list" | "compact"; // Display layout
  enablePlayer?: boolean; // Enable embedded video player
  showActions?: boolean; // Show video action buttons
  showMetadata?: boolean; // Show video metadata (duration, size, etc.)
  sortBy?: "newest" | "oldest" | "title" | "duration"; // Sort order
  className?: string; // Custom CSS class
  searchQuery?: string; // Search filter
  enablePagination?: boolean; // Enable pagination with "Load More" button
  itemsPerPage?: number; // Number of items to show per page (default: 12)
}

export default component$<VideoListProps>((props) => {
  useStylesScoped$(styles);
  const videos = useSignal<VideoMetadata[]>([]);
  const allVideos = useSignal<VideoMetadata[]>([]); // Store all filtered videos
  const cachedVideos = useSignal<VideoMetadata[]>([]); // Cache raw videos to avoid refetching
  const isLoading = useSignal(true);
  const error = useSignal("");
  const selectedVideo = useSignal<VideoMetadata | null>(null);
  const currentPage = useSignal(1);

  // Extract props with defaults - keep as reactive by accessing props directly in functions
  const {
    isAdmin = false,
    count,
    showTitles = true,
    displayMode = "grid",
    enablePlayer = true,
    showActions = true,
    showMetadata = true,
    className = "",
    enablePagination = false,
    itemsPerPage = 12,
  } = props;

  const loadVideos = $(async (forceRefresh = false) => {
    try {
      isLoading.value = true;

      // Use cached videos if available, otherwise fetch
      let rawVideos = cachedVideos.value;
      if (forceRefresh || rawVideos.length === 0) {
        const result = await loadVideosServer();
        if (result) {
          rawVideos = result;
          cachedVideos.value = result;
        } else {
          error.value = "Failed to load videos";
          return;
        }
      }

      let videoList = [...rawVideos];

      // Apply search filter if query exists
      const currentSearchQuery = props.searchQuery ?? "";
      if (currentSearchQuery && currentSearchQuery.trim()) {
        const query = currentSearchQuery.toLowerCase().trim();
        videoList = videoList.filter((video: VideoMetadata) =>
          video.title.toLowerCase().includes(query)
        );
      }

      // Apply sorting
      const currentSortBy = props.sortBy ?? "newest";
      switch (currentSortBy) {
        case "newest":
          videoList.sort(
            (a: VideoMetadata, b: VideoMetadata) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          break;
        case "oldest":
          videoList.sort(
            (a: VideoMetadata, b: VideoMetadata) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          break;
        case "title":
          videoList.sort((a: VideoMetadata, b: VideoMetadata) =>
            a.title.localeCompare(b.title)
          );
          break;
        case "duration":
          videoList.sort(
            (a: VideoMetadata, b: VideoMetadata) => b.duration - a.duration
          );
          break;
      }

      // Store all videos for pagination
      allVideos.value = videoList;

      // Apply pagination or count limit
      if (enablePagination) {
        // Show items based on current page
        const startIndex = 0;
        const endIndex = currentPage.value * itemsPerPage;
        videoList = videoList.slice(startIndex, endIndex);
      } else if (count && count > 0) {
        // Apply count limit if specified (no pagination)
        videoList = videoList.slice(0, count);
      }

      videos.value = videoList;
      error.value = "";
    } catch (err) {
      console.error("Error loading videos:", err);
      error.value = "Failed to load videos";
    } finally {
      isLoading.value = false;
    }
  });

  // Track changes to sortBy and searchQuery props and re-apply filters
  useTask$(({ track }) => {
    const currentSort = track(() => props.sortBy);
    const currentSearch = track(() => props.searchQuery);

    // Only run filtering if we have cached videos (i.e., after initial load)
    if (cachedVideos.value.length > 0) {
      // Reset pagination when filters change
      currentPage.value = 1;

      // Apply filters without refetching
      let videoList = [...cachedVideos.value];

      // Apply search filter
      if (currentSearch && currentSearch.trim()) {
        const query = currentSearch.toLowerCase().trim();
        videoList = videoList.filter((video: VideoMetadata) =>
          video.title.toLowerCase().includes(query)
        );
      }

      // Apply sorting
      const sortOption = currentSort ?? "newest";
      switch (sortOption) {
        case "newest":
          videoList.sort(
            (a: VideoMetadata, b: VideoMetadata) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          break;
        case "oldest":
          videoList.sort(
            (a: VideoMetadata, b: VideoMetadata) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          break;
        case "title":
          videoList.sort((a: VideoMetadata, b: VideoMetadata) =>
            a.title.localeCompare(b.title)
          );
          break;
        case "duration":
          videoList.sort(
            (a: VideoMetadata, b: VideoMetadata) => b.duration - a.duration
          );
          break;
      }

      // Store all filtered videos for pagination
      allVideos.value = videoList;

      // Apply pagination or count limit
      if (enablePagination) {
        const endIndex = currentPage.value * itemsPerPage;
        videoList = videoList.slice(0, endIndex);
      } else if (count && count > 0) {
        videoList = videoList.slice(0, count);
      }

      videos.value = videoList;
    }
  });

  const loadMore = $(() => {
    currentPage.value += 1;
    // Apply pagination to allVideos
    const endIndex = currentPage.value * itemsPerPage;
    videos.value = allVideos.value.slice(0, endIndex);
  });

  const deleteVideo = $(async (videoId: string) => {
    if (!isAdmin) return;
    if (typeof window === "undefined") return;

    if (!confirm("Are you sure you want to delete this video?")) return;

    try {
      const response = await fetch("/api/video/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId }),
        credentials: "include", // Include cookies for authentication
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Delete failed with status:", response.status, errorText);
        throw new Error(`Failed to delete video: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        // Refresh video list (force refresh to get updated data)
        await loadVideos(true);

        // Close video player if deleted video was selected
        if (selectedVideo.value?.id === videoId) {
          selectedVideo.value = null;
        }
      } else {
        alert(result.message || "Failed to delete video");
      }
    } catch (error) {
      console.error("Error deleting video:", error);
      alert(
        `Failed to delete video: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  });

  const handleVideoSelect = $((video: VideoMetadata) => {
    if (enablePlayer) {
      selectedVideo.value = video;
    } else {
      // If player is disabled, navigate to individual video page
      if (typeof window !== "undefined") {
        window.location.href = `/video/${video.id}`;
      }
    }
  });

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const formatFileSize = (bytes: number): string => {
    const sizes = ["Bytes", "KB", "MB", "GB"];
    if (bytes === 0) return "0 Bytes";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  };

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(async ({ cleanup }) => {
    await loadVideos(true);

    // Listen for video upload events
    const handleVideoUploaded = () => {
      loadVideos(true);
    };

    if (typeof window !== "undefined") {
      window.addEventListener("video-uploaded", handleVideoUploaded);

      cleanup(() => {
        window.removeEventListener("video-uploaded", handleVideoUploaded);
      });
    }
  });

  if (isLoading.value) {
    return (
      <div class="video-list-loading">
        <div class="loading-spinner"></div>
        <p>Loading videos...</p>
      </div>
    );
  }

  if (error.value) {
    return (
      <div class="video-list-error">
        <div class="error-icon">
          <LuAlertTriangle />
        </div>
        <p>{error.value}</p>
        <button onClick$={() => loadVideos(true)} class="btn btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  if (videos.value.length === 0) {
    return (
      <div class={`no-videos ${className}`}>
        <div class="empty-icon">
          <LuClapperboard />
        </div>
        <h3>No Videos Available</h3>
        <p>
          {isAdmin
            ? "Upload your first video to get started!"
            : "No videos have been uploaded yet."}
        </p>
      </div>
    );
  }

  return (
    <div class={`video-list-container ${className}`}>
      {selectedVideo.value && enablePlayer ? (
        <div class="video-player-section">
          <div class="player-header">
            <button
              onClick$={() => (selectedVideo.value = null)}
              class="btn btn-secondary"
            >
              ← Back to List
            </button>
          </div>
          <VideoPlayer
            hlsUrl={selectedVideo.value.hlsPath}
            title={selectedVideo.value.title}
          />
        </div>
      ) : (
        <div
          class={`video-${displayMode}`}
          role="list"
          aria-label="Video collection"
        >
          {videos.value.map((video) => (
            <article key={video.id} class="video-card" role="listitem">
              <button
                class="video-thumbnail"
                onClick$={() => handleVideoSelect(video)}
                aria-label={`Play ${video.title}`}
                type="button"
                style={
                  video.thumbnail
                    ? `background-image: url('${video.thumbnail}')`
                    : undefined
                }
              >
                {!video.thumbnail && (
                  <div class="thumbnail-placeholder">
                    <span class="placeholder-icon" aria-hidden="true">
                      <LuClapperboard />
                    </span>
                  </div>
                )}
                <div class="play-overlay" aria-hidden="true">
                  <div class="play-icon">
                    <LuPlay />
                  </div>
                </div>
                {showMetadata && (
                  <div
                    class="video-duration"
                    aria-label={`Duration: ${formatDuration(video.duration)}`}
                  >
                    {formatDuration(video.duration)}
                  </div>
                )}
              </button>

              <div class="video-info">
                {showTitles && <h4 class="video-title">{video.title}</h4>}
                {showMetadata && (
                  <div class="video-meta" aria-label="Video metadata">
                    <span
                      class="video-resolution"
                      aria-label={`Resolution: ${video.resolution}`}
                    >
                      {video.resolution}
                    </span>
                    <span
                      class="video-size"
                      aria-label={`File size: ${formatFileSize(video.fileSize)}`}
                    >
                      {formatFileSize(video.fileSize)}
                    </span>
                    <span
                      class="video-date"
                      aria-label={`Upload date: ${new Date(video.createdAt).toLocaleDateString()}`}
                    >
                      {new Date(video.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              {showActions && (
                <div class="video-actions">
                  <button
                    onClick$={() => handleVideoSelect(video)}
                    class="btn btn-primary btn-sm flex-1"
                    aria-label={`${enablePlayer ? "Play" : "View"} ${video.title}`}
                  >
                    {enablePlayer ? "Play" : "View"}
                  </button>
                  {isAdmin && (
                    <button
                      onClick$={() => deleteVideo(video.id)}
                      class="btn btn-destructive btn-sm"
                      aria-label={`Delete ${video.title}`}
                    >
                      Delete
                    </button>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {/* Load More Button for Pagination */}
      {enablePagination &&
        !selectedVideo.value &&
        videos.value.length < allVideos.value.length && (
          <div class="pagination-container">
            <button onClick$={loadMore} class="btn btn-primary load-more-btn">
              Load More Videos ({allVideos.value.length - videos.value.length}{" "}
              remaining)
            </button>
            <p class="pagination-info">
              Showing {videos.value.length} of {allVideos.value.length} videos
            </p>
          </div>
        )}
    </div>
  );
});
