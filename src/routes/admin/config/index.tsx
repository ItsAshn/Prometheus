import { component$, useStore, useTask$, $ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { SiteConfigManager } from "~/components/admin/site-config-manager";
import {
  checkAdminAuthServer,
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

  // Check authentication status on component load
  useTask$(async () => {
    const status = await checkAdminAuthServer();
    authStore.isAuthenticated = status.isAuthenticated;
    authStore.user = status.user;
    authStore.isLoading = false;

    // Redirect to admin login if not authenticated
    if (!status.isAuthenticated) {
      window.location.href = "/admin";
    }
  });

  const handleLogout = $(async () => {
    try {
      await logoutAdminServer();
      authStore.isAuthenticated = false;
      authStore.user = null;

      // Clear client-side cookie as additional measure
      if (typeof document !== "undefined") {
        document.cookie =
          "admin-auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      }

      // Redirect to admin page
      window.location.href = "/admin";
    } catch {
      // Still redirect on error
      window.location.href = "/admin";
    }
  });

  if (authStore.isLoading) {
    return (
      <div class="admin-container">
        <div class="admin-card">
          <div class="loading-spinner"></div>
          <h2>Loading...</h2>
        </div>
      </div>
    );
  }

  if (!authStore.isAuthenticated || !authStore.user) {
    return (
      <div class="admin-container">
        <div class="admin-card">
          <h2>Access Denied</h2>
          <p>Redirecting to admin login...</p>
        </div>
      </div>
    );
  }

  return (
    <div class="admin-dashboard">
      <header class="admin-header">
        <h1>Site Configuration</h1>
        <div class="admin-user-info">
          <span>Welcome, {authStore.user.username}</span>
          <a href="/admin" class="back-link">
            ← Dashboard
          </a>
          <button
            type="button"
            onClick$={handleLogout}
            class="btn btn-destructive"
          >
            Logout
          </button>
        </div>
      </header>

      <main class="admin-content">
        <SiteConfigManager />
      </main>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Site Configuration - Admin",
  meta: [
    {
      name: "description",
      content: "Configure your channel settings and custom styling",
    },
    {
      name: "robots",
      content: "noindex, nofollow",
    },
  ],
};
