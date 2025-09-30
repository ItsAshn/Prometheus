import { component$, useSignal, $ } from "@builder.io/qwik";
import { server$ } from "@builder.io/qwik-city";

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
  const updateMessage = useSignal("");
  const updateStatus = useSignal<"idle" | "success" | "error">("idle");

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

        if (result.restarting) {
          setTimeout(() => {
            updateMessage.value +=
              "\n\nContainer is restarting... Please refresh in a moment.";
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
      <h3>🚀 Simple System Updates</h3>
      <p class="description">
        Easy one-click updates from GitHub without complex configuration.
      </p>

      <div class="update-actions">
        <button
          type="button"
          class={`update-btn ${isUpdating.value ? "updating" : ""}`}
          onClick$={handleUpdate}
          disabled={isUpdating.value}
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
            ✅ <strong>Update from GitHub:</strong> Downloads the latest code
            and restarts the container
          </li>
          <li>
            ✅ <strong>Restart Container:</strong> Simply restarts the
            application without updating
          </li>
          <li>
            ✅ <strong>No Git required:</strong> Works in Docker containers
            without Git installed
          </li>
          <li>
            ✅ <strong>Simple and reliable:</strong> Uses GET requests to avoid
            parsing issues
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
        
        .update-actions {
          display: flex;
          gap: 15px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        
        .update-btn, .restart-btn {
          padding: 12px 24px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          min-width: 160px;
        }
        
        .update-btn {
          background: #2563eb;
          color: white;
        }
        
        .update-btn:hover:not(:disabled) {
          background: #1d4ed8;
        }
        
        .restart-btn {
          background: #dc2626;
          color: white;
        }
        
        .restart-btn:hover:not(:disabled) {
          background: #b91c1c;
        }
        
        .update-btn:disabled, .restart-btn:disabled {
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
