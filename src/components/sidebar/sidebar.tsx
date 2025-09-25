import {
  component$,
  useSignal,
  $,
  type QwikMouseEvent,
  type QRL,
} from "@builder.io/qwik";

interface SidebarProps {
  channelName: string;
  isAuthenticated: boolean;
  username: string;
  isLoading: boolean;
  onLogout: QRL<() => void>;
}

export const Sidebar = component$<SidebarProps>(
  ({ channelName, isAuthenticated, username, isLoading, onLogout }) => {
    const isOpen = useSignal(false);

    const toggleSidebar = $(() => {
      isOpen.value = !isOpen.value;
    });

    const closeSidebar = $(() => {
      isOpen.value = false;
    });

    const handleOverlayClick = $((e: QwikMouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        closeSidebar();
      }
    });

    return (
      <>
        {/* Sidebar Toggle Button - Hide when sidebar is open */}
        {!isOpen.value && (
          <button
            class="sidebar-toggle"
            onClick$={toggleSidebar}
            aria-label="Toggle navigation menu"
          >
            <span class="hamburger-line"></span>
            <span class="hamburger-line"></span>
            <span class="hamburger-line"></span>
          </button>
        )}

        {/* Sidebar Overlay */}
        {isOpen.value && (
          <div class="sidebar-overlay" onClick$={handleOverlayClick}>
            {/* Sidebar */}
            <nav class={`sidebar ${isOpen.value ? "sidebar-open" : ""}`}>
              {/* Sidebar Header */}
              <div class="sidebar-header">
                <div class="sidebar-brand">
                  <h1>{channelName}</h1>
                  <p class="sidebar-tagline">Self-Hosted Video Platform</p>
                </div>
                <button
                  class="sidebar-close"
                  onClick$={closeSidebar}
                  aria-label="Close navigation menu"
                >
                  ×
                </button>
              </div>

              {/* Sidebar Navigation */}
              <div class="sidebar-nav">
                <a href="/" class="sidebar-link" onClick$={closeSidebar}>
                  <span class="sidebar-icon">🏠</span>
                  Home
                </a>
                <a href="/videos" class="sidebar-link" onClick$={closeSidebar}>
                  <span class="sidebar-icon">🎬</span>
                  Videos
                </a>

                {/* Authentication Section */}
                <div class="sidebar-auth-section">
                  {isLoading ? (
                    <div class="sidebar-loading">Loading...</div>
                  ) : isAuthenticated ? (
                    <div class="sidebar-admin-section">
                      <div class="sidebar-admin-info">
                        <span class="sidebar-admin-welcome">
                          Welcome, {username}
                        </span>
                      </div>
                      <a
                        href="/admin"
                        class="sidebar-link admin-link"
                        onClick$={closeSidebar}
                      >
                        <span class="sidebar-icon">🎛️</span>
                        Dashboard
                      </a>
                      <a
                        href="/admin/videos"
                        class="sidebar-link admin-link"
                        onClick$={closeSidebar}
                      >
                        <span class="sidebar-icon">📹</span>
                        Manage Videos
                      </a>
                      <a
                        href="/admin/config"
                        class="sidebar-link admin-link"
                        onClick$={closeSidebar}
                      >
                        <span class="sidebar-icon">⚙️</span>
                        Settings
                      </a>
                      <button
                        onClick$={() => {
                          onLogout();
                          closeSidebar();
                        }}
                        class="btn btn-destructive btn-sm mx-4"
                      >
                        <span class="sidebar-icon">🚪</span>
                        Logout
                      </button>
                    </div>
                  ) : (
                    <a
                      href="/admin"
                      class="sidebar-link admin-login-link"
                      onClick$={closeSidebar}
                    >
                      <span class="sidebar-icon">🔐</span>
                      Admin Login
                    </a>
                  )}
                </div>
              </div>
            </nav>
          </div>
        )}
      </>
    );
  }
);
