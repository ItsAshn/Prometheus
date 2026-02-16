import type { RequestHandler } from "@builder.io/qwik-city";
import {
  AdminAuthService,
  ADMIN_COOKIE_NAME,
  COOKIE_OPTIONS,
} from "~/lib/auth";
import {
  rateLimiters,
  getClientIP,
  createRateLimitHeaders,
} from "~/lib/rate-limiter";
import { ErrorMessages, logError, createErrorResponse } from "~/lib/errors";

export const onPost: RequestHandler = async ({
  request,
  json,
  cookie,
  headers,
}) => {
  let username: string | undefined;

  try {
    // Apply rate limiting for login attempts
    const clientIP = getClientIP(headers);
    const rateLimitHeaders = createRateLimitHeaders(
      rateLimiters.login,
      clientIP,
    );

    if (!rateLimiters.login.check(clientIP)) {
      // Set rate limit headers
      Object.entries(rateLimitHeaders).forEach(([key, value]) => {
        headers.set(key, value);
      });

      json(429, createErrorResponse(ErrorMessages.AUTH.RATE_LIMIT));
      return;
    }

    const body = await request.json();
    username = body.username;
    const password = body.password;

    if (!username || !password) {
      json(
        400,
        createErrorResponse(
          ErrorMessages.VALIDATION.MISSING_FIELD("Username and password"),
        ),
      );
      return;
    }

    // Verify admin credentials
    const isValid = await AdminAuthService.verifyAdminCredentials(
      username.trim(),
      password,
    );

    if (!isValid) {
      json(401, createErrorResponse(ErrorMessages.AUTH.INVALID_CREDENTIALS));
      return;
    }

    // Generate JWT token
    const token = AdminAuthService.generateToken({
      username: username.trim(),
      isAdmin: true,
    });

    // Set secure HTTP-only cookie
    cookie.set(ADMIN_COOKIE_NAME, token, COOKIE_OPTIONS);

    json(200, {
      success: true,
      message: "Login successful! Welcome back.",
      user: AdminAuthService.getAdminUser(),
    });
    return;
  } catch (error) {
    logError("Admin Login", error, {
      username: username?.substring(0, 3) + "***",
    });
    json(
      500,
      createErrorResponse(
        "Login failed due to a server error. Please try again.",
      ),
    );
    return;
  }
};
