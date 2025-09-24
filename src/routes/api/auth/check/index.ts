import type { RequestHandler } from "@builder.io/qwik-city";
import { AdminAuthService, ADMIN_COOKIE_NAME } from "~/lib/auth";

export const onGet: RequestHandler = async ({ cookie, json }) => {
  try {
    const adminToken = cookie.get(ADMIN_COOKIE_NAME);

    if (!adminToken) {
      json(401, {
        success: false,
        message: "No authentication token found",
        authenticated: false,
      });
      return;
    }

    const tokenPayload = AdminAuthService.verifyToken(adminToken.value);

    if (!tokenPayload) {
      json(401, {
        success: false,
        message: "Invalid or expired token",
        authenticated: false,
      });
      return;
    }

    json(200, {
      success: true,
      message: "Authenticated",
      authenticated: true,
      user: {
        username: tokenPayload.username,
        isAdmin: tokenPayload.isAdmin,
      },
    });
  } catch (error) {
    console.error("Auth check error:", error);
    json(500, {
      success: false,
      message: "Authentication check failed",
      authenticated: false,
    });
  }
};
