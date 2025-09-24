import { server$ } from "@builder.io/qwik-city";

/**
 * Reusable server function to check admin auth status without network calls
 */
export const checkAdminAuthServer = server$(async function () {
  try {
    // Import the auth service directly instead of making HTTP requests
    const { AdminAuthService, ADMIN_COOKIE_NAME } = await import("~/lib/auth");

    const token = this.cookie.get(ADMIN_COOKIE_NAME)?.value;
    console.log("Auth check - Cookie check:", {
      cookieName: ADMIN_COOKIE_NAME,
      hasToken: !!token,
      tokenPreview: token ? token.substring(0, 20) + "..." : "none",
    });

    if (!token) {
      return {
        isAuthenticated: false,
        user: null,
      };
    }

    const payload = AdminAuthService.verifyToken(token);
    console.log("Auth check - Token payload:", payload);

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
 * Reusable server function for admin login without network calls
 */
export const loginAdminServer = server$(async function (
  username: string,
  password: string
) {
  console.log("Login server function called with:", {
    username,
    passwordLength: password?.length,
  });

  try {
    // Import the auth service directly instead of making HTTP requests
    const { AdminAuthService, ADMIN_COOKIE_NAME, COOKIE_OPTIONS } = await import("~/lib/auth");

    if (!username || !password) {
      console.log("Missing credentials");
      return {
        success: false,
        data: { message: "Username and password are required" }
      };
    }

    // Verify admin credentials directly
    const isValid = await AdminAuthService.verifyAdminCredentials(
      username.trim(),
      password
    );
    console.log("Credential verification result:", isValid);

    if (!isValid) {
      console.log("Invalid credentials");
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

    console.log("Login - Setting cookie:", {
      cookieName: ADMIN_COOKIE_NAME,
      tokenPreview: token.substring(0, 20) + "...",
      cookieOptions: COOKIE_OPTIONS,
    });

    // Set secure HTTP-only cookie directly
    this.cookie.set(ADMIN_COOKIE_NAME, token, COOKIE_OPTIONS);
    console.log("Cookie set successfully");

    return {
      success: true,
      data: {
        message: "Admin login successful",
        user: AdminAuthService.getAdminUser(),
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

    // Clear the auth cookie (logout) with all possible options
    this.cookie.delete(ADMIN_COOKIE_NAME, { path: "/" });

    // Also try to clear with different path options as a fallback
    this.cookie.delete(ADMIN_COOKIE_NAME, { path: "" });
    this.cookie.delete(ADMIN_COOKIE_NAME, {});

    // Set an expired cookie as an additional measure
    this.cookie.set(ADMIN_COOKIE_NAME, "", {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: -1,
      expires: new Date(0),
      path: "/",
    });

    return true;
  } catch (error) {
    console.error("Logout server function error:", error);
    return false;
  }
});