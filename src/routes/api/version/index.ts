import type { RequestHandler } from "@builder.io/qwik-city";

// Helper function to get GitHub repository info
function getGitHubInfo() {
  const owner = process.env.GITHUB_OWNER || "ItsAshn";
  const repo = process.env.GITHUB_REPO || "Prometheus";
  return { owner, repo };
}

// Get current version from environment or GitHub
export const onGet: RequestHandler = async ({ json }) => {
  try {
    // First check if APP_VERSION is set in environment
    let version = process.env.APP_VERSION || "v1.0.0";
    let source = "environment";

    // Try to fetch the latest release from GitHub
    try {
      const { owner, repo } = getGitHubInfo();
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/releases/latest`,
        {
          headers: {
            "User-Agent": "Prometheus-App",
            Accept: "application/vnd.github.v3+json",
          },
        }
      );

      if (response.ok) {
        const release = await response.json();
        version = release.tag_name;
        source = "github_release";
      }
    } catch (error) {
      // If GitHub fetch fails, fall back to environment version
      console.warn(
        "Could not fetch GitHub release, using environment version:",
        error
      );
    }

    json(200, {
      version,
      source,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Version API error:", error);
    json(500, {
      version: "v1.0.0",
      source: "fallback",
      error: error.message,
    });
  }
};
