import { component$, useStylesScoped$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import styles from "./index.css?inline";
import VideoList from "~/components/video/VideoList";

export default component$(() => {
  useStylesScoped$(styles);
  return (
    <div class="public-videos-page">
      <div class="site-container">
        <main class="site-content">
          <div class="videos-intro">
            <h2>🎬 Video Collection</h2>
            <p>
              Enjoy high-quality streaming with adaptive bitrate delivery. All
              videos are automatically optimized for your device and connection.
            </p>
          </div>

          <VideoList
            displayMode="grid"
            showTitles={true}
            enablePlayer={false}
            showActions={false}
            showMetadata={true}
            sortBy="newest"
          />
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
