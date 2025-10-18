import {
  component$,
  useSignal,
  useStylesScoped$,
  useVisibleTask$,
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
  const isLoading = useSignal(true);
  const error = useSignal("");
<<<<<<< Updated upstream
=======
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
>>>>>>> Stashed changes

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track }) => {
    track(() => props.hlsUrl);

    const video = videoRef.value;
    if (!video || !props.hlsUrl) return;

    const loadHLS = async () => {
      try {
        // Convert the hlsUrl to use our streaming API
        const streamingUrl = `/api/video/stream${props.hlsUrl}`;

        // Check if HLS is natively supported
        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = streamingUrl;
          video.addEventListener("loadedmetadata", () => {
            isLoading.value = false;
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
              debug: false, // Disable debug in production
              enableWorker: false,
              lowLatencyMode: false,

<<<<<<< Updated upstream
              // Buffer management settings - optimized for large segments
              backBufferLength: 90, // Larger back buffer for stability
              maxBufferLength: 120, // Much larger forward buffer for big segments
              maxMaxBufferLength: 300, // Higher maximum buffer length for large segments

              // Gap handling settings - more tolerant for large segments
              nudgeOffset: 0.5, // Larger nudge for gaps in large segments
              nudgeMaxRetry: 5, // More retries for nudging
              maxFragLookUpTolerance: 1.0, // Higher tolerance for fragment lookup

              // Loading settings - significantly adjusted for large segments
              maxLoadingDelay: 15, // Much higher loading delay for large segments
              maxBufferHole: 2.0, // Allow much larger buffer holes
              highBufferWatchdogPeriod: 8, // Much longer watchdog period
=======
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
>>>>>>> Stashed changes

              // Fragment retry settings - dramatically increased for large segments
              fragLoadingTimeOut: 120000, // 2 minute timeout for very large segments
              fragLoadingMaxRetry: 10, // Many more retries for large segments
              fragLoadingRetryDelay: 3000, // Longer retry delay

<<<<<<< Updated upstream
              // Manifest and level loading timeouts
              manifestLoadingTimeOut: 30000, // 30 second manifest timeout
              levelLoadingTimeOut: 30000, // 30 second level loading timeout

              // Playback settings - optimized for large segments
              startFragPrefetch: false, // Don't prefetch for large segments
              testBandwidth: false, // Disable bandwidth testing
              progressive: true, // Enable progressive loading

              // ABR (Adaptive Bitrate) settings - more conservative for large segments
              abrEwmaFastLive: 5.0, // Slower adaptation for stability
              abrEwmaSlowLive: 15.0, // Much slower for large segments
              abrEwmaFastVoD: 5.0, // Slower adaptation for VoD
              abrEwmaSlowVoD: 15.0, // Much slower for large segments

              // Additional large segment optimizations
              maxStarvationDelay: 8, // Higher starvation delay
              liveSyncDurationCount: 5, // More segments for live sync
              liveMaxLatencyDurationCount: 10, // Higher latency tolerance
=======
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
>>>>>>> Stashed changes
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

            let networkRetryCount = 0;
            const maxNetworkRetries = 3;

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
              console.error("HLS error details:", {
                type: data.type,
                details: data.details,
                fatal: data.fatal,
                url: data.url,
                response: data.response,
                networkDetails: data.networkDetails,
              });

              // Handle timeout errors specifically - these are common with large segments
              if (data.details === "fragLoadTimeOut") {
                if (!data.fatal) {
                  return;
                }
                // For fatal timeouts, try to recover
                hls.startLoad();
                return;
              }

              // Handle network errors with better retry logic
              if (
                data.details === "fragLoadError" ||
                data.details === "manifestLoadError"
              ) {
                if (!data.fatal) {
                  return;
                }

                if (networkRetryCount < maxNetworkRetries) {
                  networkRetryCount++;
                  setTimeout(() => {
                    hls.startLoad();
                  }, 2000 * networkRetryCount); // Exponential backoff
                  return;
                }
              }

              // Handle buffer-related errors - don't treat as fatal
              if (
                data.details === "bufferSeekOverHole" ||
                data.details === "bufferNudgeOnStall" ||
                data.details === "bufferStalledError"
              ) {
                return; // Let HLS.js handle these automatically
              }

              // Handle level loading errors
              if (
                data.details === "levelLoadTimeOut" ||
                data.details === "levelLoadError"
              ) {
                if (data.fatal) {
                  hls.startLoad();
                }
                return;
              }

              // Only treat truly fatal errors as fatal after retry attempts
              if (data.fatal) {
                switch (data.type) {
                  case Hls.ErrorTypes.NETWORK_ERROR:
                    setTimeout(() => {
                      try {
                        hls.startLoad();
                      } catch (e) {
                        console.error("Failed to restart loading:", e);
                        error.value = `Network error: Failed to load video segments (large segments may take time)`;
                        isLoading.value = false;
                      }
                    }, 5000);
                    break;
                  case Hls.ErrorTypes.MEDIA_ERROR:
                    try {
                      hls.recoverMediaError();
                    } catch (e) {
                      console.error("Failed to recover from media error:", e);
                      error.value = `Media error: ${data.details || "Unknown media error"}`;
                      isLoading.value = false;
                    }
                    break;
                  default:
                    error.value = `Failed to load video stream: ${data.details || "Unknown error"}`;
                    isLoading.value = false;
                    break;
                }
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
            isLoading.value = false;
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
    <article class="video-player-container">
      <div
        class="video-player"
        role="region"
        aria-label={`Video player for ${props.title}`}
      >
        {isLoading.value && (
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
<<<<<<< Updated upstream
        <video
          ref={videoRef}
          controls
          class={`video-element ${isLoading.value ? "loading" : ""}`}
          preload="metadata"
          aria-label={props.title}
          aria-describedby="video-title"
          style={{
            width: "100%",
            height: "auto",
            display: isLoading.value ? "none" : "block",
          }}
        >
          <p>
            Your browser does not support video playback. Please try a different
            browser or update your current one.
          </p>
        </video>
=======

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
>>>>>>> Stashed changes
      </div>
      {!isLoading.value && (
        <header class="video-title">
          <h3 id="video-title">{props.title}</h3>
        </header>
      )}
    </article>
  );
});
