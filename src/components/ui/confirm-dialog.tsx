import {
  component$,
  useStylesScoped$,
  $,
  type QRL,
  Slot,
} from "@builder.io/qwik";
import { LuAlertTriangle, LuX } from "@qwikest/icons/lucide";
import styles from "./confirm-dialog.css?inline";

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose$: QRL<() => void>;
  onConfirm$: QRL<() => void>;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
}

export const ConfirmDialog = component$<ConfirmDialogProps>(
  ({
    isOpen,
    onClose$,
    onConfirm$,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = "danger",
    isLoading = false,
  }) => {
    useStylesScoped$(styles);

    if (!isOpen) {
      return null;
    }

    const handleConfirm$ = $(async () => {
      await onConfirm$();
    });

    const handleBackdropClick$ = $((e: MouseEvent) => {
      if ((e.target as HTMLElement).classList.contains("dialog-backdrop")) {
        onClose$();
      }
    });

    return (
      <div
        class="dialog-backdrop"
        onClick$={handleBackdropClick$}
        role="presentation"
      >
        <div
          class={`dialog-container dialog-${variant}`}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="dialog-title"
          aria-describedby="dialog-message"
        >
          <button
            class="dialog-close"
            onClick$={onClose$}
            aria-label="Close dialog"
            disabled={isLoading}
          >
            <LuX />
          </button>

          <div class="dialog-icon">
            <LuAlertTriangle />
          </div>

          <h2 id="dialog-title" class="dialog-title">
            {title}
          </h2>

          {message && (
            <p id="dialog-message" class="dialog-message">
              {message}
            </p>
          )}

          <Slot />

          <div class="dialog-actions">
            <button
              class="btn btn-secondary"
              onClick$={onClose$}
              disabled={isLoading}
            >
              {cancelText}
            </button>
            <button
              class={`btn btn-${variant === "danger" ? "destructive" : "primary"}`}
              onClick$={handleConfirm$}
              disabled={isLoading}
            >
              {isLoading ? "Processing..." : confirmText}
            </button>
          </div>
        </div>
      </div>
    );
  },
);
