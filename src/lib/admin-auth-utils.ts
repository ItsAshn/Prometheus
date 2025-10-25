import { server$ } from "@builder.io/qwik-city";

/**
 * Check if initial setup is required
 */
export const checkSetupStatusServer = server$(async function () {
  try {
    const { isSetupComplete } = await import("~/lib/initial-setup");
    const setupComplete = await isSetupComplete();
    
    return {
      setupComplete,
      needsSetup: !setupComplete,
    };
  } catch (error) {
    console.error("Setup check error:", error);
    return {
      setupComplete: false,
      needsSetup: true,
    };
  }
});

/**
 * Reusable server function to check admin auth status without network calls
 */
export const checkAdminAuthServer = server$(async function () {
  try {
    // Import the auth service directly instead of making HTTP requests
    const { AdminAuthService, ADMIN_COOKIE_NAME } = await import("~/lib/auth");

    const token = this.cookie.get(ADMIN_COOKIE_NAME)?.value;

    if (!token) {
      return {
        isAuthenticated: false,
        user: null,
      };
    }

    const payload = AdminAuthService.verifyToken(token);

    if (!payload || !payload.isAdmin) {
      // Invalid token, clear the cookie
      this.cookie.delete(ADMIN_COOKIE_NAME, { path: "/" });
      return {
        isAuthenticated: false,
        user: null,
      };
    }

    return {
      isAuthenticated: true,
      user: AdminAuthService.getAdminUser(),
    };
  } catch (error) {
    console.error("Auth check error:", error);
    return {
      isAuthenticated: false,
      user: null,
    };
  }
});

/**
 * Perform initial setup with first-time credentials
 */
export const performInitialSetupServer = server$(async function (
  username: string,
  password: string
) {
  try {
    const { isSetupComplete, saveInitialCredentials, verifyStoredCredentials } = await import("~/lib/initial-setup");
    const { AdminAuthService, ADMIN_COOKIE_NAME, COOKIE_OPTIONS } = await import("~/lib/auth");

    // Check if setup is already complete
    const setupComplete = await isSetupComplete();
    if (setupComplete) {
      return {
        success: false,
        data: { message: "Setup already completed" }
      };
    }

    if (!username || !password) {
      return {
        success: false,
        data: { message: "Username and password are required" }
      };
    }

    // Save the initial credentials
    await saveInitialCredentials(username.trim(), password);

    // Verify the saved credentials work
    const isValid = await verifyStoredCredentials(username.trim(), password);
    
    if (!isValid) {
      return {
        success: false,
        data: { message: "Failed to verify saved credentials" }
      };
    }

    // Generate JWT token
    const token = AdminAuthService.generateToken({
      username: username.trim(),
      isAdmin: true,
    });

    // Set secure HTTP-only cookie
    this.cookie.set(ADMIN_COOKIE_NAME, token, COOKIE_OPTIONS);

    return {
      success: true,
      data: {
        message: "Initial setup completed successfully",
        user: { username: username.trim(), isAdmin: true },
      }
    };
  } catch (error) {
    console.error("Initial setup error:", error);
    const message = error instanceof Error ? error.message : "Setup failed";
    return { 
      success: false, 
      data: { message } 
    };
  }
});

/**
 * Reusable server function for admin login without network calls
 */
export const loginAdminServer = server$(async function (
  username: string,
  password: string
) {
  try {
    // Import the auth service directly instead of making HTTP requests
    const { verifyStoredCredentials } = await import("~/lib/initial-setup");
    const { AdminAuthService, ADMIN_COOKIE_NAME, COOKIE_OPTIONS } = await import("~/lib/auth");

    if (!username || !password) {
      return {
        success: false,
        data: { message: "Username and password are required" }
      };
    }

    // Verify admin credentials using stored credentials
    const isValid = await verifyStoredCredentials(username.trim(), password);

    if (!isValid) {
      return {
        success: false,
        data: { message: "Invalid admin credentials" }
      };
    }

    // Generate JWT token directly
    const token = AdminAuthService.generateToken({
      username: username.trim(),
      isAdmin: true,
    });

    // Set secure HTTP-only cookie directly
    this.cookie.set(ADMIN_COOKIE_NAME, token, COOKIE_OPTIONS);

    return {
      success: true,
      data: {
        message: "Admin login successful",
        user: { username: username.trim(), isAdmin: true },
      }
    };
  } catch (error) {
    console.error("Login server function error:", error);
    return { success: false, data: { message: "Login failed" } };
  }
});

/**
 * Reusable server function for admin logout without network calls
 */
export const logoutAdminServer = server$(async function () {
  try {
    // Import the auth service directly
    const { ADMIN_COOKIE_NAME } = await import("~/lib/auth");

    // Clear the auth cookie
    this.cookie.delete(ADMIN_COOKIE_NAME, { path: "/" });

    return true;
  } catch (error) {
    console.error("Logout server function error:", error);
    return false;
  }
});