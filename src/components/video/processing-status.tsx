import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import { loadProcessingStatusServer } from "~/lib/data-loaders";
import "./processing-status.css";

interface ProcessingStatus {
  videoId: string;
  status: "processing" | "completed" | "failed";
  progress: number;
  title: string;
  startTime: string;
}

export const ProcessingStatus = component$(() => {
  const processingVideos = useSignal<ProcessingStatus[]>([]);
  const isLoading = useSignal(false);

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track, cleanup }) => {
    track(() => processingVideos.value);

    const fetchProcessingStatus = async () => {
      try {
        isLoading.value = true;
        const data = await loadProcessingStatusServer();
        processingVideos.value = data || [];
      } catch (error) {
        console.error("Error fetching processing status:", error);
      } finally {
        isLoading.value = false;
      }
    };

    // Initial fetch
    fetchProcessingStatus();

    // Poll every 3 seconds for updates
    const interval = setInterval(fetchProcessingStatus, 3000);

    cleanup(() => {
      clearInterval(interval);
    });
  });

  if (processingVideos.value.length === 0) {
    return null; // Don't show anything if no videos are processing
  }

  return (
    <div class="mb-8">
      <div class="card">
        <div class="card-header">
          <h3 class="card-title text-lg">🔄 Processing Videos</h3>
        </div>
        <div class="card-content processing-status-grid">
          {processingVideos.value.map((video) => (
            <div key={video.videoId} class="card processing-item-layout">
              <div class="processing-header-layout">
                <span class="video-title-layout font-semibold text-primary">
                  {video.title}
                </span>
                <span
                  class={`badge ${
                    video.status === "processing"
                      ? "badge-warning"
                      : video.status === "completed"
                        ? "badge-success"
                        : "badge-destructive"
                  }`}
                >
                  {video.status === "processing"
                    ? "Processing"
                    : video.status === "completed"
                      ? "Completed"
                      : "Failed"}
                </span>
              </div>

              {video.status === "processing" && (
                <div class="progress-layout">
                  <div class="progress flex-1">
                    <div
                      class="progress-indicator"
                      style={`width: ${video.progress}%`}
                    ></div>
                  </div>
                  <span class="progress-text-layout text-sm font-medium text-muted">
                    {video.progress > 0 ? `${video.progress}%` : "Analyzing..."}
                  </span>
                </div>
              )}

              {video.status === "completed" && (
                <div class="alert alert-success">
                  <div class="alert-description">
                    ✅ Video processing completed successfully!
                  </div>
                </div>
              )}

              {video.status === "failed" && (
                <div class="alert alert-destructive">
                  <div class="alert-description">
                    ❌ Video processing failed. Please try again.
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
