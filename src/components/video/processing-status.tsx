import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";

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
        const response = await fetch("/api/video/processing-status");
        if (response.ok) {
          const data = await response.json();
          processingVideos.value = data.processingVideos || [];
        }
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
    <div class="processing-status-container">
      <div class="processing-status-card">
        <h3>🔄 Processing Videos</h3>

        {processingVideos.value.map((video) => (
          <div key={video.videoId} class="processing-item">
            <div class="processing-header">
              <span class="video-title">{video.title}</span>
              <span class={`status-badge status-${video.status}`}>
                {video.status === "processing"
                  ? "Processing"
                  : video.status === "completed"
                    ? "Completed"
                    : "Failed"}
              </span>
            </div>

            {video.status === "processing" && (
              <div class="progress-container">
                <div class="progress-bar">
                  <div
                    class="progress-fill"
                    style={`width: ${video.progress}%`}
                  ></div>
                </div>
                <span class="progress-text">
                  {video.progress > 0 ? `${video.progress}%` : "Analyzing..."}
                </span>
              </div>
            )}

            {video.status === "completed" && (
              <div class="completion-message">
                ✅ Video processing completed successfully!
              </div>
            )}

            {video.status === "failed" && (
              <div class="error-message">
                ❌ Video processing failed. Please try again.
              </div>
            )}
          </div>
        ))}
      </div>

      <style>{`
        .processing-status-container {
          margin-bottom: 2rem;
        }
        
        .processing-status-card {
          background: #f8f9fa;
          border: 2px solid #e9ecef;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .processing-status-card h3 {
          margin: 0 0 1rem 0;
          color: #495057;
          font-size: 1.2rem;
        }
        
        .processing-item {
          background: white;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 0.75rem;
        }
        
        .processing-item:last-child {
          margin-bottom: 0;
        }
        
        .processing-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }
        
        .video-title {
          font-weight: 600;
          color: #212529;
          flex: 1;
          margin-right: 1rem;
          word-break: break-word;
        }
        
        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.025rem;
        }
        
        .status-processing {
          background: #fff3cd;
          color: #856404;
          border: 1px solid #ffeaa7;
        }
        
        .status-completed {
          background: #d1edff;
          color: #0c5aa6;
          border: 1px solid #b3d9ff;
        }
        
        .status-failed {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f1aeb5;
        }
        
        .progress-container {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        .progress-bar {
          flex: 1;
          height: 8px;
          background: #e9ecef;
          border-radius: 4px;
          overflow: hidden;
        }
        
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #007bff, #0056b3);
          border-radius: 4px;
          transition: width 0.3s ease;
        }
        
        .progress-text {
          font-size: 0.875rem;
          font-weight: 500;
          color: #6c757d;
          min-width: 4rem;
          text-align: right;
        }
        
        .completion-message {
          color: #155724;
          background: #d4edda;
          border: 1px solid #c3e6cb;
          border-radius: 4px;
          padding: 0.5rem;
          font-size: 0.875rem;
        }
        
        .error-message {
          color: #721c24;
          background: #f8d7da;
          border: 1px solid #f1aeb5;
          border-radius: 4px;
          padding: 0.5rem;
          font-size: 0.875rem;
        }
      `}</style>
    </div>
  );
});
