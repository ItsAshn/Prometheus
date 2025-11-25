import {
  component$,
  useSignal,
  useTask$,
  useStylesScoped$,
} from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { routeLoader$ } from "@builder.io/qwik-city";
import {
  LuAlertTriangle,
  LuHome,
  LuMonitor,
  LuHardDrive,
  LuCalendar,
  LuClapperboard,
  LuClock,
} from "@qwikest/icons/lucide";
import { VideoPlayer } from "~/components/video/video-player";
import type { VideoMetadata } from "~/lib/video/video-processor";
import { VideoProcessor } from "~/lib/video/video-processor";
import styles from "./index.css?inline";

export const useVideoData = routeLoader$(async ({ params, status }) => {
  try {
    const videoId = params.id;

    // Load video metadata directly using VideoProcessor
    const videos = await VideoProcessor.getVideoMetadata();

    if (videos && videos.length > 0) {
      const video = videos.find((v: VideoMetadata) => v.id === videoId);
      if (video) {
        return video;
      }
    }

    // Video not found
    status(404);
    return null;
  } catch (error) {
    console.error("Error loading video:", error);
    status(500);
    return null;
  }
});

export default component$(() => {
  useStylesScoped$(styles);
  const videoData = useVideoData();
  const isLoading = useSignal(true);
  const error = useSignal("");

  useTask$(({ track }) => {
    track(() => videoData.value);

    if (videoData.value === null) {
      error.value = "Video not found";
      isLoading.value = false;
    } else if (videoData.value) {
      error.value = "";
      isLoading.value = false;
    }
  });

  if (isLoading.value) {
    return (
      <div class="single-video-page">
        <div class="site-container">
          <main class="site-content">
            <div class="loading-container">
              <div class="loading-spinner"></div>
              <p>Loading video...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error.value || !videoData.value) {
    return (
      <div class="single-video-page">
        <div class="site-container">
          <main class="site-content">
            <div class="error-container">
              <div class="error-icon">
                <LuAlertTriangle />
              </div>
              <h2>Video Not Found</h2>
              <p>{error.value || "The requested video could not be found."}</p>
              <div class="error-actions">
                <a href="/videos" class="btn btn-primary">
                  ← Back to Videos
                </a>
                <a href="/" class="btn btn-secondary">
                  <LuHome /> Home
                </a>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const video = videoData.value as VideoMetadata;

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

  return (
    <div class="single-video-page">
      <div class="site-container">
        <main class="site-content">
          <div class="video-navigation">
            <a href="/videos" class="btn btn-secondary">
              ← Back to Videos
            </a>
          </div>

          <div class="video-header">
            <h1 class="video-title">{video.title}</h1>
            <div class="video-metadata">
              <span class="video-duration">
                <LuClock /> {formatDuration(video.duration)}
              </span>
              <span class="video-resolution">
                <LuMonitor /> {video.resolution}
              </span>
              <span class="video-size">
                <LuHardDrive /> {formatFileSize(video.fileSize)}
              </span>
              <span class="video-date">
                <LuCalendar /> {new Date(video.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div class="video-player-container">
            <VideoPlayer hlsUrl={video.hlsPath} title={video.title} />
          </div>

          <div class="video-description">
            <h3>Video Details</h3>
            <div class="video-details-grid">
              <div class="detail-item">
                <strong>Resolution:</strong> {video.resolution}
              </div>
              <div class="detail-item">
                <strong>Duration:</strong> {formatDuration(video.duration)}
              </div>
              <div class="detail-item">
                <strong>File Size:</strong> {formatFileSize(video.fileSize)}
              </div>
              <div class="detail-item">
                <strong>Created:</strong>{" "}
                {new Date(video.createdAt).toLocaleString()}
              </div>
            </div>
          </div>

          <div class="video-actions">
            <a href="/videos" class="btn btn-primary btn-lg">
              <LuClapperboard /> Browse More Videos
            </a>
            <a href="/" class="btn btn-secondary btn-lg">
              <LuHome /> Home
            </a>
          </div>
        </main>
      </div>
    </div>
  );
});

export const head: DocumentHead = ({ resolveValue }) => {
  const video = resolveValue(useVideoData);

  return {
    title: video ? `${video.title} - Video Player` : "Video Not Found",
    meta: [
      {
        name: "description",
        content: video
          ? `Watch ${video.title} - ${video.resolution} video with HLS streaming`
          : "Video not found",
      },
      {
        name: "keywords",
        content: "video, streaming, HLS, video player",
      },
    ],
  };
};
