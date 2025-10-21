import { component$, useSignal, useStore, useTask$, $ } from "@builder.io/qwik";
import { server$ } from "@builder.io/qwik-city";
import "./system-update-manager.css";

interface UpdateInfo {
  updateAvailable: boolean;
  current: {
    version: string;
    buildDate: string | null;
    vcsRef: string | null;
  };
  latest?: {
    tag: string;
    lastUpdated: string;
    digest: string;
  };
  imageName: string;
  instructions: string | null;
  message?: string;
}

interface UpdateStore {
  isLoading: boolean;
  isChecking: boolean;
  updateInfo: UpdateInfo | null;
  error: string;
  successMessage: string;
}

export const SystemUpdateManager = component$(() => {
  const store = useStore<UpdateStore>({
    isLoading: true,
    isChecking: false,
    updateInfo: null,
    error: "",
    successMessage: "",
  });

  const showInstructions = useSignal(false);

  // Server function to check for updates
  const checkForUpdates = server$(async function () {
    try {
      const response = await fetch(
        `${this.url.origin}/api/admin/system-update`,
        {
          headers: {
            Cookie: this.request.headers.get("cookie") || "",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        return { success: true, data };
      } else {
        const error = await response.json();
        return {
          success: false,
          error: error.message || "Failed to check for updates",
        };
      }
    } catch (error) {
      console.error("Failed to check for updates:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  });

  // Load update info on component mount
  useTask$(async () => {
    store.isLoading = true;
    store.error = "";

    const result = await checkForUpdates();

    if (result.success) {
      store.updateInfo = result.data;
    } else {
      store.error = result.error || "Failed to load update information";
    }

    store.isLoading = false;
  });

  // Check for updates
  const handleCheckUpdates = $(async () => {
    store.isChecking = true;
    store.error = "";
    store.successMessage = "";

    const result = await checkForUpdates();

    if (result.success) {
      store.updateInfo = result.data;
      store.successMessage = "Update check completed";
    } else {
      store.error = result.error || "Failed to check for updates";
    }

    store.isChecking = false;
  });

  // Show update instructions
  const handleShowInstructions = $(async () => {
    showInstructions.value = !showInstructions.value;
  });

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  // Copy command to clipboard
  const copyCommand = $(async (command: string) => {
    try {
      await navigator.clipboard.writeText(command);
      store.successMessage = "Command copied to clipboard!";
      setTimeout(() => {
        store.successMessage = "";
      }, 3000);
    } catch {
      store.error = "Failed to copy to clipboard";
    }
  });

  return (
    <div class="system-update-manager">
      <div class="update-header">
        <h2>System Updates</h2>
        <p class="update-subtitle">
          Check and manage container updates for Prometheus
        </p>
      </div>

      {store.error && (
        <div class="alert alert-error" role="alert">
          <span class="alert-icon">⚠️</span>
          <span>{store.error}</span>
        </div>
      )}

      {store.successMessage && (
        <div class="alert alert-success" role="alert">
          <span class="alert-icon">✅</span>
          <span>{store.successMessage}</span>
        </div>
      )}

      {store.isLoading ? (
        <div class="loading-container">
          <div class="loading-spinner"></div>
          <p>Loading update information...</p>
        </div>
      ) : store.updateInfo ? (
        <div class="update-content">
          {/* Current Version Section */}
          <div class="update-card">
            <h3>📦 Current Version</h3>
            <div class="version-info">
              <div class="info-row">
                <span class="info-label">Version:</span>
                <span class="info-value">
                  {store.updateInfo.current.version}
                </span>
              </div>
              <div class="info-row">
                <span class="info-label">Build Date:</span>
                <span class="info-value">
                  {formatDate(store.updateInfo.current.buildDate)}
                </span>
              </div>
              <div class="info-row">
                <span class="info-label">Commit:</span>
                <span class="info-value">
                  {store.updateInfo.current.vcsRef || "N/A"}
                </span>
              </div>
              <div class="info-row">
                <span class="info-label">Image:</span>
                <span class="info-value">{store.updateInfo.imageName}</span>
              </div>
            </div>
          </div>

          {/* Update Status Section */}
          <div
            class={`update-card ${
              store.updateInfo.updateAvailable
                ? "update-available"
                : "up-to-date"
            }`}
          >
            <h3>
              {store.updateInfo.updateAvailable
                ? "🔄 Update Available"
                : "✅ Up to Date"}
            </h3>

            {store.updateInfo.updateAvailable && store.updateInfo.latest ? (
              <div class="version-info">
                <p class="update-message">
                  A new version is available on Docker Hub!
                </p>
                <div class="info-row">
                  <span class="info-label">Latest Tag:</span>
                  <span class="info-value">{store.updateInfo.latest.tag}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Published:</span>
                  <span class="info-value">
                    {formatDate(store.updateInfo.latest.lastUpdated)}
                  </span>
                </div>
                <div class="info-row">
                  <span class="info-label">Digest:</span>
                  <span class="info-value digest">
                    {store.updateInfo.latest.digest.substring(0, 20)}...
                  </span>
                </div>
              </div>
            ) : (
              <p class="update-message">
                {store.updateInfo.message ||
                  "You are running the latest version."}
              </p>
            )}
          </div>

          {/* Actions Section */}
          <div class="update-actions">
            <button
              class="btn btn-secondary"
              onClick$={handleCheckUpdates}
              disabled={store.isChecking}
            >
              {store.isChecking ? "Checking..." : "🔍 Check for Updates"}
            </button>

            {store.updateInfo.updateAvailable && (
              <button class="btn btn-primary" onClick$={handleShowInstructions}>
                {showInstructions.value
                  ? "Hide Instructions"
                  : "📋 Show Update Instructions"}
              </button>
            )}
          </div>

          {/* Update Instructions */}
          {showInstructions.value && store.updateInfo.updateAvailable && (
            <div class="update-instructions">
              <h3>📋 Update Instructions</h3>
              <p class="instructions-intro">
                To update your Prometheus container, run the following commands
                on your Docker host machine:
              </p>

              <div class="command-section">
                <h4>Option 1: Using Docker Compose</h4>
                <div class="command-group">
                  <div class="command-item">
                    <span class="command-number">1.</span>
                    <div class="command-content">
                      <p class="command-description">Pull the latest image:</p>
                      <div class="command-box">
                        <code>docker-compose pull</code>
                        <button
                          class="btn-copy"
                          onClick$={() => copyCommand("docker-compose pull")}
                          title="Copy to clipboard"
                        >
                          📋
                        </button>
                      </div>
                    </div>
                  </div>

                  <div class="command-item">
                    <span class="command-number">2.</span>
                    <div class="command-content">
                      <p class="command-description">
                        Restart with the new image:
                      </p>
                      <div class="command-box">
                        <code>docker-compose up -d</code>
                        <button
                          class="btn-copy"
                          onClick$={() => copyCommand("docker-compose up -d")}
                          title="Copy to clipboard"
                        >
                          📋
                        </button>
                      </div>
                    </div>
                  </div>

                  <div class="command-item">
                    <span class="command-number">3.</span>
                    <div class="command-content">
                      <p class="command-description">Check the logs:</p>
                      <div class="command-box">
                        <code>docker-compose logs -f prometheus</code>
                        <button
                          class="btn-copy"
                          onClick$={() =>
                            copyCommand("docker-compose logs -f prometheus")
                          }
                          title="Copy to clipboard"
                        >
                          📋
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="command-section">
                <h4>Option 2: Using Update Script</h4>
                <p class="command-description">
                  Run the automated update script:
                </p>

                <div class="command-tabs">
                  <div class="tab-content">
                    <p class="tab-label">Linux/macOS:</p>
                    <div class="command-box">
                      <code>./scripts/update-docker.sh</code>
                      <button
                        class="btn-copy"
                        onClick$={() =>
                          copyCommand("./scripts/update-docker.sh")
                        }
                        title="Copy to clipboard"
                      >
                        📋
                      </button>
                    </div>
                  </div>

                  <div class="tab-content">
                    <p class="tab-label">Windows (PowerShell):</p>
                    <div class="command-box">
                      <code>.\scripts\update-docker.ps1</code>
                      <button
                        class="btn-copy"
                        onClick$={() =>
                          copyCommand(".\\scripts\\update-docker.ps1")
                        }
                        title="Copy to clipboard"
                      >
                        📋
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div class="warning-box">
                <span class="warning-icon">⚠️</span>
                <div class="warning-content">
                  <strong>Important:</strong>
                  <ul>
                    <li>
                      These commands must be run on the Docker host machine, not
                      inside the container
                    </li>
                    <li>
                      The container will restart during the update process
                    </li>
                    <li>
                      Your data volumes will be preserved during the update
                    </li>
                    <li>Always backup important data before updating</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
});
