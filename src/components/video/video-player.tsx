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
              backBufferLength: 60, // Reasonable back buffer
              maxBufferLength: 60, // Larger forward buffer for big segments
              maxMaxBufferLength: 120, // Higher maximum buffer length

              // Gap handling settings
              nudgeOffset: 0.1, // Small nudge for gaps
              nudgeMaxRetry: 3, // Max retries for nudging
              maxFragLookUpTolerance: 0.25, // Fragment lookup tolerance

              // Loading settings - adjusted for large segments
              maxLoadingDelay: 8, // Higher loading delay for large segments
              maxBufferHole: 1.0, // Allow larger buffer holes
              highBufferWatchdogPeriod: 4, // Longer watchdog period

              // Fragment retry settings - increased for large segments
              fragLoadingTimeOut: 60000, // 60 second timeout for large segments
              fragLoadingMaxRetry: 6, // More retries for large segments
              fragLoadingRetryDelay: 2000, // Longer retry delay

              // Playback settings - optimized for large segments
              startFragPrefetch: false, // Don't prefetch for large segments
              testBandwidth: false, // Disable bandwidth testing
              progressive: true, // Enable progressive loading

              // Additional settings for large segment handling
              manifestLoadingTimeOut: 10000, // Manifest timeout
              levelLoadingTimeOut: 10000, // Level loading timeout

              // ABR (Adaptive Bitrate) settings
              abrEwmaFastLive: 3.0, // Fast EWMA for live
              abrEwmaSlowLive: 9.0, // Slow EWMA for live
              abrEwmaFastVoD: 3.0, // Fast EWMA for VoD
              abrEwmaSlowVoD: 9.0, // Slow EWMA for VoD
            });

            hls.loadSource(streamingUrl);
            hls.attachMedia(video);

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              isLoading.value = false;
              if (props.autoplay) {
                video.play().catch(console.error);
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

              // Handle timeout errors specifically
              if (data.details === "fragLoadTimeOut") {
                console.log("Fragment load timeout detected for large segment");
                if (!data.fatal) {
                  console.log(
                    "Non-fatal timeout, player will retry automatically"
                  );
                  return;
                }
              }

              // Handle network errors
              if (data.details === "fragLoadError") {
                console.log("Fragment load error, likely network related");
                if (!data.fatal) {
                  console.log("Non-fatal load error, player will retry");
                  return;
                }
              }

              // Handle specific gap-related errors
              if (data.details === "bufferSeekOverHole") {
                console.log(
                  "Handling buffer seek over hole - attempting recovery"
                );
                // Don't treat this as fatal, HLS.js should handle it automatically
                return;
              }

              if (data.details === "bufferNudgeOnStall") {
                console.log("Buffer nudge on stall - normal gap handling");
                return;
              }

              // Only treat truly fatal errors as fatal
              if (data.fatal) {
                switch (data.type) {
                  case Hls.ErrorTypes.NETWORK_ERROR:
                    console.log(
                      "Fatal network error, attempting to recover..."
                    );
                    hls.startLoad();
                    break;
                  case Hls.ErrorTypes.MEDIA_ERROR:
                    console.log("Fatal media error, attempting to recover...");
                    hls.recoverMediaError();
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
