import {
  component$,
  useSignal,
  useVisibleTask$,
  $,
  useStylesScoped$,
} from "@builder.io/qwik";
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
}

export default component$<VideoListProps>((props) => {
  useStylesScoped$(styles);
  const videos = useSignal<VideoMetadata[]>([]);
  const isLoading = useSignal(true);
  const error = useSignal("");
  const selectedVideo = useSignal<VideoMetadata | null>(null);

  // Extract props to avoid serialization issues
  const {
    isAdmin = false,
    count,
    showTitles = true,
    displayMode = "grid",
    enablePlayer = true,
    showActions = true,
    showMetadata = true,
    sortBy = "newest",
    className = "",
  } = props;

  const loadVideos = $(async () => {
    try {
      isLoading.value = true;
      const result = await loadVideosServer();

      if (result) {
        let videoList = result;

        // Apply sorting
        switch (sortBy) {
          case "newest":
            videoList.sort(
              (a: VideoMetadata, b: VideoMetadata) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            );
            break;
          case "oldest":
            videoList.sort(
              (a: VideoMetadata, b: VideoMetadata) =>
                new Date(a.createdAt).getTime() -
                new Date(b.createdAt).getTime()
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

        // Apply count limit if specified
        if (count && count > 0) {
          videoList = videoList.slice(0, count);
        }

        videos.value = videoList;
        error.value = "";
      } else {
        error.value = "Failed to load videos";
      }
    } catch (err) {
      console.error("Error loading videos:", err);
      error.value = "Failed to load videos";
    } finally {
      isLoading.value = false;
    }
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

      const result = await response.json();

      if (result.success) {
        // Refresh video list
        await loadVideos();

        // Close video player if deleted video was selected
        if (selectedVideo.value?.id === videoId) {
          selectedVideo.value = null;
        }
      } else {
        alert(result.message || "Failed to delete video");
      }
    } catch (error) {
      console.error("Error deleting video:", error);
      alert("Failed to delete video");
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
  useVisibleTask$(async () => {
    await loadVideos();

    // Listen for video upload events
    const handleVideoUploaded = () => {
      loadVideos();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("video-uploaded", handleVideoUploaded);

      return () => {
        window.removeEventListener("video-uploaded", handleVideoUploaded);
      };
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
        <div class="error-icon">⚠️</div>
        <p>{error.value}</p>
        <button onClick$={loadVideos} class="btn btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  if (videos.value.length === 0) {
    return (
      <div class={`no-videos ${className}`}>
        <div class="empty-icon">🎬</div>
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
        <div class={`video-${displayMode}`}>
          {videos.value.map((video) => (
            <div key={video.id} class="video-card">
              <div class="video-thumbnail">
                <div
                  class="play-icon"
                  onClick$={() => handleVideoSelect(video)}
                >
                  ▶️
                </div>
                {showMetadata && (
                  <div class="video-duration">
                    {formatDuration(video.duration)}
                  </div>
                )}
              </div>

              <div class="video-info">
                {showTitles && <h4 class="video-title">{video.title}</h4>}
                {showMetadata && (
                  <div class="video-meta">
                    <span class="video-resolution">{video.resolution}</span>
                    <span class="video-size">
                      {formatFileSize(video.fileSize)}
                    </span>
                    <span class="video-date">
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
                  >
                    {enablePlayer ? "Play" : "View"}
                  </button>
                  {isAdmin && (
                    <button
                      onClick$={() => deleteVideo(video.id)}
                      class="btn btn-destructive btn-sm"
                    >
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
