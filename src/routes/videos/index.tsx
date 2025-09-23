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
          <h1>🎬 Video Library</h1>
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
            <h2>Watch Our Videos</h2>
            <p>Enjoy high-quality streaming with adaptive bitrate delivery</p>
          </div>

          <VideoList isAdmin={false} />
        </main>
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
