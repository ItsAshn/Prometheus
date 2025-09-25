import { component$, useSignal, useStore, useTask$, $ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { ThemeToggle } from "~/components/theme-toggle/theme-toggle";
import { SystemUpdateManager } from "~/components/admin/system-update-manager";
import {
  checkAdminAuthServer,
  loginAdminServer,
  logoutAdminServer,
} from "~/lib/admin-auth-utils";

interface AdminAuthStore {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: {
    username: string;
    isAdmin: boolean;
  } | null;
}

export default component$(() => {
  const authStore = useStore<AdminAuthStore>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
  });

  const username = useSignal("");
  const password = useSignal("");
  const error = useSignal("");
  const isSubmitting = useSignal(false);

  // Check authentication status on component load
  useTask$(async () => {
    const status = await checkAdminAuthServer();
    authStore.isAuthenticated = status.isAuthenticated;
    authStore.user = status.user;
    authStore.isLoading = false;
  });

  const handleLogin = $(async () => {
    error.value = "";

    if (!username.value.trim() || !password.value) {
      error.value = "Username and password are required";
      return;
    }

    isSubmitting.value = true;

    try {
      const result = await loginAdminServer(
        username.value.trim(),
        password.value
      );

      if (result.success) {
        authStore.isAuthenticated = true;
        authStore.user = result.data.user || null;
      } else {
        error.value = result.data.message || "Login failed";
      }
    } catch (err) {
      console.error("Login error:", err);
      error.value = "Login failed";
    } finally {
      isSubmitting.value = false;
    }
  });

  const handleLogout = $(async () => {
    try {
      await logoutAdminServer();
      authStore.isAuthenticated = false;
      authStore.user = null;
      username.value = "";
      password.value = "";
      error.value = "";

      if (typeof document !== "undefined") {
        document.cookie =
          "admin-auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      }

      window.location.href = "/admin";
    } catch {
      error.value = "Logout failed";
    }
  });

  if (authStore.isLoading) {
    return (
      <div class="admin-container">
        <ThemeToggle />
        <div class="admin-card">
          <div class="loading-spinner"></div>
          <h2>Loading...</h2>
        </div>
      </div>
    );
  }

  if (authStore.isAuthenticated && authStore.user) {
    return (
      <div class="admin-container">
        <ThemeToggle />
        <div class="admin-dashboard">
          <header class="admin-header">
            <h1>System Updates</h1>
            <div class="admin-user-info">
              <span>Welcome, {authStore.user.username}</span>
              <button
                type="button"
                onClick$={handleLogout}
                class="btn btn-destructive"
                disabled={isSubmitting.value}
              >
                Logout
              </button>
            </div>
          </header>

          <main class="admin-content">
            <div class="admin-nav">
              <a href="/admin" class="nav-link">
                ← Back to Dashboard
              </a>
            </div>
            <SystemUpdateManager />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div class="admin-container">
      <ThemeToggle />
      <div class="admin-card">
        <header class="admin-login-header">
          <h2>🔐 Admin Login</h2>
          <p class="admin-description">
            Enter your admin credentials to access the system update panel
          </p>
        </header>

        <form preventdefault:submit onSubmit$={handleLogin}>
          <div class="form-group">
            <label for="admin-username">Username</label>
            <input
              id="admin-username"
              type="text"
              bind:value={username}
              placeholder="Enter admin username"
              required
              disabled={isSubmitting.value}
              autocomplete="username"
            />
          </div>

          <div class="form-group">
            <label for="admin-password">Password</label>
            <input
              id="admin-password"
              type="password"
              bind:value={password}
              placeholder="Enter admin password"
              required
              disabled={isSubmitting.value}
              autocomplete="current-password"
            />
          </div>

          {error.value && <div class="error-message">{error.value}</div>}

          <button
            type="submit"
            class="btn btn-primary btn-full btn-lg"
            disabled={isSubmitting.value}
          >
            {isSubmitting.value ? "Logging in..." : "Login"}
          </button>
        </form>

        <div class="admin-info">
          <p>
            <a href="/admin" class="back-link">
              ← Back to Admin Dashboard
            </a>
          </p>
        </div>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: "System Updates - Admin Panel",
  meta: [
    {
      name: "description",
      content: "System update management for self-hosted video platform",
    },
    {
      name: "robots",
      content: "noindex, nofollow",
    },
  ],
};
