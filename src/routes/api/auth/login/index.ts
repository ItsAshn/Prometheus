import type { RequestHandler } from "@builder.io/qwik-city";
import {
  AdminAuthService,
  ADMIN_COOKIE_NAME,
  COOKIE_OPTIONS,
} from "~/lib/auth";

export const onPost: RequestHandler = async ({ request, json, cookie }) => {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      json(400, {
        success: false,
        message: "Username and password are required",
      });
      return;
    }

    // Verify admin credentials
    const isValid = await AdminAuthService.verifyAdminCredentials(
      username.trim(),
      password
    );

    if (!isValid) {
      json(401, {
        success: false,
        message: "Invalid admin credentials",
      });
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
      message: "Admin login successful",
      user: AdminAuthService.getAdminUser(),
    });
    return;
  } catch (error) {
    console.error("Admin login error:", error);
    json(500, {
      success: false,
      message: "Login failed",
    });
    return;
  }
};
