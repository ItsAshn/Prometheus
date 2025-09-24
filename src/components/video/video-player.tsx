import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";

interface VideoPlayerProps {
  hlsUrl: string;
  title: string;
  autoplay?: boolean;
}

export const VideoPlayer = component$<VideoPlayerProps>((props) => {
  const videoRef = useSignal<HTMLVideoElement>();
  const isLoading = useSignal(true);
  const error = useSignal("");

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track }) => {
    track(() => props.hlsUrl);

    const video = videoRef.value;
    if (!video || !props.hlsUrl) return;

    const loadHLS = async () => {
      try {
        // Convert the hlsUrl to use our streaming API
        const streamingUrl = `/api/video/stream${props.hlsUrl}`;
        console.log("Loading HLS from:", streamingUrl);

        // Check if HLS is natively supported
        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          console.log("Using native HLS support");
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

              // Fragment retry settings - dramatically increased for large segments
              fragLoadingTimeOut: 120000, // 2 minute timeout for very large segments
              fragLoadingMaxRetry: 10, // Many more retries for large segments
              fragLoadingRetryDelay: 3000, // Longer retry delay

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
            });

            hls.loadSource(streamingUrl);
            hls.attachMedia(video);

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              isLoading.value = false;
              if (props.autoplay) {
                video.play().catch(console.error);
              }
            });

            let networkRetryCount = 0;
            const maxNetworkRetries = 3;

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
                console.log("Fragment load timeout detected for large segment");
                if (!data.fatal) {
                  console.log(
                    "Non-fatal timeout, player will retry automatically"
                  );
                  return;
                }
                // For fatal timeouts, try to recover
                console.log("Fatal timeout, attempting recovery...");
                hls.startLoad();
                return;
              }

              // Handle network errors with better retry logic
              if (
                data.details === "fragLoadError" ||
                data.details === "manifestLoadError"
              ) {
                console.log(`${data.details} detected, likely network related`);
                if (!data.fatal) {
                  console.log("Non-fatal load error, player will retry");
                  return;
                }

                if (networkRetryCount < maxNetworkRetries) {
                  networkRetryCount++;
                  console.log(
                    `Fatal network error, retry attempt ${networkRetryCount}/${maxNetworkRetries}`
                  );
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
                console.log(
                  `Buffer handling: ${data.details} - attempting automatic recovery`
                );
                return; // Let HLS.js handle these automatically
              }

              // Handle level loading errors
              if (
                data.details === "levelLoadTimeOut" ||
                data.details === "levelLoadError"
              ) {
                console.log("Level loading issue, attempting recovery...");
                if (data.fatal) {
                  hls.startLoad();
                }
                return;
              }

              // Only treat truly fatal errors as fatal after retry attempts
              if (data.fatal) {
                switch (data.type) {
                  case Hls.ErrorTypes.NETWORK_ERROR:
                    console.log(
                      "Fatal network error after retries, final recovery attempt..."
                    );
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
                    console.log("Fatal media error, attempting to recover...");
                    try {
                      hls.recoverMediaError();
                    } catch (e) {
                      console.error("Failed to recover from media error:", e);
                      error.value = `Media error: ${data.details || "Unknown media error"}`;
                      isLoading.value = false;
                    }
                    break;
                  default:
                    console.log("Unrecoverable error:", data);
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
          // Fallback: try to load the video directly
          video.src = streamingUrl;
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
      <div class="video-player-error">
        <div class="error-icon">⚠️</div>
        <p>{error.value}</p>
        <p class="error-details">Video: {props.title}</p>
      </div>
    );
  }

  return (
    <div class="video-player-container">
      <div class="video-player">
        {isLoading.value && (
          <div class="video-loading">
            <div class="loading-spinner"></div>
            <p>Loading video...</p>
          </div>
        )}
        <video
          ref={videoRef}
          controls
          class={`video-element ${isLoading.value ? "loading" : ""}`}
          preload="metadata"
          style={{
            width: "100%",
            height: "auto",
            display: isLoading.value ? "none" : "block",
          }}
        >
          <p>Your browser does not support video playback.</p>
        </video>
      </div>
      {!isLoading.value && (
        <div class="video-title">
          <h3>{props.title}</h3>
        </div>
      )}
    </div>
  );
});
