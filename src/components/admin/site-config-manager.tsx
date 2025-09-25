import { component$, useSignal, useStore, useTask$, $ } from "@builder.io/qwik";
import { server$ } from "@builder.io/qwik-city";

interface SiteConfig {
  channelName: string;
  channelDescription: string;
  customCss?: string;
  selectedTemplate?: string;
  lastUpdated: string;
}

interface SiteConfigStore {
  isLoading: boolean;
  isSaving: boolean;
  config: SiteConfig | null;
  error: string;
  successMessage: string;
}

export const SiteConfigManager = component$(() => {
  const store = useStore<SiteConfigStore>({
    isLoading: true,
    isSaving: false,
    config: null,
    error: "",
    successMessage: "",
  });

  const channelName = useSignal("");
  const channelDescription = useSignal("");
  const customCss = useSignal("");
  const selectedTemplate = useSignal("retro");

  // Server function to load site configuration
  const loadSiteConfig = server$(async function () {
    try {
      const response = await fetch(`${this.url.origin}/api/admin/site-config`, {
        headers: {
          Cookie: this.request.headers.get("cookie") || "",
        },
      });

      if (response.ok) {
        const config = await response.json();
        return { success: true, config };
      }

      return { success: false, error: "Failed to load configuration" };
    } catch (error) {
      console.error("Error loading site config:", error);
      return { success: false, error: "Network error" };
    }
  });

  // Server function to save site configuration
  const saveSiteConfig = server$(async function (config: {
    channelName: string;
    channelDescription: string;
    customCss: string;
    selectedTemplate: string;
  }) {
    try {
      const response = await fetch(`${this.url.origin}/api/admin/site-config`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: this.request.headers.get("cookie") || "",
        },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        const result = await response.json();
        return { success: true, config: result.config };
      }

      const error = await response.json();
      return {
        success: false,
        error: error.message || "Failed to save configuration",
      };
    } catch (error) {
      console.error("Error saving site config:", error);
      return { success: false, error: "Network error" };
    }
  });

  // Server function to apply custom CSS
  const applyCss = server$(async function (cssContent: string) {
    try {
      const response = await fetch(`${this.url.origin}/api/admin/css`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: this.request.headers.get("cookie") || "",
        },
        body: JSON.stringify({ cssContent }),
      });

      if (response.ok) {
        return { success: true };
      }

      const error = await response.json();
      return { success: false, error: error.message || "Failed to apply CSS" };
    } catch (error) {
      console.error("Error applying CSS:", error);
      return { success: false, error: "Network error" };
    }
  });

  // Server function to apply template
  const applyTemplate = server$(async function (templateName: string) {
    try {
      const response = await fetch(`${this.url.origin}/api/admin/template`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: this.request.headers.get("cookie") || "",
        },
        body: JSON.stringify({ templateName }),
      });

      if (response.ok) {
        return { success: true };
      }

      const error = await response.json();
      return {
        success: false,
        error: error.message || "Failed to apply template",
      };
    } catch (error) {
      console.error("Error applying template:", error);
      return { success: false, error: "Network error" };
    }
  });

  // Load configuration on component mount
  useTask$(async () => {
    const result = await loadSiteConfig();
    if (result.success && result.config) {
      store.config = result.config;
      channelName.value = result.config.channelName;
      channelDescription.value = result.config.channelDescription;
      customCss.value = result.config.customCss || "";
      selectedTemplate.value = result.config.selectedTemplate || "retro";
    } else {
      store.error = result.error || "Failed to load configuration";
    }
    store.isLoading = false;
  });

  const handleSaveConfig = $(async () => {
    store.error = "";
    store.successMessage = "";

    if (!channelName.value.trim() || !channelDescription.value.trim()) {
      store.error = "Channel name and description are required";
      return;
    }

    store.isSaving = true;

    try {
      const config = {
        channelName: channelName.value.trim(),
        channelDescription: channelDescription.value.trim(),
        customCss: customCss.value,
        selectedTemplate: selectedTemplate.value,
      };

      const result = await saveSiteConfig(config);

      if (result.success) {
        store.config = result.config;
        store.successMessage = "Configuration saved successfully!";
      } else {
        store.error = result.error || "Failed to save configuration";
      }
    } catch {
      store.error = "Failed to save configuration";
    } finally {
      store.isSaving = false;
    }
  });

  const handleApplyCss = $(async () => {
    store.error = "";
    store.successMessage = "";
    store.isSaving = true;

    try {
      const result = await applyCss(customCss.value);

      if (result.success) {
        store.successMessage =
          "CSS applied successfully! Changes will be visible on page refresh.";
        // Also save the CSS in the config
        await handleSaveConfig();
      } else {
        store.error = result.error || "Failed to apply CSS";
      }
    } catch {
      store.error = "Failed to apply CSS";
    } finally {
      store.isSaving = false;
    }
  });

  const handleTemplateChange = $(async (templateName: string) => {
    selectedTemplate.value = templateName;
    store.error = "";
    store.successMessage = "";
    store.isSaving = true;

    try {
      const result = await applyTemplate(templateName);

      if (result.success) {
        store.successMessage = `${templateName.charAt(0).toUpperCase() + templateName.slice(1)} theme applied successfully! Changes will be visible on page refresh.`;
        // Save the template selection in config
        await handleSaveConfig();
      } else {
        store.error = result.error || "Failed to apply template";
      }
    } catch {
      store.error = "Failed to apply template";
    } finally {
      store.isSaving = false;
    }
  });

  const clearMessages = $(() => {
    store.error = "";
    store.successMessage = "";
  });

  if (store.isLoading) {
    return (
      <div class="admin-card">
        <div class="loading-spinner"></div>
        <h3>Loading Site Configuration...</h3>
      </div>
    );
  }

  return (
    <div class="site-config-manager">
      <div class="admin-card">
        <h3>🎨 Site Configuration</h3>
        <p>Customize your channel name, description, and styling.</p>

        {store.error && (
          <div class="error-message">
            {store.error}
            <button
              type="button"
              onClick$={clearMessages}
              class="btn btn-ghost btn-sm absolute top-2 right-3 p-1 w-6 h-6"
            >
              ×
            </button>
          </div>
        )}

        {store.successMessage && (
          <div class="success-message">
            {store.successMessage}
            <button
              type="button"
              onClick$={clearMessages}
              class="btn btn-ghost btn-sm absolute top-2 right-3 p-1 w-6 h-6"
            >
              ×
            </button>
          </div>
        )}

        <form preventdefault:submit onSubmit$={handleSaveConfig}>
          <div class="form-group">
            <label for="channel-name">Channel Name</label>
            <input
              id="channel-name"
              type="text"
              bind:value={channelName}
              placeholder="Enter your channel name"
              required
              disabled={store.isSaving}
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label for="channel-description">Channel Description</label>
            <textarea
              id="channel-description"
              bind:value={channelDescription}
              placeholder="Enter your channel description"
              required
              disabled={store.isSaving}
              class="form-input"
              rows={3}
            />
          </div>

          <div class="form-actions">
            <button
              type="submit"
              class="btn btn-primary btn-full btn-lg"
              disabled={store.isSaving}
            >
              {store.isSaving ? "Saving..." : "Save Configuration"}
            </button>
          </div>
        </form>
      </div>

      <div class="admin-card">
        <h3>🎨 Theme Templates</h3>
        <p>Choose from our predefined themes for quick styling changes.</p>

        <div class="form-group">
          <label>Select Theme</label>
          <div class="template-grid">
            <div
              class={`template-option ${selectedTemplate.value === "retro" ? "selected" : ""}`}
            >
              <div class="template-preview retro-preview">
                <div class="preview-header"></div>
                <div class="preview-content">
                  <div class="preview-card"></div>
                  <div class="preview-card"></div>
                </div>
              </div>
              <h4>Retro Theme</h4>
              <p>
                Pixelated retro gaming aesthetic with bold colors and sharp
                edges.
              </p>
              <button
                type="button"
                onClick$={() => handleTemplateChange("retro")}
                class={`template-btn ${selectedTemplate.value === "retro" ? "active" : ""}`}
                disabled={store.isSaving}
              >
                {selectedTemplate.value === "retro" ? "Active" : "Apply"}
              </button>
            </div>

            <div
              class={`template-option ${selectedTemplate.value === "modern" ? "selected" : ""}`}
            >
              <div class="template-preview modern-preview">
                <div class="preview-header"></div>
                <div class="preview-content">
                  <div class="preview-card"></div>
                  <div class="preview-card"></div>
                </div>
              </div>
              <h4>Modern Theme</h4>
              <p>
                Sleek minimalist design with rounded corners and subtle shadows.
              </p>
              <button
                type="button"
                onClick$={() => handleTemplateChange("modern")}
                class={`template-btn ${selectedTemplate.value === "modern" ? "active" : ""}`}
                disabled={store.isSaving}
              >
                {selectedTemplate.value === "modern" ? "Active" : "Apply"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="admin-card">
        <h3>🎨 Custom CSS</h3>
        <p>
          Paste your custom CSS here to override the default styling. This will
          replace the entire global.css file.
        </p>

        <div class="form-group">
          <label for="custom-css">Custom CSS</label>
          <textarea
            id="custom-css"
            bind:value={customCss}
            placeholder="/* Paste your custom CSS here */&#10;body {&#10;  background-color: #your-color;&#10;}"
            disabled={store.isSaving}
            class="form-input css-editor"
            rows={20}
            style="font-family: 'Courier New', monospace; font-size: 14px;"
          />
        </div>

        <div class="css-actions">
          <button
            type="button"
            onClick$={handleApplyCss}
            class="btn btn-warning btn-lg"
            disabled={store.isSaving}
          >
            {store.isSaving ? "Applying..." : "Apply CSS"}
          </button>
          <p class="css-warning">
            ⚠️ <strong>Warning:</strong> This will overwrite your current
            global.css file. A backup will be created automatically.
          </p>
        </div>
      </div>

      {store.config && (
        <div class="admin-card">
          <h3>📊 Configuration Status</h3>
          <p>
            <strong>Last Updated:</strong>{" "}
            {new Date(store.config.lastUpdated).toLocaleString()}
          </p>
          <p>
            <strong>Current Channel:</strong> {store.config.channelName}
          </p>
          <p>
            <strong>Active Theme:</strong>{" "}
            {store.config.selectedTemplate || "retro"}
          </p>
          <p>
            <strong>Has Custom CSS:</strong>{" "}
            {store.config.customCss ? "Yes" : "No"}
          </p>
        </div>
      )}
    </div>
  );
});
