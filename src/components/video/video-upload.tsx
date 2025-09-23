import { component$, useSignal, $ } from "@builder.io/qwik";

export const VideoUpload = component$(() => {
  const title = useSignal("");
  const selectedFile = useSignal<File | null>(null);
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

  const handleUpload = $(async () => {
    if (!selectedFile.value || !title.value.trim()) {
      message.value = "Please provide a title and select a video file";
      messageType.value = "error";
      return;
    }

    // Only run on client side
    if (typeof window === "undefined") return;

    isUploading.value = true;
    uploadProgress.value = 0;
    message.value = "Uploading video...";
    messageType.value = "info";

    try {
      const file = selectedFile.value;
      const CHUNK_SIZE = 250 * 1024 * 1024; // 250MB chunks (increased from 100MB)
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
      const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      console.log(
        `Starting chunked upload: ${totalChunks} chunks of ${CHUNK_SIZE / 1024 / 1024}MB each`
      );

      // Upload chunks
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

        const response = await fetch("/api/video/upload-chunk", {
          method: "POST",
          body: formData,
          credentials: "include",
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Chunk upload error:", errorText);
          message.value = `Chunk upload failed: ${response.status} ${response.statusText}`;
          messageType.value = "error";
          return;
        }

        const result = await response.json();
        console.log(`Chunk ${chunkIndex + 1}/${totalChunks} uploaded:`, result);
      }

      // Assemble chunks
      message.value = "Assembling file and starting processing...";
      uploadProgress.value = 95;

      const assembleResponse = await fetch("/api/video/assemble", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uploadId,
          fileName: file.name,
          totalChunks,
          title: title.value.trim(),
        }),
        credentials: "include",
      });

      if (!assembleResponse.ok) {
        const errorText = await assembleResponse.text();
        console.error("Assembly error:", errorText);
        message.value = `File assembly failed: ${assembleResponse.status} ${assembleResponse.statusText}`;
        messageType.value = "error";
        return;
      }

      const assembleResult = await assembleResponse.json();
      console.log("Assembly result:", assembleResult);

      if (assembleResult.success) {
        uploadProgress.value = 100;
        message.value =
          "Video uploaded successfully! Check the processing status below for conversion progress.";
        messageType.value = "success";

        // Reset form
        title.value = "";
        selectedFile.value = null;
        const fileInput = document.getElementById(
          "video-file"
        ) as HTMLInputElement;
        if (fileInput) fileInput.value = "";

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
        <h3>📹 Upload Video</h3>
        <p class="upload-description">
          Upload videos to convert them to HLS format for streaming
        </p>

        <form preventdefault:submit onSubmit$={handleUpload}>
          <div class="form-group">
            <label for="video-title">Video Title</label>
            <input
              id="video-title"
              type="text"
              bind:value={title}
              placeholder="Enter video title"
              required
              disabled={isUploading.value}
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label for="video-file">Video File</label>
            <input
              id="video-file"
              type="file"
              accept="video/*"
              onChange$={handleFileSelect}
              disabled={isUploading.value}
              class="form-input file-input"
            />
            <small class="file-info">
              Supported formats: MP4, AVI, MOV, MKV, WebM (Max: 5GB)
            </small>
          </div>

          {message.value && (
            <div class={`upload-message ${messageType.value}`}>
              <p>{message.value}</p>
            </div>
          )}

          {isUploading.value && (
            <div class="upload-progress">
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  style={`width: ${uploadProgress.value}%`}
                ></div>
              </div>
              <p>Processing upload...</p>
            </div>
          )}

          <button
            type="submit"
            disabled={
              isUploading.value || !selectedFile.value || !title.value.trim()
            }
            class="upload-btn"
          >
            {isUploading.value ? "Uploading..." : "Upload Video"}
          </button>
        </form>
      </div>
    </div>
  );
});
