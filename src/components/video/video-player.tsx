import {
  component$,
  useSignal,
  useStylesScoped$,
  useVisibleTask$,
  $,
} from "@builder.io/qwik";
import styles from "./video-player.css?inline";

interface VideoPlayerProps {
  hlsUrl: string;
  title: string;
  autoplay?: boolean;
}

export const VideoPlayer = component$<VideoPlayerProps>((props) => {
  useStylesScoped$(styles);
  const videoRef = useSignal<HTMLVideoElement>();
  const containerRef = useSignal<HTMLDivElement>();
  const isLoading = useSignal(true);
  const isVisible = useSignal(false);
  const error = useSignal("");
  const aspectRatio = useSignal<string>("16 / 9"); // Default aspect ratio

  // Update aspect ratio when video metadata is loaded
  const handleLoadedMetadata$ = $(() => {
    const video = videoRef.value;
    console.log("handleLoadedMetadata called", video);
    if (video && video.videoWidth && video.videoHeight) {
      const ratio = video.videoWidth / video.videoHeight;
      const newAspectRatio = `${video.videoWidth} / ${video.videoHeight}`;
      aspectRatio.value = newAspectRatio;
      console.log(
        `✅ Video dimensions: ${video.videoWidth}x${video.videoHeight}, ratio: ${ratio.toFixed(2)}, aspect ratio set to: ${newAspectRatio}`
      );
    } else {
      console.warn("Video metadata not available yet", {
        videoWidth: video?.videoWidth,
        videoHeight: video?.videoHeight,
      });
    }
    isLoading.value = false;
  });

  // Intersection Observer for lazy loading
  // Only load video when it's near the viewport
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track, cleanup }) => {
    track(() => containerRef.value);

    const container = containerRef.value;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isVisible.value) {
            isVisible.value = true;
            // Once visible, disconnect observer to save resources
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: "100px", // Start loading 100px before visible
        threshold: 0.1, // Trigger when 10% visible
      }
    );

    observer.observe(container);

    cleanup(() => {
      observer.disconnect();
    });
  });

  // Load HLS only when visible
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track }) => {
    track(() => props.hlsUrl);
    track(() => isVisible.value);

    const video = videoRef.value;
    if (!video || !props.hlsUrl || !isVisible.value) return;

    const loadHLS = async () => {
      try {
        // Use direct static file URLs for better caching and performance
        // No API overhead - files served directly by Express with aggressive caching
        const streamingUrl = props.hlsUrl;

        // Check if HLS is natively supported
        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = streamingUrl;
          video.addEventListener("loadedmetadata", () => {
            handleLoadedMetadata$();
          });
          video.addEventListener("error", (e) => {
            console.error("Native video error:", e);
            error.value = `Native video error: ${video.error?.message || "Unknown"}`;
            isLoading.value = false;
          });
          return;
        }

        // For browsers that don't support HLS natively, we'll use hls.js
        // First check if hls.js is loaded
        if (typeof (window as any).Hls !== "undefined") {
          const Hls = (window as any).Hls;

          if (Hls.isSupported()) {
            const hls = new Hls({
              debug: false,
              enableWorker: true, // Use web worker for better performance
              lowLatencyMode: false,

              // Buffer management - optimized for 2-second segments
              backBufferLength: 60, // Keep 60 seconds of back buffer
              maxBufferLength: 30, // 30 seconds forward buffer (15 segments)
              maxMaxBufferLength: 60, // Max 60 seconds buffer
              maxBufferSize: 60 * 1000 * 1000, // 60MB max buffer size
              maxBufferHole: 0.5, // Allow 0.5s gaps

              // Loading optimizations for smaller segments
              maxLoadingDelay: 4, // Quick loading for small segments
              fragLoadingTimeOut: 20000, // 20s timeout
              fragLoadingMaxRetry: 6, // Retry attempts
              fragLoadingRetryDelay: 1000, // 1s retry delay

              // Manifest loading
              manifestLoadingTimeOut: 10000,
              levelLoadingTimeOut: 10000,

              // Progressive loading
              progressive: true,
              startFragPrefetch: true, // Prefetch next segment

              // ABR (Adaptive Bitrate) - conservative for stability
              abrEwmaDefaultEstimate: 500000, // Start at 500kbps
              abrBandWidthFactor: 0.95, // Use 95% of estimated bandwidth

              // Startup optimizations
              startLevel: -1, // Auto-select starting quality
              autoStartLoad: true,
            });

            hls.loadSource(streamingUrl);
            hls.attachMedia(video);

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              isLoading.value = false;
              if (props.autoplay) {
                video.play().catch(console.error);
              }
            });

            hls.on(Hls.Events.LEVEL_LOADED, () => {
              // Update aspect ratio when HLS metadata is available
              handleLoadedMetadata$();
            });

            hls.on(Hls.Events.ERROR, (event: any, data: any) => {
              if (!data.fatal) return;

              console.error("HLS error:", data.type, data.details);

              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  console.log("Network error - attempting recovery");
                  hls.startLoad();
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  console.log("Media error - attempting recovery");
                  hls.recoverMediaError();
                  break;
                default:
                  error.value = `Playback error: ${data.details}`;
                  isLoading.value = false;
                  break;
              }
            });
          } else {
            error.value = "HLS not supported in this browser";
            isLoading.value = false;
          }
        } else {
          console.error(
            "HLS.js is not available. Make sure it's loaded from CDN."
          );
          // Fallback: try to load the video directly
          video.src = streamingUrl;
          video.addEventListener("loadedmetadata", () => {
            handleLoadedMetadata$();
          });
          video.addEventListener("error", (e) => {
            console.error("Direct video loading failed:", e);
            error.value = `Video loading failed. HLS.js not available and direct loading failed: ${video.error?.message || "Unknown"}`;
            isLoading.value = false;
          });
          isLoading.value = false;
        }
      } catch (err) {
        console.error("Error loading video:", err);
        error.value = "Failed to load video";
        isLoading.value = false;
      }
    };

    loadHLS();
  });

  if (error.value) {
    return (
      <article class="video-player-container" role="alert" aria-live="polite">
        <div class="video-player-error">
          <div class="error-icon" aria-hidden="true">
            ⚠️
          </div>
          <p class="error-message">{error.value}</p>
          <p class="error-details">Video: {props.title}</p>
        </div>
      </article>
    );
  }

  return (
    <article class="video-player-container" ref={containerRef}>
      <div
        class="video-player"
        role="region"
        aria-label={`Video player for ${props.title}`}
        style={{
          aspectRatio: aspectRatio.value,
        }}
        data-aspect-ratio={aspectRatio.value}
      >
        {!isVisible.value && (
          <div class="video-placeholder" role="status">
            <div class="placeholder-icon">📹</div>
            <p>Video will load when visible...</p>
          </div>
        )}

        {isLoading.value && isVisible.value && (
          <div
            class="video-loading"
            role="status"
            aria-live="polite"
            aria-label="Loading video content"
          >
            <div class="loading-spinner" aria-hidden="true"></div>
            <p>Loading video...</p>
          </div>
        )}

        {isVisible.value && (
          <video
            ref={videoRef}
            controls
            class={`video-element ${isLoading.value ? "loading" : ""}`}
            preload="metadata"
            aria-label={props.title}
            aria-describedby="video-title"
            onLoadedMetadata$={handleLoadedMetadata$}
            style={{
              width: "100%",
              height: "auto",
              display: isLoading.value ? "none" : "block",
            }}
          >
            <p>
              Your browser does not support video playback. Please try a
              different browser or update your current one.
            </p>
          </video>
        )}
      </div>
      {!isLoading.value && isVisible.value && (
        <header class="video-title">
          <h3 id="video-title">{props.title}</h3>
        </header>
      )}
    </article>
  );
});
