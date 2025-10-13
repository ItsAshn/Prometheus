import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { VideoUpload } from "~/components/video/video-upload";
import { ProcessingStatus } from "~/components/video/processing-status";
import VideoList from "~/components/video/VideoList";
import "./index.css";

export default component$(() => {
  return (
    <div class="admin-videos-page">
      <div class="admin-videos-container">
        {/* Page Header */}
        <header class="admin-videos-header">
          <div class="header-content">
            <h1>
              <span class="header-emoji">📹</span>
              Video Management
            </h1>
            <p class="header-subtitle">
              Upload, process, and manage your video library with HLS streaming
              support
            </p>
          </div>
          <div class="header-actions">
            <a href="/admin" class="back-link">
              <span class="back-icon">←</span>
              Back to Dashboard
            </a>
          </div>
        </header>

        {/* Main Content */}
        <main class="admin-videos-content">
          {/* Upload Section */}
          <section class="section-card upload-section">
            <div class="section-header">
              <div>
                <h2>
                  <span class="section-icon">⬆️</span>
                  Upload New Video
                </h2>
                <p class="section-description">
                  Upload videos in MP4, WebM, or other supported formats. Videos
                  will be automatically processed for HLS streaming.
                </p>
              </div>
            </div>
            <VideoUpload />
          </section>

          {/* Processing Section */}
          <section class="section-card processing-section">
            <div class="section-header">
              <div>
                <h2>
                  <span class="section-icon">⚙️</span>
                  Processing Status
                </h2>
                <p class="section-description">
                  Monitor the progress of videos being processed into HLS
                  format.
                </p>
              </div>
            </div>
            <ProcessingStatus />
          </section>

          {/* Video Library Section */}
          <section class="section-card video-library-section">
            <div class="video-library-header">
              <div class="video-library-title">
                <h2>
                  <span class="section-icon">📚</span>
                  Video Library
                </h2>
              </div>
              <p class="section-description">
                Browse and manage all uploaded videos. Click on any video to
                view details, edit information, or delete.
              </p>
            </div>
            <VideoList isAdmin={true} />
          </section>
        </main>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Video Management - Admin",
  meta: [
    {
      name: "description",
      content: "Manage videos and HLS streaming",
    },
    {
      name: "robots",
      content: "noindex, nofollow",
    },
  ],
};
