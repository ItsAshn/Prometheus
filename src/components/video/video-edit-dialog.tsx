import {
  component$,
  useSignal,
  useStylesScoped$,
  $,
  type QRL,
} from "@builder.io/qwik";
import { LuPencil, LuX, LuSave, LuFileText } from "@qwikest/icons/lucide";
import { showToast } from "../ui/toast";
import styles from "./video-edit-dialog.css?inline";

interface VideoEditDialogProps {
  isOpen: boolean;
  onClose$: QRL<() => void>;
  videoId: string;
  initialTitle: string;
  initialDescription?: string;
  onSave$: QRL<(title: string, description: string) => Promise<void>>;
}

export const VideoEditDialog = component$<VideoEditDialogProps>(
  ({
    isOpen,
    onClose$,
    videoId,
    initialTitle,
    initialDescription = "",
    onSave$,
  }) => {
    useStylesScoped$(styles);
    const title = useSignal(initialTitle);
    const description = useSignal(initialDescription);
    const isSaving = useSignal(false);

    const handleSave$ = $(async () => {
      const trimmedTitle = title.value.trim();

      if (!trimmedTitle) {
        showToast("error", "Title required", "Please enter a video title");
        return;
      }

      if (trimmedTitle.length > 100) {
        showToast(
          "error",
          "Title too long",
          "Title must be 100 characters or less",
        );
        return;
      }

      if (description.value.length > 500) {
        showToast(
          "error",
          "Description too long",
          "Description must be 500 characters or less",
        );
        return;
      }

      isSaving.value = true;

      try {
        await onSave$(trimmedTitle, description.value.trim());
        showToast(
          "success",
          "Video updated",
          "Video metadata has been updated successfully",
        );
        onClose$();
      } catch (error) {
        console.error("Failed to update video:", error);
        showToast("error", "Update failed", "Failed to update video metadata");
      } finally {
        isSaving.value = false;
      }
    });

    const handleCancel$ = $(() => {
      // Reset to initial values
      title.value = initialTitle;
      description.value = initialDescription;
      onClose$();
    });

    if (!isOpen) {
      return null;
    }

    return (
      <div
        class="edit-backdrop"
        onClick$={(e) => {
          if ((e.target as HTMLElement).classList.contains("edit-backdrop")) {
            handleCancel$();
          }
        }}
      >
        <div
          class="edit-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-title"
        >
          <div class="edit-header">
            <div class="edit-title-wrapper">
              <LuPencil class="edit-icon" />
              <h3 id="edit-title">Edit Video</h3>
            </div>
            <button
              class="edit-close"
              onClick$={handleCancel$}
              aria-label="Close dialog"
              disabled={isSaving.value}
            >
              <LuX />
            </button>
          </div>

          <div class="edit-content">
            <div class="form-group">
              <label for={`edit-title-${videoId}`} class="form-label">
                <LuFileText />
                <span>Title</span>
                <span class="required">*</span>
              </label>
              <input
                id={`edit-title-${videoId}`}
                type="text"
                class="form-input"
                bind:value={title}
                placeholder="Enter video title"
                maxLength={100}
                disabled={isSaving.value}
                required
              />
              <small class="char-count">
                {title.value.length}/100 characters
              </small>
            </div>

            <div class="form-group">
              <label for={`edit-description-${videoId}`} class="form-label">
                <LuFileText />
                <span>Description</span>
              </label>
              <textarea
                id={`edit-description-${videoId}`}
                class="form-input form-textarea"
                bind:value={description}
                placeholder="Enter video description (optional)"
                maxLength={500}
                rows={6}
                disabled={isSaving.value}
              />
              <small class="char-count">
                {description.value.length}/500 characters
              </small>
            </div>
          </div>

          <div class="edit-footer">
            <button
              type="button"
              class="btn btn-secondary"
              onClick$={handleCancel$}
              disabled={isSaving.value}
            >
              Cancel
            </button>
            <button
              type="button"
              class="btn btn-primary"
              onClick$={handleSave$}
              disabled={isSaving.value}
            >
              {isSaving.value ? (
                <>
                  <span class="spinner"></span>
                  Saving...
                </>
              ) : (
                <>
                  <LuSave />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  },
);
