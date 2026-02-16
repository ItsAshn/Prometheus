import {
  component$,
  useSignal,
  $,
  useStylesScoped$,
  type QRL,
} from "@builder.io/qwik";
import {
  LuShare2,
  LuCopy,
  LuCheck,
  LuX,
  LuFacebook,
  LuTwitter,
  LuLinkedin,
  LuMail,
} from "@qwikest/icons/lucide";
import { showToast } from "./toast";
import styles from "./share-dialog.css?inline";

interface ShareDialogProps {
  isOpen: boolean;
  onClose$: QRL<() => void>;
  videoTitle: string;
  videoUrl: string;
}

export const ShareDialog = component$<ShareDialogProps>(
  ({ isOpen, onClose$, videoTitle, videoUrl }) => {
    useStylesScoped$(styles);
    const isCopied = useSignal(false);

    const copyToClipboard$ = $(async () => {
      try {
        await navigator.clipboard.writeText(videoUrl);
        isCopied.value = true;
        showToast("success", "Link copied!", "Video link copied to clipboard");
        setTimeout(() => {
          isCopied.value = false;
        }, 2000);
      } catch {
        showToast(
          "error",
          "Failed to copy",
          "Could not copy link to clipboard",
        );
      }
    });

    const shareViaEmail$ = $(() => {
      const subject = encodeURIComponent(`Check out this video: ${videoTitle}`);
      const body = encodeURIComponent(
        `I thought you might be interested in this video:\n\n${videoTitle}\n${videoUrl}`,
      );
      window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
    });

    const shareOnTwitter$ = $(() => {
      const text = encodeURIComponent(`Check out this video: ${videoTitle}`);
      const url = encodeURIComponent(videoUrl);
      window.open(
        `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
        "_blank",
      );
    });

    const shareOnFacebook$ = $(() => {
      const url = encodeURIComponent(videoUrl);
      window.open(
        `https://www.facebook.com/sharer/sharer.php?u=${url}`,
        "_blank",
      );
    });

    const shareOnLinkedIn$ = $(() => {
      const url = encodeURIComponent(videoUrl);
      window.open(
        `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
        "_blank",
      );
    });

    if (!isOpen) {
      return null;
    }

    return (
      <div
        class="share-backdrop"
        onClick$={(e) => {
          if ((e.target as HTMLElement).classList.contains("share-backdrop")) {
            onClose$();
          }
        }}
      >
        <div
          class="share-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="share-title"
        >
          <button
            class="share-close"
            onClick$={onClose$}
            aria-label="Close share dialog"
          >
            <LuX />
          </button>

          <div class="share-header">
            <div class="share-icon">
              <LuShare2 />
            </div>
            <h2 id="share-title">Share Video</h2>
            <p class="share-subtitle">{videoTitle}</p>
          </div>

          <div class="share-content">
            <div class="share-link-section">
              <label for="share-link" class="share-label">
                Video Link
              </label>
              <div class="share-link-input">
                <input
                  id="share-link"
                  type="text"
                  value={videoUrl}
                  readOnly
                  class="share-input"
                  onClick$={(e) => (e.target as HTMLInputElement).select()}
                />
                <button
                  class="btn-copy"
                  onClick$={copyToClipboard$}
                  aria-label="Copy link"
                >
                  {isCopied.value ? <LuCheck /> : <LuCopy />}
                </button>
              </div>
            </div>

            <div class="share-social-section">
              <p class="share-label">Share via</p>
              <div class="share-social-buttons">
                <button
                  class="share-social-btn twitter"
                  onClick$={shareOnTwitter$}
                  aria-label="Share on Twitter"
                >
                  <LuTwitter />
                  <span>Twitter</span>
                </button>
                <button
                  class="share-social-btn facebook"
                  onClick$={shareOnFacebook$}
                  aria-label="Share on Facebook"
                >
                  <LuFacebook />
                  <span>Facebook</span>
                </button>
                <button
                  class="share-social-btn linkedin"
                  onClick$={shareOnLinkedIn$}
                  aria-label="Share on LinkedIn"
                >
                  <LuLinkedin />
                  <span>LinkedIn</span>
                </button>
                <button
                  class="share-social-btn email"
                  onClick$={shareViaEmail$}
                  aria-label="Share via email"
                >
                  <LuMail />
                  <span>Email</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
);
