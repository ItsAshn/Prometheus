import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { VideoList } from "~/components/video/video-list";
import { ThemeToggle } from "~/components/theme-toggle/theme-toggle";

export default component$(() => {
  return (
    <div class="public-videos-page">
      <ThemeToggle />
      <div class="site-container">
        <header class="site-header">
          <div class="header-brand">
            <h1>🎬 Video Library</h1>
            <p class="header-tagline">Self-Hosted Platform</p>
          </div>
          <div class="site-nav">
            <a href="/" class="nav-link">
              ← Home
            </a>
            <a href="/admin" class="nav-link">
              Admin
            </a>
          </div>
        </header>

        <main class="site-content">
          <div class="videos-intro">
            <h2>🎬 Video Collection</h2>
            <p>
              Enjoy high-quality streaming with adaptive bitrate delivery. All
              videos are automatically optimized for your device and connection.
            </p>
          </div>

          <VideoList isAdmin={false} />
        </main>

        <footer class="videos-footer">
          <div class="footer-content">
            <p>Self-Hosted Video Platform</p>
            <div class="footer-links">
              <a href="/" class="footer-link">
                ← Back to Home
              </a>
              <a href="/admin" class="footer-link">
                Admin Panel
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Video Library",
  meta: [
    {
      name: "description",
      content: "Watch videos with HLS streaming",
    },
  ],
};
