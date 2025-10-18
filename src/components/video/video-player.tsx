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
  const isBuffering = useSignal(false); // Track buffering state
  const hlsInstance = useSignal<any>(null); // Store HLS instance for quality control
  const availableQualities = useSignal<
    Array<{ level: number; height: number; name: string }>
  >([]);
  const currentQuality = useSignal<number>(-1); // -1 means auto
  const showQualityMenu = useSignal(false);

  // Quality change handler
  const changeQuality$ = $((level: number) => {
    const hls = hlsInstance.value;
    if (!hls) return;

    if (level === -1) {
      // Auto quality
      hls.currentLevel = -1;
      currentQuality.value = -1;
      console.log("Quality set to: Auto");
    } else {
      // Manual quality
      hls.currentLevel = level;
      currentQuality.value = level;
      const quality = availableQualities.value.find((q) => q.level === level);
      console.log(`Quality set to: ${quality?.name || level}`);
    }
    showQualityMenu.value = false;
  });

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

              // Buffer management - AGGRESSIVE buffering for slow networks
              backBufferLength: 90, // Keep 90 seconds of back buffer
              maxBufferLength: 60, // Build up to 60 seconds forward buffer before playing
              maxMaxBufferLength: 120, // Max 120 seconds buffer
              maxBufferSize: 120 * 1000 * 1000, // 120MB max buffer size
              maxBufferHole: 1.0, // Allow 1s gaps without stalling

              // High water mark - wait for more buffer before starting playback
              highBufferWatchdogPeriod: 3, // Check buffer health every 3s
              nudgeMaxRetry: 5, // More retries for nudging playback

              // Stall handling - be more patient with slow loading
              maxFragLookUpTolerance: 0.5,
              liveSyncDurationCount: 3, // For live streams

              // Loading optimizations - MORE TIME for slow connections
              maxLoadingDelay: 8, // Allow 8s for loading (doubled from 4s)
              fragLoadingTimeOut: 40000, // 40s timeout (doubled from 20s)
              fragLoadingMaxRetry: 10, // More retry attempts
              fragLoadingRetryDelay: 2000, // 2s retry delay (doubled)
              fragLoadingMaxRetryTimeout: 64000, // Max timeout between retries

              // Manifest loading - be patient
              manifestLoadingTimeOut: 20000, // 20s (doubled)
              manifestLoadingMaxRetry: 5,
              manifestLoadingRetryDelay: 2000,
              levelLoadingTimeOut: 20000, // 20s (doubled)
              levelLoadingMaxRetry: 5,

              // Progressive loading
              progressive: true,
              startFragPrefetch: true, // Prefetch next segment

              // ABR (Adaptive Bitrate) - conservative for slow networks
              abrEwmaDefaultEstimate: 300000, // Start at 300kbps (lower estimate)
              abrBandWidthFactor: 0.8, // Use 80% of estimated bandwidth (more conservative)
              abrEwmaFastLive: 2.0,
              abrEwmaSlowLive: 5.0,

              // Startup optimizations - WAIT for buffer before playing
              startLevel: -1, // Auto-select starting quality
              autoStartLoad: true,
              startPosition: -1,

              // Buffering strategy
              liveDurationInfinity: false,
              liveBackBufferLength: 90,
            });

            hls.loadSource(streamingUrl);
            hls.attachMedia(video);

            // Store HLS instance for quality control
            hlsInstance.value = hls;

            // Track buffering state
            let hasEnoughBuffer = false;

            hls.on(Hls.Events.MANIFEST_PARSED, (event: any, data: any) => {
              console.log("HLS manifest parsed, waiting for initial buffer...");

              // Extract available quality levels
              const levels = data.levels || [];
              const qualities = levels.map((level: any, index: number) => {
                const height = level.height || 0;
                let name = "Auto";
                if (height >= 2160) name = "2160p (4K)";
                else if (height >= 1440) name = "1440p (2K)";
                else if (height >= 1080) name = "1080p (HD)";
                else if (height >= 720) name = "720p";
                else if (height >= 480) name = "480p";
                else if (height >= 360) name = "360p";

                return { level: index, height, name };
              });

              availableQualities.value = qualities;
              console.log("Available qualities:", qualities);

              // Don't hide loading yet - wait for buffer
            });

            // Monitor buffer levels
            hls.on(Hls.Events.BUFFER_APPENDED, () => {
              if (!hasEnoughBuffer && video.buffered.length > 0) {
                const bufferedEnd = video.buffered.end(
                  video.buffered.length - 1
                );
                const bufferedAmount = bufferedEnd - video.currentTime;

                console.log(`Buffer: ${bufferedAmount.toFixed(2)}s`);

                // Wait for at least 10 seconds of buffer before allowing playback
                if (bufferedAmount >= 10) {
                  hasEnoughBuffer = true;
                  isLoading.value = false;
                  isBuffering.value = false;
                  console.log("✅ Sufficient buffer loaded, ready to play");

                  if (props.autoplay) {
                    video.play().catch(console.error);
                  }
                }
              }
            });

            // Handle buffering events
            hls.on(Hls.Events.BUFFER_FLUSHING, () => {
              console.log("Buffer flushing...");
            });

            // Detect when we're waiting for data
            video.addEventListener("waiting", () => {
              isBuffering.value = true;
              console.log("⏳ Video waiting for data (buffering)...");
            });

            // Detect when we can play again
            video.addEventListener("canplay", () => {
              if (isBuffering.value) {
                isBuffering.value = false;
                console.log("▶️ Video can play again");
              }
            });

            // Monitor playback progress and buffer
            video.addEventListener("timeupdate", () => {
              if (video.buffered.length > 0) {
                const bufferedEnd = video.buffered.end(
                  video.buffered.length - 1
                );
                const bufferAhead = bufferedEnd - video.currentTime;

                // If buffer is running low, pause and wait
                if (bufferAhead < 3 && !video.paused && !isBuffering.value) {
                  console.warn(
                    `⚠️ Low buffer: ${bufferAhead.toFixed(2)}s - may stutter`
                  );
                }
              }
            });

            hls.on(Hls.Events.LEVEL_LOADED, () => {
              // Update aspect ratio when HLS metadata is available
              handleLoadedMetadata$();
            });

            // Track quality level changes
            hls.on(Hls.Events.LEVEL_SWITCHED, (event: any, data: any) => {
              const level = data.level;
              const quality = availableQualities.value.find(
                (q) => q.level === level
              );
              console.log(`Quality switched to: ${quality?.name || level}`);

              // Update current quality if in auto mode
              if (currentQuality.value === -1) {
                // Still in auto, just logging
              }
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

        {isBuffering.value && !isLoading.value && (
          <div
            class="video-buffering"
            role="status"
            aria-live="polite"
            aria-label="Buffering video"
          >
            <div class="loading-spinner" aria-hidden="true"></div>
            <p>Buffering...</p>
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

        {/* Quality Selector */}
        {availableQualities.value.length > 0 && !isLoading.value && (
          <div class="quality-selector">
            <button
              class="quality-button"
              onClick$={() => (showQualityMenu.value = !showQualityMenu.value)}
              aria-label="Select video quality"
            >
              <span class="quality-icon">⚙️</span>
              <span class="quality-label">
                {currentQuality.value === -1
                  ? "Auto"
                  : availableQualities.value.find(
                      (q) => q.level === currentQuality.value
                    )?.name || "Quality"}
              </span>
            </button>

            {showQualityMenu.value && (
              <div class="quality-menu">
                <div class="quality-menu-header">
                  <span>Quality</span>
                  <button
                    class="quality-close"
                    onClick$={() => (showQualityMenu.value = false)}
                    aria-label="Close quality menu"
                  >
                    ✕
                  </button>
                </div>
                <div class="quality-menu-items">
                  <button
                    class={`quality-menu-item ${currentQuality.value === -1 ? "active" : ""}`}
                    onClick$={() => changeQuality$(-1)}
                  >
                    <span>Auto</span>
                    {currentQuality.value === -1 && (
                      <span class="quality-check">✓</span>
                    )}
                  </button>
                  {availableQualities.value.map((quality) => (
                    <button
                      key={quality.level}
                      class={`quality-menu-item ${currentQuality.value === quality.level ? "active" : ""}`}
                      onClick$={() => changeQuality$(quality.level)}
                    >
                      <span>{quality.name}</span>
                      {currentQuality.value === quality.level && (
                        <span class="quality-check">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
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
