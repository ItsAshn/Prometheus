import type { RequestHandler } from "@builder.io/qwik-city";
import { AdminAuthService, ADMIN_COOKIE_NAME } from "~/lib/auth";

export const onGet: RequestHandler = async ({ cookie, json }) => {
  try {
    const token = cookie.get(ADMIN_COOKIE_NAME)?.value;
    console.log("Verify endpoint - Cookie check:", {
      cookieName: ADMIN_COOKIE_NAME,
      hasToken: !!token,
      tokenPreview: token ? token.substring(0, 20) + "..." : "none",
    });

    if (!token) {
      json(401, {
        success: false,
        message: "Not authenticated",
      });
      return;
    }

    const payload = AdminAuthService.verifyToken(token);
    console.log("Verify endpoint - Token payload:", payload);

    if (!payload || !payload.isAdmin) {
      // Invalid token, clear the cookie
      cookie.delete(ADMIN_COOKIE_NAME, { path: "/" });
      json(401, {
        success: false,
        message: "Invalid token",
      });
      return;
    }

    json(200, {
      success: true,
      user: AdminAuthService.getAdminUser(),
    });
  } catch (error) {
    console.error("Verify error:", error);
    json(500, {
      success: false,
      message: "Verification failed",
    });
  }
};

export const onPost: RequestHandler = async ({ cookie, json }) => {
  try {
    // Clear the auth cookie (logout) with all possible options
    cookie.delete(ADMIN_COOKIE_NAME, { path: "/" });

    // Also try to clear with different path options as a fallback
    cookie.delete(ADMIN_COOKIE_NAME, { path: "" });
    cookie.delete(ADMIN_COOKIE_NAME, {});

    // Set an expired cookie as an additional measure
    cookie.set(ADMIN_COOKIE_NAME, "", {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: -1,
      expires: new Date(0),
      path: "/",
    });

    json(200, {
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    json(500, {
      success: false,
      message: "Logout failed",
    });
  }
};
