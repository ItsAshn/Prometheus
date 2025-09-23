import { component$, useSignal, useStore, useTask$, $ } from "@builder.io/qwik";
import { server$ } from "@builder.io/qwik-city";
import { ThemeToggle } from "~/components/theme-toggle/theme-toggle";

interface AdminAuthStore {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: {
    username: string;
    isAdmin: boolean;
  } | null;
}

export const AdminAuth = component$(() => {
  const authStore = useStore<AdminAuthStore>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
  });

  const username = useSignal("");
  const password = useSignal("");
  const error = useSignal("");
  const isSubmitting = useSignal(false);

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

  // Server function for admin login
  const loginAdmin = server$(async function (
    username: string,
    password: string
  ) {
    console.log("Server function loginAdmin called with:", {
      username,
      passwordLength: password?.length,
    });

    try {
      const response = await fetch(`${this.url.origin}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Forward any existing cookies
          Cookie: this.request.headers.get("cookie") || "",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      console.log("Login response:", {
        status: response.status,
        success: response.ok,
        data,
      });

      // Important: Forward the Set-Cookie header from the API response
      const setCookieHeader = response.headers.get("set-cookie");
      if (setCookieHeader) {
        console.log("Forwarding Set-Cookie header:", setCookieHeader);
        // Parse and set the cookie using Qwik's cookie API
        const cookieMatch = setCookieHeader.match(/admin-auth-token=([^;]+)/);
        if (cookieMatch) {
          const tokenValue = cookieMatch[1];
          this.cookie.set("admin-auth-token", tokenValue, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            maxAge: 24 * 60 * 60 * 1000,
            path: "/",
          });
        }
      }

      return { success: response.ok, data };
    } catch (error) {
      console.error("Login server function error:", error);
      return { success: false, data: { message: "Network error" } };
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
  });

  const handleLogin = $(async () => {
    console.log("handleLogin called with:", {
      username: username.value,
      password: "***",
    });
    error.value = "";

    if (!username.value.trim() || !password.value) {
      error.value = "Username and password are required";
      return;
    }

    isSubmitting.value = true;
    console.log("About to call loginAdmin server function");

    try {
      const result = await loginAdmin(username.value.trim(), password.value);
      console.log("loginAdmin result:", result);

      if (result.success) {
        console.log("Login successful, redirecting to /");
        authStore.isAuthenticated = true;
        authStore.user = result.data.user;
        // Redirect to main page after successful login
        window.location.href = "/";
      } else {
        console.log("Login failed:", result.data.message);
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
      await logoutAdmin();
      authStore.isAuthenticated = false;
      authStore.user = null;
      username.value = "";
      password.value = "";
      error.value = "";

      // Clear client-side cookie as additional measure
      if (typeof document !== "undefined") {
        document.cookie =
          "admin-auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      }

      // Force page reload to clear auth state
      window.location.reload();
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
            <h1>Admin Dashboard</h1>
            <div class="admin-user-info">
              <span>Welcome, {authStore.user.username}</span>
              <button
                type="button"
                onClick$={handleLogout}
                class="logout-btn"
                disabled={isSubmitting.value}
              >
                Logout
              </button>
            </div>
          </header>

          <main class="admin-content">
            <div class="admin-grid">
              <div class="admin-card">
                <h3>🎛️ System Status</h3>
                <p>Your self-hosted application is running successfully.</p>
                <p>
                  Admin access: <span class="status-active">Active</span>
                </p>
              </div>

              <div class="admin-card">
                <h3>📊 Analytics</h3>
                <p>Public site is accessible to all visitors.</p>
                <p>Admin area is secured and protected.</p>
              </div>

              <div class="admin-card">
                <h3>📹 Video Management</h3>
                <p>Upload and manage videos for HLS streaming.</p>
                <p>Convert videos to adaptive streaming format.</p>
                <p>
                  <a href="/admin/videos" class="admin-link">
                    → Manage Videos
                  </a>
                </p>
              </div>

              <div class="admin-card">
                <h3>⚙️ Site Configuration</h3>
                <p>Customize your channel name, description, and styling.</p>
                <p>Upload custom CSS to personalize your site appearance.</p>
                <p>
                  <a href="/admin/config" class="admin-link">
                    → Configure Site
                  </a>
                </p>
              </div>

              <div class="admin-card">
                <h3>⚙️ System Configuration</h3>
                <p>
                  Admin credentials are configured via environment variables.
                </p>
                <p>JWT tokens expire after 24 hours.</p>
              </div>

              <div class="admin-card">
                <h3>🔗 Quick Links</h3>
                <p>
                  <a href="/" class="admin-link">
                    ← Back to Public Site
                  </a>
                </p>
                <p>Admin panel features can be added here.</p>
              </div>
            </div>
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
            Enter your admin credentials to access the dashboard
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
            class="submit-btn"
            disabled={isSubmitting.value}
          >
            {isSubmitting.value ? "Logging in..." : "Login"}
          </button>
        </form>

        <div class="admin-info">
          <p class="info-text">
            <strong>Note:</strong> Admin credentials are configured through
            environment variables. Check your Docker Compose configuration.
          </p>
          <p>
            <a href="/" class="back-link">
              ← Back to Public Site
            </a>
          </p>
        </div>
      </div>
    </div>
  );
});
