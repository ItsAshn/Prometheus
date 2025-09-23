import { component$, useSignal, useStore, useTask$, $ } from "@builder.io/qwik";
import { server$ } from "@builder.io/qwik-city";

interface AuthStore {
  isAuthenticated: boolean;
  isFirstTime: boolean;
  isLoading: boolean;
  user: {
    id: string;
    username: string;
    createdAt: string;
  } | null;
}

export const SecureAuth = component$(() => {
  const authStore = useStore<AuthStore>({
    isAuthenticated: false,
    isFirstTime: false,
    isLoading: true,
    user: null,
  });

  const username = useSignal("");
  const password = useSignal("");
  const confirmPassword = useSignal("");
  const error = useSignal("");
  const isSubmitting = useSignal(false);

  // Server function to check auth status
  const checkAuthStatus = server$(async function () {
    try {
      const statusResponse = await fetch(`${this.url.origin}/api/auth/status`);
      const statusData = await statusResponse.json();

      const verifyResponse = await fetch(`${this.url.origin}/api/auth/verify`, {
        headers: {
          Cookie: this.request.headers.get("cookie") || "",
        },
      });

      return {
        isInitialized: statusData.isInitialized,
        isAuthenticated: verifyResponse.ok,
        user: verifyResponse.ok ? (await verifyResponse.json()).user : null,
      };
    } catch {
      return {
        isInitialized: false,
        isAuthenticated: false,
        user: null,
      };
    }
  });

  // Server function for setup
  const setupAccount = server$(async function (
    username: string,
    password: string
  ) {
    try {
      const response = await fetch(`${this.url.origin}/api/auth/setup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      return { success: response.ok, data };
    } catch {
      return { success: false, data: { message: "Network error" } };
    }
  });

  // Server function for login
  const loginUser = server$(async function (
    username: string,
    password: string
  ) {
    try {
      const response = await fetch(`${this.url.origin}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      return { success: response.ok, data };
    } catch {
      return { success: false, data: { message: "Network error" } };
    }
  });

  // Server function for logout
  const logoutUser = server$(async function () {
    try {
      const response = await fetch(`${this.url.origin}/api/auth/verify`, {
        method: "POST",
      });
      return response.ok;
    } catch {
      return false;
    }
  });

  // Check authentication status on component load
  useTask$(async () => {
    const status = await checkAuthStatus();
    authStore.isFirstTime = !status.isInitialized;
    authStore.isAuthenticated = status.isAuthenticated;
    authStore.user = status.user;
    authStore.isLoading = false;
  });

  const handleSetup = $(async () => {
    error.value = "";

    if (!username.value.trim()) {
      error.value = "Username is required";
      return;
    }

    if (password.value.length < 8) {
      error.value = "Password must be at least 8 characters";
      return;
    }

    if (password.value !== confirmPassword.value) {
      error.value = "Passwords do not match";
      return;
    }

    isSubmitting.value = true;

    try {
      const result = await setupAccount(username.value.trim(), password.value);

      if (result.success) {
        authStore.isAuthenticated = true;
        authStore.isFirstTime = false;
        authStore.user = result.data.user;
        // Force page reload to get fresh auth state
        window.location.reload();
      } else {
        error.value = result.data.message || "Setup failed";
      }
    } catch {
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
      const result = await loginUser(username.value.trim(), password.value);

      if (result.success) {
        authStore.isAuthenticated = true;
        authStore.user = result.data.user;
        // Force page reload to get fresh auth state
        window.location.reload();
      } else {
        error.value = result.data.message || "Login failed";
      }
    } catch {
      error.value = "Login failed";
    } finally {
      isSubmitting.value = false;
    }
  });

  const handleLogout = $(async () => {
    try {
      await logoutUser();
      authStore.isAuthenticated = false;
      authStore.user = null;
      username.value = "";
      password.value = "";
      confirmPassword.value = "";
      error.value = "";
      // Force page reload to clear auth state
      window.location.reload();
    } catch {
      error.value = "Logout failed";
    }
  });

  if (authStore.isLoading) {
    return (
      <div class="auth-container">
        <div class="auth-card">
          <div class="loading-spinner"></div>
          <h2>Loading...</h2>
        </div>
      </div>
    );
  }

  if (authStore.isAuthenticated && authStore.user) {
    return (
      <div class="auth-container">
        <div class="auth-card">
          <h2>Welcome back, {authStore.user.username}!</h2>
          <p>You are successfully logged in.</p>
          <p class="user-info">
            Account created:{" "}
            {new Date(authStore.user.createdAt).toLocaleDateString()}
          </p>
          <button
            type="button"
            onClick$={handleLogout}
            class="logout-btn"
            disabled={isSubmitting.value}
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div class="auth-container">
      <div class="auth-card">
        <h2>{authStore.isFirstTime ? "First Time Setup" : "Login"}</h2>
        <p class="auth-description">
          {authStore.isFirstTime
            ? "Create your username and password for this application"
            : "Enter your credentials to access the application"}
        </p>

        <form
          preventdefault:submit
          onSubmit$={authStore.isFirstTime ? handleSetup : handleLogin}
        >
          <div class="form-group">
            <label for="username">Username</label>
            <input
              id="username"
              type="text"
              bind:value={username}
              placeholder="Enter username"
              required
              disabled={isSubmitting.value}
            />
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input
              id="password"
              type="password"
              bind:value={password}
              placeholder="Enter password"
              required
              minLength={8}
              disabled={isSubmitting.value}
            />
          </div>

          {authStore.isFirstTime && (
            <div class="form-group">
              <label for="confirm-password">Confirm Password</label>
              <input
                id="confirm-password"
                type="password"
                bind:value={confirmPassword}
                placeholder="Confirm password"
                required
                minLength={8}
                disabled={isSubmitting.value}
              />
            </div>
          )}

          {error.value && <div class="error-message">{error.value}</div>}

          <button
            type="submit"
            class="submit-btn"
            disabled={isSubmitting.value}
          >
            {isSubmitting.value
              ? "Processing..."
              : authStore.isFirstTime
                ? "Create Account"
                : "Login"}
          </button>
        </form>

        {authStore.isFirstTime && (
          <div class="setup-info">
            <p class="info-text">
              <strong>Security Notice:</strong> This will create the
              administrator account for your self-hosted application. Choose a
              strong password as this account will have full access.
            </p>
          </div>
        )}
      </div>
    </div>
  );
});
