import {
  component$,
  useSignal,
  $,
  type QwikMouseEvent,
} from "@builder.io/qwik";

interface SimpleSidebarProps {
  channelName: string;
}

export const SimpleSidebar = component$<SimpleSidebarProps>(
  ({ channelName }) => {
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
                <a
                  href="/admin"
                  class="sidebar-link admin-login-link"
                  onClick$={closeSidebar}
                >
                  <span class="sidebar-icon">🔐</span>
                  Admin Login
                </a>
              </div>
            </nav>
          </div>
        )}
      </>
    );
  }
);
