import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { VideoUpload } from "~/components/video/video-upload";
import { VideoList } from "~/components/video/VideoList";
import { ProcessingStatus } from "~/components/video/processing-status";

export default component$(() => {
  return (
    <div class="admin-page">
      <div class="admin-container">
        <div class="admin-header">
          <h1>📹 Video Management</h1>
          <div class="admin-nav">
            <a href="/admin" class="back-link">
              ← Back to Dashboard
            </a>
          </div>
        </div>

        <main class="admin-content">
          <VideoUpload />

          <ProcessingStatus />

          <div class="section-divider">
            <h2>Uploaded Videos</h2>
            <p>Manage your video library</p>
          </div>

          <VideoList isAdmin={true} />
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
