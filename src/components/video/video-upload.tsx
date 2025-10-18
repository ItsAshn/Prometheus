import { component$, useSignal, $, useStylesScoped$ } from "@builder.io/qwik";
import { checkAdminAuthServer } from "~/lib/admin-auth-utils";
import styles from "./video-upload.css?inline";

export const VideoUpload = component$(() => {
  useStylesScoped$(styles);
  const title = useSignal("");
  const selectedFile = useSignal<File | null>(null);
  const selectedThumbnail = useSignal<File | null>(null);
  const thumbnailPreview = useSignal<string>("");
  const isUploading = useSignal(false);
  const uploadProgress = useSignal(0);
  const message = useSignal("");
  const messageType = useSignal<"success" | "error" | "info">("info");

  const handleFileSelect = $((event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (file) {
      // Validate file type - check both MIME type and extension
      const allowedMimeTypes = [
        "video/mp4",
        "video/avi",
        "video/x-msvideo", // Alternative AVI MIME type
        "video/quicktime", // Correct MOV MIME type
        "video/mov", // Sometimes used for MOV
        "video/x-matroska", // Correct MKV MIME type
        "video/mkv", // Sometimes used for MKV
        "video/webm",
      ];

      // Also check file extension as fallback since MIME types can be unreliable
      const fileExtension = file.name.toLowerCase().split(".").pop();
      const allowedExtensions = ["mp4", "avi", "mov", "mkv", "webm"];

      const isValidMimeType = allowedMimeTypes.includes(file.type);
      const isValidExtension = allowedExtensions.includes(fileExtension || "");

      if (!isValidMimeType && !isValidExtension) {
        message.value = `Please select a valid video file. Detected type: "${file.type}", Extension: ".${fileExtension}". Supported: MP4, AVI, MOV, MKV, WebM`;
        messageType.value = "error";
        selectedFile.value = null;
        return;
      }

      // Validate file size - increase limit to 5GB with chunked upload
      const maxSize = 5 * 1024 * 1024 * 1024; // 5GB limit
      if (file.size > maxSize) {
        message.value = "File size must be less than 5GB";
        messageType.value = "error";
        selectedFile.value = null;
        return;
      }

      selectedFile.value = file;
      message.value = `Selected: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
      messageType.value = "info";
    }
  });

  const handleThumbnailSelect = $((event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (file) {
      // Validate file type
      const allowedMimeTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
      ];
      const fileExtension = file.name.toLowerCase().split(".").pop();
      const allowedExtensions = ["jpg", "jpeg", "png", "webp"];

      const isValidMimeType = allowedMimeTypes.includes(file.type);
      const isValidExtension = allowedExtensions.includes(fileExtension || "");

      if (!isValidMimeType && !isValidExtension) {
        message.value = `Please select a valid image file. Supported: JPG, PNG, WebP`;
        messageType.value = "error";
        selectedThumbnail.value = null;
        thumbnailPreview.value = "";
        return;
      }

      // Validate file size (max 5MB for thumbnail)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        message.value = "Thumbnail size must be less than 5MB";
        messageType.value = "error";
        selectedThumbnail.value = null;
        thumbnailPreview.value = "";
        return;
      }

      selectedThumbnail.value = file;

      // Create preview URL
      if (typeof window !== "undefined") {
        const reader = new FileReader();
        reader.onload = (e) => {
          thumbnailPreview.value = e.target?.result as string;
        };
        reader.readAsDataURL(file);
      }
    }
  });

  const handleUpload = $(async () => {
    if (!selectedFile.value || !title.value.trim()) {
      message.value = "Please provide a title and select a video file";
      messageType.value = "error";
      return;
    }

    // Only run on client side
    if (typeof window === "undefined") return;

    // Check authentication before starting upload
    try {
      const authCheck = await checkAdminAuthServer();

      if (!authCheck.isAuthenticated) {
        message.value = "Please log in to upload videos";
        messageType.value = "error";
        setTimeout(() => {
          window.location.href = "/admin";
        }, 2000);
        return;
      }
    } catch (authError) {
      console.warn("Auth check failed:", authError);
      // Continue anyway, let the upload endpoint handle auth
    }

    isUploading.value = true;
    uploadProgress.value = 0;
    message.value = "Uploading video...";
    messageType.value = "info";

    try {
      const file = selectedFile.value;
      const CHUNK_SIZE = 250 * 1024 * 1024; // 250MB chunks (increased from 100MB)
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
      const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Upload chunks with retry mechanism
      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        const formData = new FormData();
        formData.append("chunk", chunk);
        formData.append("chunkIndex", chunkIndex.toString());
        formData.append("totalChunks", totalChunks.toString());
        formData.append("fileName", file.name);
        formData.append("uploadId", uploadId);

        message.value = `Uploading chunk ${chunkIndex + 1}/${totalChunks}...`;
        uploadProgress.value = ((chunkIndex + 1) / totalChunks) * 90; // Reserve 10% for assembly

        // Retry mechanism for chunks
        let retries = 3;
        let lastError = null;

        while (retries > 0) {
          try {
            const response = await fetch("/api/video/upload-chunk", {
              method: "POST",
              body: formData,
              credentials: "include",
            });

            if (!response.ok) {
              let errorText = "Unknown error";
              try {
                errorText = await response.text();
              } catch (textError) {
                console.warn("Could not read error response text:", textError);
                errorText = `HTTP ${response.status} ${response.statusText}`;
              }

              // If it's an authentication error, redirect to login
              if (response.status === 401 || response.status === 403) {
                console.error(
                  "Authentication failed during upload:",
                  errorText
                );
                message.value = "Authentication failed. Please log in again.";
                messageType.value = "error";
                // Redirect to login after a delay
                setTimeout(() => {
                  window.location.href = "/admin";
                }, 2000);
                return;
              }

              // If it's a server error (5xx), retry
              if (response.status >= 500 && retries > 1) {
                console.warn(
                  `Chunk ${chunkIndex + 1} upload failed (${response.status}), retrying... (${retries - 1} attempts left)`
                );
                lastError = errorText;
                retries--;
                await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second before retry
                continue;
              }

              console.error("Chunk upload error:", errorText);
              message.value = `Chunk upload failed: ${response.status} ${response.statusText}`;
              messageType.value = "error";
              return;
            }

            try {
              await response.json();
            } catch (jsonError) {
              if (retries > 1) {
                console.warn(
                  `Failed to parse chunk ${chunkIndex + 1} response, retrying... (${retries - 1} attempts left)`
                );
                lastError = "Invalid response format";
                retries--;
                await new Promise((resolve) => setTimeout(resolve, 1000));
                continue;
              }

              console.error(
                "Failed to parse chunk upload response as JSON:",
                jsonError
              );
              message.value = `Chunk upload failed: Invalid response format`;
              messageType.value = "error";
              return;
            }

            break; // Success, exit retry loop
          } catch (error) {
            if (retries > 1) {
              console.warn(
                `Chunk ${chunkIndex + 1} upload failed with network error, retrying... (${retries - 1} attempts left)`,
                error
              );
              lastError = error;
              retries--;
              await new Promise((resolve) => setTimeout(resolve, 1000));
              continue;
            }

            console.error("Network error during chunk upload:", error);
            message.value = `Network error during chunk upload: ${error}`;
            messageType.value = "error";
            return;
          }
        }

        if (retries === 0) {
          console.error(
            `Failed to upload chunk ${chunkIndex + 1} after all retries:`,
            lastError
          );
          message.value = `Failed to upload chunk ${chunkIndex + 1} after retries`;
          messageType.value = "error";
          return;
        }
      }

      // Assemble chunks
      message.value = "Assembling file and starting processing...";
      uploadProgress.value = 95;

      // Use FormData instead of JSON to avoid middleware issues
      const assembleFormData = new FormData();
      assembleFormData.append("uploadId", uploadId);
      assembleFormData.append("fileName", file.name);
      assembleFormData.append("totalChunks", totalChunks.toString());
      assembleFormData.append("title", title.value.trim());

      // Add thumbnail if selected
      if (selectedThumbnail.value) {
        assembleFormData.append("thumbnail", selectedThumbnail.value);
      }

      const assembleResponse = await fetch("/api/video/assemble", {
        method: "POST",
        body: assembleFormData,
        credentials: "include",
      });

      if (!assembleResponse.ok) {
        let errorText = "Unknown assembly error";
        try {
          errorText = await assembleResponse.text();
        } catch (textError) {
          console.warn(
            "Could not read assembly error response text:",
            textError
          );
          errorText = `HTTP ${assembleResponse.status} ${assembleResponse.statusText}`;
        }
        console.error("Assembly error:", errorText);
        message.value = `File assembly failed: ${assembleResponse.status} ${assembleResponse.statusText}`;
        messageType.value = "error";
        return;
      }

      let assembleResult;
      try {
        assembleResult = await assembleResponse.json();
      } catch (jsonError) {
        console.error("Failed to parse assembly response as JSON:", jsonError);
        message.value = `File assembly failed: Invalid response format`;
        messageType.value = "error";
        return;
      }

      if (assembleResult.success) {
        uploadProgress.value = 100;
        message.value =
          "Video uploaded successfully! Check the processing status below for conversion progress.";
        messageType.value = "success";

        // Reset form
        title.value = "";
        selectedFile.value = null;
        selectedThumbnail.value = null;
        thumbnailPreview.value = "";
        const fileInput = document.getElementById(
          "video-file"
        ) as HTMLInputElement;
        if (fileInput) fileInput.value = "";
        const thumbnailInput = document.getElementById(
          "video-thumbnail"
        ) as HTMLInputElement;
        if (thumbnailInput) thumbnailInput.value = "";

        // Dispatch event to refresh video list
        window.dispatchEvent(new CustomEvent("video-uploaded"));
      } else {
        message.value = assembleResult.message || "Upload failed";
        messageType.value = "error";
      }
    } catch (error) {
      console.error("Upload error:", error);
      message.value = "Upload failed. Please try again.";
      messageType.value = "error";
    } finally {
      isUploading.value = false;
      uploadProgress.value = 0;
    }
  });

  return (
    <div class="video-upload-container">
      <div class="video-upload-card">
        <h3>
          <span class="upload-icon">📹</span>
          Upload Video
        </h3>
        <p class="upload-description">
          Upload videos to convert them to HLS format for streaming. Supported
          formats include MP4, AVI, MOV, MKV, and WebM.
        </p>

        <form
          preventdefault:submit
          onSubmit$={handleUpload}
          class="upload-form"
        >
          <div class="form-group">
            <label for="video-title">
              <span class="label-icon">🏷️</span>
              Video Title
            </label>
            <input
              id="video-title"
              type="text"
              bind:value={title}
              placeholder="Enter a descriptive title for your video"
              required
              disabled={isUploading.value}
              class="form-input"
              maxLength={100}
            />
          </div>

          <div class="form-group">
            <label for="video-file">
              <span class="label-icon">📁</span>
              Video File
            </label>
            <input
              id="video-file"
              type="file"
              accept="video/mp4,video/avi,video/quicktime,video/x-msvideo,video/x-matroska,video/webm,.mp4,.avi,.mov,.mkv,.webm"
              onChange$={handleFileSelect}
              disabled={isUploading.value}
              class="form-input file-input"
            />
            <small class="file-info">
              📊 Supported formats: MP4, AVI, MOV, MKV, WebM • Maximum size: 5GB
            </small>
          </div>

          <div class="form-group">
            <label for="video-thumbnail">
              <span class="label-icon">🖼️</span>
              Thumbnail (Optional)
            </label>
            <input
              id="video-thumbnail"
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
              onChange$={handleThumbnailSelect}
              disabled={isUploading.value}
              class="form-input file-input"
            />
            <small class="file-info">
              🎨 Recommended: 1280x720 • JPG, PNG, or WebP • Max 5MB • If not
              provided, a thumbnail will be auto-generated
            </small>
            {thumbnailPreview.value && (
              <div class="thumbnail-preview">
                <img
                  src={thumbnailPreview.value}
                  alt="Thumbnail preview"
                  width="320"
                  height="180"
                />
              </div>
            )}
          </div>

          {message.value && (
            <div class={`upload-message ${messageType.value}`}>
              <div class="message-content">
                <span class="message-icon">
                  {messageType.value === "success" && "✅"}
                  {messageType.value === "error" && "❌"}
                  {messageType.value === "info" && "ℹ️"}
                </span>
                <p>{message.value}</p>
              </div>
            </div>
          )}

          {isUploading.value && (
            <div class="upload-progress">
              <div class="progress-header">
                <span class="progress-label">Upload Progress</span>
                <span class="progress-percentage">
                  {Math.round(uploadProgress.value)}%
                </span>
              </div>
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  style={`width: ${uploadProgress.value}%`}
                ></div>
              </div>
              <p class="progress-status">
                {uploadProgress.value < 90
                  ? "⬆️ Uploading chunks..."
                  : "🔄 Assembling and processing..."}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={
              isUploading.value || !selectedFile.value || !title.value.trim()
            }
            class="btn btn-primary btn-lg"
          >
            <span class="btn-icon">{isUploading.value ? "⏳" : "🚀"}</span>
            {isUploading.value ? "Uploading..." : "Upload Video"}
          </button>
        </form>
      </div>
    </div>
  );
});
