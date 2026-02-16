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
  LuShare2,
} from "@qwikest/icons/lucide";
import { VideoPlayer } from "~/components/video/video-player";
import { Breadcrumb } from "~/components/ui/breadcrumb";
import { ShareDialog } from "~/components/ui/share-dialog";
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
  const shareDialogOpen = useSignal(false);

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
          <Breadcrumb
            items={[
              { label: "Videos", href: "/videos" },
              { label: video.title },
            ]}
          />

          <div class="video-navigation">
            <a href="/videos" class="btn btn-secondary">
              ← Back to Videos
            </a>
            <button
              onClick$={() => (shareDialogOpen.value = true)}
              class="btn btn-secondary"
            >
              <LuShare2 /> Share
            </button>
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

          {/* Share Dialog */}
          <ShareDialog
            isOpen={shareDialogOpen.value}
            onClose$={() => (shareDialogOpen.value = false)}
            videoTitle={video.title}
            videoUrl={typeof window !== "undefined" ? window.location.href : ""}
          />
        </main>
      </div>
    </div>
  );
});

export const head: DocumentHead = ({ resolveValue, url }) => {
  const video = resolveValue(useVideoData);

  if (!video) {
    return {
      title: "Video Not Found",
      meta: [
        {
          name: "description",
          content: "Video not found",
        },
      ],
    };
  }

  // Create structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: video.title,
    description: `Watch ${video.title} in ${video.resolution} with HLS streaming`,
    thumbnailUrl: video.thumbnail || "",
    uploadDate: video.createdAt,
    duration: `PT${Math.floor(video.duration)}S`,
    contentUrl: url.href,
    embedUrl: url.href,
    width: video.resolution.split("x")[0] || "1920",
    height: video.resolution.split("x")[1] || "1080",
  };

  return {
    title: `${video.title} - Video Player`,
    meta: [
      {
        name: "description",
        content: `Watch ${video.title} - ${video.resolution} video with HLS streaming`,
      },
      {
        name: "keywords",
        content: `video, streaming, HLS, video player, ${video.title}`,
      },
      // Open Graph meta tags for social sharing
      {
        property: "og:title",
        content: video.title,
      },
      {
        property: "og:description",
        content: `Watch ${video.title} in ${video.resolution}`,
      },
      {
        property: "og:type",
        content: "video.other",
      },
      {
        property: "og:url",
        content: url.href,
      },
      {
        property: "og:video",
        content: video.hlsPath,
      },
      ...(video.thumbnail
        ? [
            {
              property: "og:image",
              content: video.thumbnail,
            },
          ]
        : []),
      // Twitter Card meta tags
      {
        name: "twitter:card",
        content: "player",
      },
      {
        name: "twitter:title",
        content: video.title,
      },
      {
        name: "twitter:description",
        content: `Watch ${video.title} in ${video.resolution}`,
      },
    ],
    links: [
      {
        rel: "canonical",
        href: url.href,
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        props: {
          dangerouslySetInnerHTML: JSON.stringify(structuredData),
        },
      },
    ],
  };
};
