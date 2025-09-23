import type { RequestHandler } from "@builder.io/qwik-city";
import { AdminAuthService, ADMIN_COOKIE_NAME } from "~/lib/auth";

export const onGet: RequestHandler = async ({ json, cookie }) => {
  try {
    const authCookie = cookie.get(ADMIN_COOKIE_NAME);

    console.log("Auth test: Cookie check", {
      cookieName: ADMIN_COOKIE_NAME,
      hasCookie: !!authCookie?.value,
      cookieValue: authCookie?.value || "none",
      allCookies: Object.fromEntries(
        Object.entries(cookie.getAll()).map(([k, v]) => [k, v.value])
      ),
    });

    if (!authCookie?.value) {
      json(401, {
        success: false,
        message: "No auth cookie found",
        debug: {
          expectedCookie: ADMIN_COOKIE_NAME,
          availableCookies: Object.keys(cookie.getAll()),
        },
      });
      return;
    }

    const payload = AdminAuthService.verifyToken(authCookie.value);

    // Manual JWT decode for debugging
    try {
      const parts = authCookie.value.split(".");
      const header = JSON.parse(Buffer.from(parts[0], "base64url").toString());
      const payloadRaw = JSON.parse(
        Buffer.from(parts[1], "base64url").toString()
      );

      console.log("Manual JWT decode:", {
        header,
        payload: payloadRaw,
        currentTime: Math.floor(Date.now() / 1000),
        isExpired: payloadRaw.exp < Math.floor(Date.now() / 1000),
      });
    } catch (decodeError) {
      console.log("Manual JWT decode failed:", decodeError);
    }

    console.log("Auth test: Token verification", {
      isValid: !!payload,
      payload: payload,
      tokenLength: authCookie.value.length,
    });

    if (!payload) {
      json(401, {
        success: false,
        message: "Invalid or expired token",
        debug: {
          tokenPreview: authCookie.value.substring(0, 50) + "...",
        },
      });
      return;
    }

    json(200, {
      success: true,
      message: "Authentication successful",
      user: payload,
    });
  } catch (error) {
    console.error("Auth test error:", error);
    json(500, {
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
