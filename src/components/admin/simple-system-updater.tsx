import { component$, useSignal, $, useVisibleTask$ } from "@builder.io/qwik";
import { server$ } from "@builder.io/qwik-city";

// Check for updates
const checkForUpdates = server$(async function () {
  try {
    const response = await fetch(
      `${this.url.origin}/api/admin/system-update?action=check`,
      {
        method: "GET",
        headers: {
          Cookie: this.cookie.get("admin-auth-token")?.value
            ? `admin-auth-token=${this.cookie.get("admin-auth-token")?.value}`
            : "",
        },
      }
    );

    return await response.json();
  } catch (error) {
    console.error("Check updates error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
});

// Simple GET-based update functions
const performSimpleUpdate = server$(async function () {
  try {
    const response = await fetch(
      `${this.url.origin}/api/admin/system-update?action=update`,
      {
        method: "GET",
        headers: {
          Cookie: this.cookie.get("admin-auth-token")?.value
            ? `admin-auth-token=${this.cookie.get("admin-auth-token")?.value}`
            : "",
        },
      }
    );

    return await response.json();
  } catch (error) {
    console.error("Simple update error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
});

const performSimpleRestart = server$(async function () {
  try {
    const response = await fetch(
      `${this.url.origin}/api/admin/system-update?action=restart`,
      {
        method: "GET",
        headers: {
          Cookie: this.cookie.get("admin-auth-token")?.value
            ? `admin-auth-token=${this.cookie.get("admin-auth-token")?.value}`
            : "",
        },
      }
    );

    return await response.json();
  } catch (error) {
    console.error("Simple restart error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
});

export const SimpleSystemUpdater = component$(() => {
  const isUpdating = useSignal(false);
  const isCheckingUpdates = useSignal(false);
  const updateMessage = useSignal("");
  const updateStatus = useSignal<"idle" | "success" | "error">("idle");
  const currentVersion = useSignal("");
  const latestVersion = useSignal("");
  const updateAvailable = useSignal(false);
  const releaseNotes = useSignal("");

  // Check for updates on component mount
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(async () => {
    await handleCheckUpdates();
  });

  const handleCheckUpdates = $(async () => {
    isCheckingUpdates.value = true;
    try {
      const result = await checkForUpdates();

      if (result.success) {
        currentVersion.value = result.currentVersion || "Unknown";
        latestVersion.value = result.latestVersion || "Unknown";
        updateAvailable.value = result.updateAvailable || false;
        releaseNotes.value = result.releaseNotes || "";
      }
    } catch (error) {
      console.error("Failed to check for updates:", error);
    } finally {
      isCheckingUpdates.value = false;
    }
  });

  const handleUpdate = $(async () => {
    isUpdating.value = true;
    updateMessage.value = "";
    updateStatus.value = "idle";

    try {
      const result = await performSimpleUpdate();

      if (result.success) {
        updateStatus.value = "success";
        updateMessage.value =
          result.message || "Update completed successfully!";

        if (result.details) {
          updateMessage.value += "\n\n" + result.details;
        }

        if (result.restarting) {
          setTimeout(() => {
            updateMessage.value +=
              "\n\n⏳ Container is restarting... Please refresh in a moment.";
          }, 1000);
        }
      } else {
        updateStatus.value = "error";
        updateMessage.value = result.error || "Update failed";
      }
    } catch (error) {
      updateStatus.value = "error";
      updateMessage.value =
        error instanceof Error ? error.message : String(error);
    } finally {
      isUpdating.value = false;
    }
  });

  const handleRestart = $(async () => {
    isUpdating.value = true;
    updateMessage.value = "";
    updateStatus.value = "idle";

    try {
      const result = await performSimpleRestart();

      if (result.success) {
        updateStatus.value = "success";
        updateMessage.value =
          result.message || "Restart completed successfully!";

        setTimeout(() => {
          updateMessage.value +=
            "\n\nContainer is restarting... Please refresh in a moment.";
        }, 1000);
      } else {
        updateStatus.value = "error";
        updateMessage.value = result.error || "Restart failed";
      }
    } catch (error) {
      updateStatus.value = "error";
      updateMessage.value =
        error instanceof Error ? error.message : String(error);
    } finally {
      isUpdating.value = false;
    }
  });

  return (
    <div class="simple-system-updater">
      <h3>🚀 System Updates</h3>
      <p class="description">Manage system updates from GitHub releases.</p>

      {/* Version Information */}
      <div class="version-info">
        <div class="version-item">
          <span class="version-label">Current Version:</span>
          <span class="version-value">
            {isCheckingUpdates.value
              ? "Checking..."
              : currentVersion.value || "Unknown"}
          </span>
        </div>
        <div class="version-item">
          <span class="version-label">Latest Version:</span>
          <span class="version-value">
            {isCheckingUpdates.value
              ? "Checking..."
              : latestVersion.value || "Unknown"}
          </span>
        </div>
        {updateAvailable.value && (
          <div class="update-badge">✨ Update Available!</div>
        )}
        {!updateAvailable.value &&
          !isCheckingUpdates.value &&
          currentVersion.value && (
            <div class="uptodate-badge">✅ Up to date</div>
          )}
      </div>

      {/* Release Notes */}
      {releaseNotes.value && updateAvailable.value && (
        <div class="release-notes">
          <h4>📝 Release Notes:</h4>
          <pre>{releaseNotes.value}</pre>
        </div>
      )}

      <div class="update-actions">
        <button
          type="button"
          class={`check-btn ${isCheckingUpdates.value ? "checking" : ""}`}
          onClick$={handleCheckUpdates}
          disabled={isCheckingUpdates.value || isUpdating.value}
        >
          {isCheckingUpdates.value ? "🔄 Checking..." : "🔍 Check for Updates"}
        </button>

        <button
          type="button"
          class={`update-btn ${isUpdating.value ? "updating" : ""} ${!updateAvailable.value ? "disabled" : ""}`}
          onClick$={handleUpdate}
          disabled={isUpdating.value || !updateAvailable.value}
          title={!updateAvailable.value ? "No updates available" : ""}
        >
          {isUpdating.value ? "🔄 Updating..." : "📥 Update from GitHub"}
        </button>

        <button
          type="button"
          class={`restart-btn ${isUpdating.value ? "updating" : ""}`}
          onClick$={handleRestart}
          disabled={isUpdating.value}
        >
          {isUpdating.value ? "🔄 Restarting..." : "🔄 Restart Container"}
        </button>
      </div>

      {updateMessage.value && (
        <div class={`update-result ${updateStatus.value}`}>
          <h4>
            {updateStatus.value === "success"
              ? "✅ Success"
              : updateStatus.value === "error"
                ? "❌ Error"
                : "ℹ️ Status"}
          </h4>
          <pre>{updateMessage.value}</pre>
        </div>
      )}

      <div class="simple-updater-info">
        <h4>ℹ️ How this works:</h4>
        <ul>
          <li>
            ✅ <strong>Check for Updates:</strong> Queries GitHub for the latest
            release
          </li>
          <li>
            ✅ <strong>Update from GitHub:</strong> Downloads the latest
            release, rebuilds the app, and restarts
          </li>
          <li>
            ✅ <strong>Restart Container:</strong> Simply restarts the
            application without updating
          </li>
          <li>
            ✅ <strong>Automatic Version Tracking:</strong> Keeps package.json
            version in sync with releases
          </li>
        </ul>
      </div>

      <style>
        {`
        .simple-system-updater {
          background: var(--background-secondary, #f5f5f5);
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        
        .description {
          color: var(--text-secondary, #666);
          margin-bottom: 20px;
          font-style: italic;
        }

        .version-info {
          background: white;
          border-radius: 6px;
          padding: 15px;
          margin-bottom: 15px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .version-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .version-label {
          font-weight: 500;
          color: var(--text-secondary, #666);
        }

        .version-value {
          font-family: 'Courier New', monospace;
          font-weight: 600;
          color: var(--text-primary, #333);
        }

        .update-badge {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          text-align: center;
          font-weight: 600;
          font-size: 14px;
          animation: pulse 2s infinite;
        }

        .uptodate-badge {
          background: #10b981;
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          text-align: center;
          font-weight: 600;
          font-size: 14px;
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.02);
            opacity: 0.9;
          }
        }

        .release-notes {
          background: white;
          border-radius: 6px;
          padding: 15px;
          margin-bottom: 15px;
          border-left: 4px solid #667eea;
        }

        .release-notes h4 {
          margin: 0 0 10px 0;
          font-size: 14px;
          color: var(--text-primary, #333);
        }

        .release-notes pre {
          margin: 0;
          white-space: pre-wrap;
          word-wrap: break-word;
          font-family: 'Courier New', monospace;
          font-size: 12px;
          line-height: 1.5;
          color: var(--text-secondary, #666);
        }
        
        .update-actions {
          display: flex;
          gap: 15px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        
        .check-btn, .update-btn, .restart-btn {
          padding: 12px 24px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          min-width: 160px;
        }

        .check-btn {
          background: #8b5cf6;
          color: white;
        }

        .check-btn:hover:not(:disabled) {
          background: #7c3aed;
        }
        
        .update-btn {
          background: #2563eb;
          color: white;
        }
        
        .update-btn:hover:not(:disabled) {
          background: #1d4ed8;
        }

        .update-btn.disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }
        
        .restart-btn {
          background: #dc2626;
          color: white;
        }
        
        .restart-btn:hover:not(:disabled) {
          background: #b91c1c;
        }
        
        .check-btn:disabled, .update-btn:disabled, .restart-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .update-result {
          background: white;
          border-radius: 6px;
          padding: 15px;
          margin: 15px 0;
          border-left: 4px solid #ccc;
        }
        
        .update-result.success {
          border-left-color: #10b981;
          background: #f0fdf4;
        }
        
        .update-result.error {
          border-left-color: #ef4444;
          background: #fef2f2;
        }
        
        .update-result h4 {
          margin: 0 0 10px 0;
          font-size: 14px;
        }
        
        .update-result pre {
          margin: 0;
          white-space: pre-wrap;
          word-wrap: break-word;
          font-family: 'Courier New', monospace;
          font-size: 12px;
          line-height: 1.5;
        }
        
        .simple-updater-info {
          background: white;
          border-radius: 6px;
          padding: 15px;
          margin-top: 20px;
        }
        
        .simple-updater-info h4 {
          margin: 0 0 10px 0;
          color: var(--text-primary, #333);
        }
        
        .simple-updater-info ul {
          margin: 0;
          padding-left: 20px;
        }
        
        .simple-updater-info li {
          margin: 5px 0;
          color: var(--text-secondary, #666);
        }
        `}
      </style>
    </div>
  );
});
