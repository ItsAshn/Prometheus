import { component$, useStylesScoped$ } from "@builder.io/qwik";
import {
  LuMonitor,
  LuClapperboard,
  LuBan,
  LuLock,
  LuUnlock,
} from "@qwikest/icons/lucide";
import styles from "./channel-header.css?inline";

interface ChannelHeaderProps {
  channelName: string;
  channelDescription: string;
  videoCount?: number;
  isAuthenticated?: boolean;
  activeTab?: "home" | "videos" | "about";
  bannerImage?: string;
  avatarImage?: string;
}

export const ChannelHeader = component$<ChannelHeaderProps>(
  ({
    channelName,
    channelDescription,
    videoCount = 0,
    isAuthenticated = false,
    activeTab = "home",
    bannerImage = "",
    avatarImage = "",
  }) => {
    useStylesScoped$(styles);

    return (
      <div class="channel-header">
        <div class="channel-banner">
          {bannerImage ? (
            <img
              src={bannerImage}
              alt="Channel banner"
              width="1920"
              height="200"
              style="width: 100%; height: 100%; object-fit: cover;"
            />
          ) : null}
        </div>
        <div class="channel-info-container">
          <div class="channel-info">
            <div class="channel-avatar">
              {avatarImage ? (
                <img
                  src={avatarImage}
                  alt="Channel avatar"
                  width="100"
                  height="100"
                  style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;"
                />
              ) : (
                <span>
                  <LuMonitor />
                </span>
              )}
            </div>
            <div class="channel-details">
              <h1 class="channel-name">{channelName}</h1>
              <p class="channel-description">{channelDescription}</p>
              <div class="channel-stats">
                <div class="stat-item">
                  <span>
                    <LuClapperboard />
                  </span>
                  <span class="stat-value">{videoCount}</span>
                  <span>{videoCount === 1 ? "video" : "videos"}</span>
                </div>
                <div class="stat-item">
                  <span>
                    <LuBan />
                  </span>
                  <span>Ad-Free</span>
                </div>
                <div class="stat-item">
                  <span>
                    <LuLock />
                  </span>
                  <span>Private Hosting</span>
                </div>
                {isAuthenticated && (
                  <div class="admin-badge">
                    <span>
                      <LuUnlock />
                    </span>
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
