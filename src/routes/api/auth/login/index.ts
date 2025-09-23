import type { RequestHandler } from "@builder.io/qwik-city";
import {
  AdminAuthService,
  ADMIN_COOKIE_NAME,
  COOKIE_OPTIONS,
} from "~/lib/auth";

export const onPost: RequestHandler = async ({ request, json, cookie }) => {
  console.log("Login endpoint called!"); // Debug: Entry point

  try {
    const { username, password } = await request.json();
    console.log("Login attempt:", {
      username,
      passwordLength: password?.length,
    }); // Debug: Request data

    if (!username || !password) {
      console.log("Missing credentials"); // Debug
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
    console.log("Credential verification result:", isValid); // Debug

    if (!isValid) {
      console.log("Invalid credentials"); // Debug
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

    console.log("Login endpoint - Setting cookie:", {
      cookieName: ADMIN_COOKIE_NAME,
      tokenPreview: token.substring(0, 20) + "...",
      cookieOptions: COOKIE_OPTIONS,
    });

    // Set secure HTTP-only cookie
    cookie.set(ADMIN_COOKIE_NAME, token, COOKIE_OPTIONS);
    console.log("Cookie set successfully"); // Debug

    json(200, {
      success: true,
      message: "Admin login successful",
      user: AdminAuthService.getAdminUser(),
    });
  } catch (error) {
    console.error("Admin login error:", error);
    json(500, {
      success: false,
      message: "Login failed",
    });
  }
};
