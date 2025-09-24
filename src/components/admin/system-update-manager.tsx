import { component$, useSignal, useStore, useTask$, $ } from "@builder.io/qwik";
import { server$ } from "@builder.io/qwik-city";

interface SystemStatus {
  gitStatus: {
    currentBranch: string;
    hasChanges: boolean;
    remoteUrl: string;
    lastCommit: string;
  };
  updatesAvailable: boolean;
  updateInfo: string;
  isDocker: boolean;
  containerName: string;
  currentTime: string;
}

interface SystemUpdateStore {
  isLoading: boolean;
  isUpdating: boolean;
  status: SystemStatus | null;
  error: string;
  successMessage: string;
  updateOutput: string;
}

export const SystemUpdateManager = component$(() => {
  const store = useStore<SystemUpdateStore>({
    isLoading: true,
    isUpdating: false,
    status: null,
    error: "",
    successMessage: "",
    updateOutput: "",
  });

  const showOutput = useSignal(false);

  // Server function to get system status
  const getSystemStatus = server$(async function () {
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
        const result = await response.json();
        return { success: true, data: result.data };
      }

      const error = await response.json();
      return {
        success: false,
        error: error.message || "Failed to get system status",
      };
    } catch (error) {
      console.error("Error getting system status:", error);
      return { success: false, error: "Network error" };
    }
  });

  // Server function to perform system update
  const performSystemUpdate = server$(async function (
    action: "update" | "restart"
  ) {
    try {
      const response = await fetch(
        `${this.url.origin}/api/admin/system-update`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: this.request.headers.get("cookie") || "",
          },
          body: JSON.stringify({ action }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        return { success: true, data: result };
      }

      const error = await response.json();
      return {
        success: false,
        error: error.error || "Failed to perform system update",
      };
    } catch (error) {
      console.error("Error performing system update:", error);
      return { success: false, error: "Network error" };
    }
  });

  // Load system status on component mount
  useTask$(async () => {
    const result = await getSystemStatus();
    if (result.success && result.data) {
      store.status = result.data;
    } else {
      store.error = result.error || "Failed to load system status";
    }
    store.isLoading = false;
  });

  const handleUpdate = $(async () => {
    store.error = "";
    store.successMessage = "";
    store.updateOutput = "";
    store.isUpdating = true;

    try {
      const result = await performSystemUpdate("update");

      if (result.success) {
        store.successMessage = result.data.message;
        store.updateOutput = result.data.output || "";
        showOutput.value = true;

        if (result.data.requiresRestart) {
          // Show a message that the container is restarting
          setTimeout(() => {
            window.location.reload();
          }, 5000);
        }

        // Refresh status after update
        setTimeout(async () => {
          const statusResult = await getSystemStatus();
          if (statusResult.success) {
            store.status = statusResult.data;
          }
        }, 2000);
      } else {
        store.error = result.error || "Failed to perform update";
      }
    } catch {
      store.error = "Failed to perform update";
    } finally {
      store.isUpdating = false;
    }
  });

  const handleRestart = $(async () => {
    store.error = "";
    store.successMessage = "";
    store.updateOutput = "";
    store.isUpdating = true;

    try {
      const result = await performSystemUpdate("restart");

      if (result.success) {
        store.successMessage = result.data.message;
        store.updateOutput = result.data.output || "";
        showOutput.value = true;

        if (result.data.requiresRestart) {
          // Show a message that the container is restarting
          setTimeout(() => {
            window.location.reload();
          }, 5000);
        }
      } else {
        store.error = result.error || "Failed to restart container";
      }
    } catch {
      store.error = "Failed to restart container";
    } finally {
      store.isUpdating = false;
    }
  });

  const handleRefreshStatus = $(async () => {
    store.isLoading = true;
    store.error = "";

    const result = await getSystemStatus();
    if (result.success && result.data) {
      store.status = result.data;
    } else {
      store.error = result.error || "Failed to refresh system status";
    }
    store.isLoading = false;
  });

  const clearMessages = $(() => {
    store.error = "";
    store.successMessage = "";
    store.updateOutput = "";
    showOutput.value = false;
  });

  if (store.isLoading) {
    return (
      <div class="admin-card">
        <div class="loading-spinner"></div>
        <h3>Loading System Status...</h3>
      </div>
    );
  }

  return (
    <div class="system-update-manager">
      <div class="admin-card">
        <h3>🔄 System Updates</h3>
        <p>
          Pull the latest version from Git and restart your Docker container.
        </p>

        {store.error && (
          <div class="error-message">
            {store.error}
            <button type="button" onClick$={clearMessages} class="close-btn">
              ×
            </button>
          </div>
        )}

        {store.successMessage && (
          <div class="success-message">
            {store.successMessage}
            <button type="button" onClick$={clearMessages} class="close-btn">
              ×
            </button>
          </div>
        )}

        {showOutput.value && store.updateOutput && (
          <div class="update-output">
            <h4>Update Output:</h4>
            <pre>{store.updateOutput}</pre>
          </div>
        )}

        {store.status && (
          <div class="system-status">
            <h4>📊 Current System Status</h4>
            <div class="status-grid">
              <div class="status-item">
                <strong>Git Branch:</strong>{" "}
                {store.status.gitStatus.currentBranch}
              </div>
              <div class="status-item">
                <strong>Last Commit:</strong>{" "}
                {store.status.gitStatus.lastCommit}
              </div>
              <div class="status-item">
                <strong>Has Local Changes:</strong>{" "}
                <span
                  class={
                    store.status.gitStatus.hasChanges
                      ? "status-warning"
                      : "status-good"
                  }
                >
                  {store.status.gitStatus.hasChanges ? "Yes" : "No"}
                </span>
              </div>
              <div class="status-item">
                <strong>Environment:</strong>{" "}
                <span
                  class={
                    store.status.isDocker ? "status-good" : "status-warning"
                  }
                >
                  {store.status.isDocker
                    ? "Docker Container"
                    : "Local Development"}
                </span>
              </div>
              <div class="status-item">
                <strong>Container Name:</strong> {store.status.containerName}
              </div>
              <div class="status-item">
                <strong>Updates Available:</strong>{" "}
                <span
                  class={
                    store.status.updatesAvailable
                      ? "status-warning"
                      : "status-good"
                  }
                >
                  {store.status.updatesAvailable ? "Yes" : "No"}
                </span>
              </div>
            </div>

            {store.status.updateInfo && (
              <div class="update-info">
                <h5>Update Information:</h5>
                <pre>{store.status.updateInfo}</pre>
              </div>
            )}
          </div>
        )}

        <div class="update-actions">
          <button
            type="button"
            onClick$={handleRefreshStatus}
            class="refresh-btn"
            disabled={store.isUpdating || store.isLoading}
          >
            🔄 Refresh Status
          </button>

          <button
            type="button"
            onClick$={handleUpdate}
            class="update-btn"
            disabled={store.isUpdating || store.isLoading}
          >
            {store.isUpdating ? "Updating..." : "🚀 Update & Restart"}
          </button>

          {store.status?.isDocker && (
            <button
              type="button"
              onClick$={handleRestart}
              class="restart-btn"
              disabled={store.isUpdating || store.isLoading}
            >
              {store.isUpdating ? "Restarting..." : "🔄 Restart Container"}
            </button>
          )}
        </div>

        <div class="update-warnings">
          <div class="warning-box">
            <h5>⚠️ Important Notes:</h5>
            <ul>
              <li>
                The update process will pull the latest code from the{" "}
                <strong>master</strong> branch
              </li>
              <li>
                If running in Docker, the container will automatically restart
                with the new code
              </li>
              <li>
                Any local changes will be preserved (but may cause conflicts)
              </li>
              <li>The update process may take a few minutes to complete</li>
              <li>
                You will be automatically redirected after the container
                restarts
              </li>
            </ul>
          </div>

          {!store.status?.isDocker && (
            <div class="info-box">
              <h5>ℹ️ Development Mode:</h5>
              <p>
                You're running in development mode. Updates will pull the latest
                code, but you'll need to restart the application manually.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
