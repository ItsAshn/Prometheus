import {
  component$,
  useStylesScoped$,
  useSignal,
  useVisibleTask$,
} from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { loadVideosServer } from "~/lib/data-loaders";
import styles from "./index.css?inline";
import { ChannelHeader } from "~/components/channel/channel-header";
import { useAuthLoader, useSiteConfigLoader } from "../layout";

export default component$(() => {
  useStylesScoped$(styles);

  // Use shared loaders from layout instead of re-fetching
  const auth = useAuthLoader();
  const siteConfig = useSiteConfigLoader();

  const videoCount = useSignal(0);

  // Load video count on client side only
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(async () => {
    const videos = await loadVideosServer();
    videoCount.value = videos?.length || 0;
  });

  // Use site config for display, with fallbacks
  const channelName = siteConfig.value?.channelName || "Your Video Channel";
  const channelDescription =
    siteConfig.value?.channelDescription ||
    "Welcome to my self-hosted video streaming platform.";
  const aboutText =
    siteConfig.value?.aboutText ||
    "Welcome to my channel! This is a self-hosted video streaming platform where I share my content. All videos are hosted on my own infrastructure, ensuring complete privacy and control. Enjoy ad-free streaming with adaptive quality based on your connection speed.";
  const bannerImage = siteConfig.value?.bannerImage || "";
  const avatarImage = siteConfig.value?.avatarImage || "";

  return (
    <div class="about-page">
      <ChannelHeader
        channelName={channelName}
        channelDescription={channelDescription}
        videoCount={videoCount.value}
        isAuthenticated={auth.value.isAuthenticated}
        activeTab="about"
        bannerImage={bannerImage}
        avatarImage={avatarImage}
      />
      <div class="about-container">
        <main class="about-content">
          <div class="about-header">
            <h2>📖 About This Channel</h2>
          </div>

          <div class="about-text-section">
            <div class="about-text">
              {aboutText.split("\n").map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </div>

          <div class="about-features">
            <h3>Platform Features</h3>
            <div class="features-grid">
              <div class="feature-item">
                <span class="feature-icon">🚫</span>
                <h4>Ad-Free Experience</h4>
                <p>
                  Enjoy uninterrupted viewing without any advertisements or
                  sponsored content.
                </p>
              </div>
              <div class="feature-item">
                <span class="feature-icon">🔒</span>
                <h4>Private & Secure</h4>
                <p>
                  Self-hosted infrastructure with complete control over your
                  data and privacy.
                </p>
              </div>
              <div class="feature-item">
                <span class="feature-icon">⚡</span>
                <h4>Fast Streaming</h4>
                <p>
                  HLS adaptive streaming technology for smooth playback on any
                  connection.
                </p>
              </div>
              <div class="feature-item">
                <span class="feature-icon">📱</span>
                <h4>Mobile Optimized</h4>
                <p>
                  Responsive design that works seamlessly across all devices and
                  screen sizes.
                </p>
              </div>
            </div>
          </div>

          {auth.value.isAuthenticated && (
            <div class="admin-info-box">
              <h4>👤 Admin Access</h4>
              <p>
                You're logged in as an administrator. You can edit the about
                text in the{" "}
                <a href="/admin/config" class="config-link">
                  Site Configuration
                </a>{" "}
                page.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: "About - Video Channel",
  meta: [
    {
      name: "description",
      content: "Learn more about this self-hosted video streaming platform",
    },
  ],
};
