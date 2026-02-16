import {
  component$,
  useSignal,
  useStore,
  useVisibleTask$,
  useStylesScoped$,
  $,
  type QRL,
} from "@builder.io/qwik";
import {
  LuCheckCircle,
  LuAlertTriangle,
  LuInfo,
  LuXCircle,
  LuX,
} from "@qwikest/icons/lucide";
import styles from "./toast.css?inline";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastStore {
  toasts: Toast[];
}

// Global toast store
const toastStore: ToastStore = {
  toasts: [],
};

// Helper function to show toast (can be called from anywhere)
export const showToast = (
  type: ToastType,
  title: string,
  message?: string,
  duration: number = 5000,
) => {
  const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const toast: Toast = { id, type, title, message, duration };

  toastStore.toasts.push(toast);

  // Auto remove after duration
  if (duration > 0) {
    setTimeout(() => {
      const index = toastStore.toasts.findIndex((t) => t.id === id);
      if (index > -1) {
        toastStore.toasts.splice(index, 1);
      }
    }, duration);
  }

  return id;
};

export const ToastContainer = component$(() => {
  useStylesScoped$(styles);
  const toasts = useStore<ToastStore>({ toasts: [] });

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(() => {
    // Sync with global store
    const interval = setInterval(() => {
      toasts.toasts = [...toastStore.toasts];
    }, 100);

    return () => clearInterval(interval);
  });

  const removeToast$ = $((id: string) => {
    const index = toastStore.toasts.findIndex((t) => t.id === id);
    if (index > -1) {
      toastStore.toasts.splice(index, 1);
    }
  });

  if (toasts.toasts.length === 0) {
    return null;
  }

  return (
    <div class="toast-container" role="region" aria-label="Notifications">
      {toasts.toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove$={removeToast$} />
      ))}
    </div>
  );
});

interface ToastItemProps {
  toast: Toast;
  onRemove$: QRL<(id: string) => void>;
}

const ToastItem = component$<ToastItemProps>(({ toast, onRemove$ }) => {
  const isVisible = useSignal(false);

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(() => {
    // Trigger animation
    requestAnimationFrame(() => {
      isVisible.value = true;
    });
  });

  const getIcon = () => {
    switch (toast.type) {
      case "success":
        return <LuCheckCircle />;
      case "error":
        return <LuXCircle />;
      case "warning":
        return <LuAlertTriangle />;
      case "info":
        return <LuInfo />;
    }
  };

  return (
    <div
      class={`toast toast-${toast.type} ${isVisible.value ? "toast-visible" : ""}`}
      role="alert"
      aria-live="polite"
    >
      <div class="toast-icon">{getIcon()}</div>
      <div class="toast-content">
        <div class="toast-title">{toast.title}</div>
        {toast.message && <div class="toast-message">{toast.message}</div>}
      </div>
      <button
        class="toast-close"
        onClick$={() => onRemove$(toast.id)}
        aria-label="Close notification"
      >
        <LuX />
      </button>
    </div>
  );
});
