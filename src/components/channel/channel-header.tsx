import { component$, useStylesScoped$ } from "@builder.io/qwik";
import styles from "./channel-header.css?inline";

interface ChannelHeaderProps {
  channelName: string;
  channelDescription: string;
  videoCount?: number;
  isAuthenticated?: boolean;
  activeTab?: "home" | "videos" | "about";
}

export const ChannelHeader = component$<ChannelHeaderProps>(
  ({
    channelName,
    channelDescription,
    videoCount = 0,
    isAuthenticated = false,
    activeTab = "home",
  }) => {
    useStylesScoped$(styles);

    return (
      <div class="channel-header">
        <div class="channel-banner"></div>
        <div class="channel-info-container">
          <div class="channel-info">
            <div class="channel-avatar">📺</div>
            <div class="channel-details">
              <h1 class="channel-name">{channelName}</h1>
              <p class="channel-description">{channelDescription}</p>
              <div class="channel-stats">
                <div class="stat-item">
                  <span>🎬</span>
                  <span class="stat-value">{videoCount}</span>
                  <span>{videoCount === 1 ? "video" : "videos"}</span>
                </div>
                <div class="stat-item">
                  <span>🚫</span>
                  <span>Ad-Free</span>
                </div>
                <div class="stat-item">
                  <span>🔒</span>
                  <span>Private Hosting</span>
                </div>
                {isAuthenticated && (
                  <div class="admin-badge">
                    <span>🔓</span>
                    <span>Admin</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div class="channel-tabs">
            <a
              href="/"
              class={`tab-button ${activeTab === "home" ? "active" : ""}`}
            >
              Home
            </a>
            <a
              href="/videos"
              class={`tab-button ${activeTab === "videos" ? "active" : ""}`}
            >
              Videos
            </a>
            <a
              href="/about"
              class={`tab-button ${activeTab === "about" ? "active" : ""}`}
            >
              About
            </a>
          </div>
        </div>
      </div>
    );
  }
);
