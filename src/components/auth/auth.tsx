import {
  $,
  component$,
  useSignal,
  useStore,
  useVisibleTask$,
} from "@builder.io/qwik";

interface AuthStore {
  isAuthenticated: boolean;
  isFirstTime: boolean;
  isLoading: boolean;
}

interface Credentials {
  username: string;
  password: string;
}

export const Auth = component$(() => {
  const authStore = useStore<AuthStore>({
    isAuthenticated: false,
    isFirstTime: false,
    isLoading: true,
  });

  const username = useSignal("");
  const password = useSignal("");
  const confirmPassword = useSignal("");
  const error = useSignal("");

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(() => {
    const storedCredentials = localStorage.getItem("app-credentials");
    if (!storedCredentials) {
      authStore.isFirstTime = true;
    } else {
      authStore.isFirstTime = false;
    }
    authStore.isLoading = false;
  });

  const hashPassword = async (password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  };

  const setupCredentials = async () => {
    error.value = "";

    if (!username.value.trim()) {
      error.value = "Username is required";
      return;
    }

    if (password.value.length < 6) {
      error.value = "Password must be at least 6 characters";
      return;
    }

    if (password.value !== confirmPassword.value) {
      error.value = "Passwords do not match";
      return;
    }

    try {
      const hashedPassword = await hashPassword(password.value);
      const credentials: Credentials = {
        username: username.value.trim(),
        password: hashedPassword,
      };

      localStorage.setItem("app-credentials", JSON.stringify(credentials));
      sessionStorage.setItem("auth-session", "true");
      authStore.isAuthenticated = true;
      authStore.isFirstTime = false;

      // Dispatch auth change event
      window.dispatchEvent(
        new CustomEvent("auth-changed", {
          detail: { isAuthenticated: true },
        })
      );
    } catch {
      error.value = "Failed to set up credentials";
    }
  };

  const login = async () => {
    error.value = "";

    if (!username.value.trim() || !password.value) {
      error.value = "Username and password are required";
      return;
    }

    try {
      const storedCredentials = localStorage.getItem("app-credentials");
      if (!storedCredentials) {
        error.value = "No credentials found";
        return;
      }

      const credentials: Credentials = JSON.parse(storedCredentials);
      const hashedPassword = await hashPassword(password.value);

      if (
        credentials.username === username.value.trim() &&
        credentials.password === hashedPassword
      ) {
        authStore.isAuthenticated = true;
      } else {
        error.value = "Invalid username or password";
      }
    } catch {
      error.value = "Login failed";
    }
  };

  const logout = $(() => {
    authStore.isAuthenticated = false;
    username.value = "";
    password.value = "";
    confirmPassword.value = "";
    error.value = "";
  });

  if (authStore.isLoading) {
    return (
      <div class="auth-container">
        <div class="auth-card">
          <h2>Loading...</h2>
        </div>
      </div>
    );
  }

  if (authStore.isAuthenticated) {
    return (
      <div class="auth-container">
        <div class="auth-card">
          <h2>Welcome back!</h2>
          <p>You are successfully logged in.</p>
          <button type="button" onClick$={logout} class="btn btn-destructive">
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
          onSubmit$={authStore.isFirstTime ? setupCredentials : login}
        >
          <div class="form-group">
            <label for="username">Username</label>
            <input
              id="username"
              type="text"
              bind:value={username}
              placeholder="Enter username"
              required
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
              minLength={6}
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
                minLength={6}
              />
            </div>
          )}

          {error.value && <div class="error-message">{error.value}</div>}

          <button type="submit" class="btn btn-primary btn-full btn-lg">
            {authStore.isFirstTime ? "Create Account" : "Login"}
          </button>
        </form>

        {!authStore.isFirstTime && (
          <div class="reset-section">
            <hr />
            <p class="reset-text">Need to reset your credentials?</p>
            <button
              type="button"
              onClick$={() => {
                if (
                  confirm(
                    "Are you sure? This will delete your current credentials and you'll need to set up new ones."
                  )
                ) {
                  localStorage.removeItem("app-credentials");
                  authStore.isFirstTime = true;
                  username.value = "";
                  password.value = "";
                  error.value = "";
                }
              }}
              class="btn btn-destructive btn-sm"
            >
              Reset Credentials
            </button>
          </div>
        )}
      </div>
    </div>
  );
});
