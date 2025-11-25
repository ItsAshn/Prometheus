import { component$, Slot, useStylesScoped$ } from "@builder.io/qwik";
import { useLocation } from "@builder.io/qwik-city";
import {
  LuSlidersHorizontal,
  LuUser,
  LuLayoutDashboard,
  LuClapperboard,
  LuSettings,
  LuRefreshCw,
  LuHome,
} from "@qwikest/icons/lucide";
import { useAuthLoader } from "../layout";

export const Layout = component$(() => {
  useStylesScoped$(styles);
  const auth = useAuthLoader();
  const location = useLocation();

  // Check if current route is active
  const isActive = (path: string) => {
    if (path === "/admin" && location.url.pathname === "/admin") {
      return true;
    }
    return location.url.pathname.startsWith(path) && path !== "/admin";
  };

  // If not authenticated, show the login page without sidebar
  if (!auth.value.isAuthenticated) {
    return (
      <div class="admin-login-container">
        <Slot />
      </div>
    );
  }

  return (
    <div class="admin-layout">
      {/* Sidebar Navigation */}
      <aside class="admin-sidebar">
        <div class="sidebar-header">
          <div class="sidebar-brand">
            <span class="brand-icon">
              <LuSlidersHorizontal />
            </span>
            <span class="brand-text">Admin Panel</span>
          </div>
          <div class="sidebar-user">
            <span class="user-avatar">
              <LuUser />
            </span>
            <div class="user-details">
              <span class="user-name">{auth.value.user?.username}</span>
              <span class="user-role">Administrator</span>
            </div>
          </div>
        </div>

        <nav class="sidebar-nav">
          <a
            href="/admin"
            class={`nav-item ${isActive("/admin") ? "active" : ""}`}
          >
            <span class="nav-icon">
              <LuLayoutDashboard />
            </span>
            <span class="nav-label">Dashboard</span>
          </a>
          <a
            href="/admin/videos"
            class={`nav-item ${isActive("/admin/videos") ? "active" : ""}`}
          >
            <span class="nav-icon">
              <LuClapperboard />
            </span>
            <span class="nav-label">Videos</span>
          </a>
          <a
            href="/admin/config"
            class={`nav-item ${isActive("/admin/config") ? "active" : ""}`}
          >
            <span class="nav-icon">
              <LuSettings />
            </span>
            <span class="nav-label">Site Config</span>
          </a>
          <a
            href="/admin/system-update"
            class={`nav-item ${isActive("/admin/system-update") ? "active" : ""}`}
          >
            <span class="nav-icon">
              <LuRefreshCw />
            </span>
            <span class="nav-label">System Update</span>
          </a>
        </nav>

        <div class="sidebar-footer">
          <a href="/" class="nav-item">
            <span class="nav-icon">
              <LuHome />
            </span>
            <span class="nav-label">Back to Site</span>
          </a>
        </div>
      </aside>

      {/* Main Content Area */}
      <main class="admin-main">
        <Slot />
      </main>
    </div>
  );
});

const styles = `
/* Admin Layout Container */
.admin-layout {
  display: flex;
  min-height: 100vh;
  background: var(--color-background);
}

/* Admin Login Container (for non-authenticated users) */
.admin-login-container {
  min-height: 100vh;
  width: 100%;
  background: var(--color-background);
}

/* Sidebar */
.admin-sidebar {
  width: 280px;
  background: var(--color-card);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
  box-shadow: var(--shadow-md);
}

.sidebar-header {
  padding: var(--spacing-6);
  border-bottom: 1px solid var(--color-border);
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-6);
}

.brand-icon {
  font-size: 2rem;
}

.brand-text {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-foreground);
}

.sidebar-user {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-3);
  background: var(--color-secondary);
  border-radius: var(--radius-lg);
}

.user-avatar {
  font-size: 1.5rem;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary);
  border-radius: var(--radius-full);
  flex-shrink: 0;
}

.user-details {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.user-name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-foreground);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  font-size: var(--font-size-xs);
  color: var(--color-muted-foreground);
}

/* Sidebar Navigation */
.sidebar-nav {
  flex: 1;
  padding: var(--spacing-4);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--radius-md);
  text-decoration: none;
  color: var(--color-muted-foreground);
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-sm);
  transition: all 0.2s ease;
  position: relative;
}

.nav-item:hover {
  background: var(--color-muted);
  color: var(--color-foreground);
}

.nav-item.active {
  background: var(--color-primary);
  color: var(--color-primary-foreground);
  font-weight: var(--font-weight-semibold);
}

.nav-item.active::before {
  content: "";
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 70%;
  background: var(--color-primary-foreground);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
}

.nav-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.nav-label {
  white-space: nowrap;
}

/* Sidebar Footer */
.sidebar-footer {
  padding: var(--spacing-4);
  border-top: 1px solid var(--color-border);
}

/* Main Content Area */
.admin-main {
  flex: 1;
  padding: var(--spacing-8);
  overflow-x: hidden;
  max-width: 100%;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .admin-sidebar {
    width: 240px;
  }

  .admin-main {
    padding: var(--spacing-6);
  }
}

@media (max-width: 768px) {
  .admin-layout {
    flex-direction: column;
  }

  .admin-sidebar {
    width: 100%;
    height: auto;
    position: static;
    border-right: none;
    border-bottom: 1px solid var(--color-border);
  }

  .sidebar-header {
    padding: var(--spacing-4);
  }

  .sidebar-brand {
    margin-bottom: var(--spacing-4);
  }

  .brand-text {
    font-size: var(--font-size-lg);
  }

  .sidebar-nav {
    flex-direction: row;
    overflow-x: auto;
    padding: var(--spacing-3);
    gap: var(--spacing-3);
  }

  .nav-item {
    flex-direction: column;
    gap: var(--spacing-1);
    padding: var(--spacing-2);
    min-width: 80px;
    text-align: center;
  }

  .nav-icon {
    font-size: 1.5rem;
  }

  .nav-label {
    font-size: var(--font-size-xs);
  }

  .sidebar-footer {
    padding: var(--spacing-3);
  }

  .admin-main {
    padding: var(--spacing-4);
  }
}

@media (max-width: 480px) {
  .admin-main {
    padding: var(--spacing-3);
  }

  .user-name {
    font-size: var(--font-size-xs);
  }

  .nav-item {
    min-width: 70px;
  }
}
`;
