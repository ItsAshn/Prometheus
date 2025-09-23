import { component$, useStore, useTask$, $ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { server$ } from "@builder.io/qwik-city";
import { SiteConfigManager } from "~/components/admin/site-config-manager";
import { ThemeToggle } from "~/components/theme-toggle/theme-toggle";

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

  // Server function to check admin auth status
  const checkAdminAuth = server$(async function () {
    try {
      const verifyResponse = await fetch(`${this.url.origin}/api/auth/verify`, {
        headers: {
          Cookie: this.request.headers.get("cookie") || "",
        },
      });

      if (verifyResponse.ok) {
        const data = await verifyResponse.json();
        return {
          isAuthenticated: true,
          user: data.user,
        };
      }

      return {
        isAuthenticated: false,
        user: null,
      };
    } catch {
      return {
        isAuthenticated: false,
        user: null,
      };
    }
  });

  // Server function for admin logout
  const logoutAdmin = server$(async function () {
    try {
      const response = await fetch(`${this.url.origin}/api/auth/verify`, {
        method: "POST",
        headers: {
          Cookie: this.request.headers.get("cookie") || "",
        },
      });

      // Clear the cookie on the server side as well
      this.cookie.delete("admin-auth-token", { path: "/" });

      return response.ok;
    } catch {
      return false;
    }
  });

  // Check authentication status on component load
  useTask$(async () => {
    const status = await checkAdminAuth();
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
      await logoutAdmin();
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
        <ThemeToggle />
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
        <ThemeToggle />
        <div class="admin-card">
          <h2>Access Denied</h2>
          <p>Redirecting to admin login...</p>
        </div>
      </div>
    );
  }

  return (
    <div class="admin-dashboard">
      <ThemeToggle />
      <header class="admin-header">
        <h1>Site Configuration</h1>
        <div class="admin-user-info">
          <span>Welcome, {authStore.user.username}</span>
          <a href="/admin" class="back-link">
            ← Dashboard
          </a>
          <button type="button" onClick$={handleLogout} class="logout-btn">
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
