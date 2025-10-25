import {
  component$,
  useSignal,
  useStore,
  useTask$,
  $,
  useStylesScoped$,
} from "@builder.io/qwik";
import {
  checkAdminAuthServer,
  checkSetupStatusServer,
  performInitialSetupServer,
  loginAdminServer,
  logoutAdminServer,
} from "~/lib/admin-auth-utils";
import styles from "./adminAuth.css?inline";

interface AdminAuthStore {
  isAuthenticated: boolean;
  isLoading: boolean;
  needsSetup: boolean;
  user: {
    username: string;
    isAdmin: boolean;
  } | null;
}

export default component$(() => {
  useStylesScoped$(styles);
  const authStore = useStore<AdminAuthStore>({
    isAuthenticated: false,
    isLoading: true,
    needsSetup: false,
    user: null,
  });

  const username = useSignal("");
  const password = useSignal("");
  const confirmPassword = useSignal("");
  const error = useSignal("");
  const isSubmitting = useSignal(false);

  // Check authentication status and setup status on component load
  useTask$(async () => {
    try {
      // Check if setup is needed
      const setupStatus = await checkSetupStatusServer();
      authStore.needsSetup = setupStatus.needsSetup;

      // If setup is complete, check auth status
      if (!setupStatus.needsSetup) {
        const status = await checkAdminAuthServer();
        authStore.isAuthenticated = status.isAuthenticated;
        authStore.user = status.user;
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      authStore.isAuthenticated = false;
      authStore.user = null;
    } finally {
      authStore.isLoading = false;
    }
  });

  const handleInitialSetup = $(async () => {
    error.value = "";

    if (!username.value.trim() || !password.value) {
      error.value = "Username and password are required";
      return;
    }

    if (password.value !== confirmPassword.value) {
      error.value = "Passwords do not match";
      return;
    }

    if (username.value.trim().length < 3) {
      error.value = "Username must be at least 3 characters long";
      return;
    }

    if (password.value.length < 8) {
      error.value = "Password must be at least 8 characters long";
      return;
    }

    isSubmitting.value = true;

    try {
      const result = await performInitialSetupServer(
        username.value.trim(),
        password.value
      );

      if (result.success) {
        authStore.isAuthenticated = true;
        authStore.needsSetup = false;
        authStore.user = result.data.user || null;
        // Redirect to main page after successful setup
        window.location.href = "/admin";
      } else {
        error.value = result.data.message || "Setup failed";
      }
    } catch (err) {
      console.error("Setup error:", err);
      error.value = "Setup failed";
    } finally {
      isSubmitting.value = false;
    }
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
        // Redirect to main page after successful login
        window.location.href = "/";
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
      confirmPassword.value = "";
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
        <div class="admin-dashboard">
          <header class="admin-header">
            <h1>Admin Dashboard</h1>
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
                <h3>� System Updates</h3>
                <p>
                  Pull the latest version and restart your Docker container.
                </p>
                <p>
                  Keep your application up to date with the latest features and
                  fixes.
                </p>
                <p>
                  <a href="/admin/system-update" class="admin-link">
                    → Manage Updates
                  </a>
                </p>
              </div>

              <div class="admin-card">
                <h3>�🔗 Quick Links</h3>
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

  // Show initial setup form if needed
  if (authStore.needsSetup) {
    return (
      <div class="admin-container">
        <div class="admin-card">
          <header class="admin-login-header">
            <h2>🚀 Initial Setup</h2>
            <p class="admin-description">
              Welcome! Set up your admin account to get started.
            </p>
          </header>

          <form preventdefault:submit onSubmit$={handleInitialSetup}>
            <div class="form-group">
              <label for="admin-username">Username</label>
              <input
                id="admin-username"
                type="text"
                bind:value={username}
                placeholder="Choose admin username (min 3 chars)"
                required
                minLength={3}
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
                placeholder="Choose admin password (min 8 chars)"
                required
                minLength={8}
                disabled={isSubmitting.value}
                autocomplete="new-password"
              />
            </div>

            <div class="form-group">
              <label for="admin-confirm-password">Confirm Password</label>
              <input
                id="admin-confirm-password"
                type="password"
                bind:value={confirmPassword}
                placeholder="Confirm your password"
                required
                minLength={8}
                disabled={isSubmitting.value}
                autocomplete="new-password"
              />
            </div>

            {error.value && <div class="error-message">{error.value}</div>}

            <button
              type="submit"
              class="btn btn-primary btn-full btn-lg"
              disabled={isSubmitting.value}
            >
              {isSubmitting.value ? "Setting up..." : "Complete Setup"}
            </button>
          </form>

          <div class="admin-info">
            <p class="info-text">
              <strong>Note:</strong> Your credentials will be securely stored
              and can be used for future logins.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div class="admin-container">
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
            class="btn btn-primary btn-full btn-lg"
            disabled={isSubmitting.value}
          >
            {isSubmitting.value ? "Logging in..." : "Login"}
          </button>
        </form>

        <div class="admin-info">
          <p class="info-text">
            <strong>Note:</strong> Use the credentials you set up during initial
            configuration.
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
