import { component$, useSignal, useVisibleTask$, $ } from "@builder.io/qwik";
import { VideoPlayer } from "./video-player";
import type { VideoMetadata } from "~/lib/video/video-processor";

interface VideoListProps {
  isAdmin?: boolean;
}

export const VideoList = component$<VideoListProps>((props) => {
  const videos = useSignal<VideoMetadata[]>([]);
  const isLoading = useSignal(true);
  const error = useSignal("");
  const selectedVideo = useSignal<VideoMetadata | null>(null);

  const loadVideos = $(async () => {
    // Only run on client side to avoid SSR URL issues
    if (typeof window === "undefined") return;

    try {
      isLoading.value = true;
      const response = await fetch("/api/video/list");
      const result = await response.json();

      if (result.success) {
        videos.value = result.videos;
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
    if (!props.isAdmin) return;
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
      <div class="no-videos">
        <div class="empty-icon">🎬</div>
        <h3>No Videos Available</h3>
        <p>
          {props.isAdmin
            ? "Upload your first video to get started!"
            : "No videos have been uploaded yet."}
        </p>
      </div>
    );
  }

  return (
    <div class="video-list-container">
      {selectedVideo.value ? (
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
        <div class="video-grid">
          {videos.value.map((video) => (
            <div key={video.id} class="video-card">
              <div class="video-thumbnail">
                <div
                  class="play-icon"
                  onClick$={() => (selectedVideo.value = video)}
                >
                  ▶️
                </div>
                <div class="video-duration">
                  {formatDuration(video.duration)}
                </div>
              </div>

              <div class="video-info">
                <h4 class="video-title">{video.title}</h4>
                <div class="video-meta">
                  <span class="video-resolution">{video.resolution}</span>
                  <span class="video-size">
                    {formatFileSize(video.fileSize)}
                  </span>
                  <span class="video-date">
                    {new Date(video.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div class="video-actions">
                <button
                  onClick$={() => (selectedVideo.value = video)}
                  class="btn btn-primary btn-sm flex-1"
                >
                  Play
                </button>
                {props.isAdmin && (
                  <button
                    onClick$={() => deleteVideo(video.id)}
                    class="btn btn-destructive btn-sm"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
