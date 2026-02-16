import {
  component$,
  useSignal,
  useStylesScoped$,
  useVisibleTask$,
  $,
  useStore,
} from "@builder.io/qwik";
import {
  LuPlay,
  LuPause,
  LuVolume2,
  LuVolumeX,
  LuMaximize,
  LuMinimize,
  LuGauge,
} from "@qwikest/icons/lucide";
import styles from "./video-controls.css?inline";

interface VideoControlsProps {
  videoRef: HTMLVideoElement | undefined;
  containerRef: HTMLDivElement | undefined;
}

export const VideoControls = component$<VideoControlsProps>(
  ({ videoRef, containerRef }) => {
    useStylesScoped$(styles);

    const isPlaying = useSignal(false);
    const currentTime = useSignal(0);
    const duration = useSignal(0);
    const volume = useSignal(1);
    const isMuted = useSignal(false);
    const isFullscreen = useSignal(false);
    const playbackRate = useSignal(1);
    const showSpeedMenu = useSignal(false);
    const showControls = useSignal(true);
    const hideControlsState = useStore({ timeout: 0 });

    // Keyboard shortcuts
    // eslint-disable-next-line qwik/no-use-visible-task
    useVisibleTask$(({ track, cleanup }) => {
      track(() => videoRef);
      const video = videoRef;
      if (!video) return;

      const handleKeyPress = (e: KeyboardEvent) => {
        // Prevent keyboard shortcuts if user is typing in an input
        if (
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement
        ) {
          return;
        }

        switch (e.key.toLowerCase()) {
          case " ":
          case "k":
            e.preventDefault();
            togglePlay$();
            break;
          case "m":
            e.preventDefault();
            toggleMute$();
            break;
          case "f":
            e.preventDefault();
            toggleFullscreen$();
            break;
          case "arrowleft":
            e.preventDefault();
            seekBackward$();
            break;
          case "arrowright":
            e.preventDefault();
            seekForward$();
            break;
          case "arrowup":
            e.preventDefault();
            increaseVolume$();
            break;
          case "arrowdown":
            e.preventDefault();
            decreaseVolume$();
            break;
          case "j":
            e.preventDefault();
            seekBackward$(10);
            break;
          case "l":
            e.preventDefault();
            seekForward$(10);
            break;
          case "0":
          case "home":
            e.preventDefault();
            video.currentTime = 0;
            break;
          case "end":
            e.preventDefault();
            video.currentTime = video.duration;
            break;
          case ">":
          case ".":
            if (e.shiftKey) {
              e.preventDefault();
              increaseSpeed$();
            }
            break;
          case "<":
          case ",":
            if (e.shiftKey) {
              e.preventDefault();
              decreaseSpeed$();
            }
            break;
        }
      };

      document.addEventListener("keydown", handleKeyPress);

      cleanup(() => {
        document.removeEventListener("keydown", handleKeyPress);
      });
    });

    // Update video state
    // eslint-disable-next-line qwik/no-use-visible-task
    useVisibleTask$(({ track, cleanup }) => {
      track(() => videoRef);
      const video = videoRef;
      if (!video) return;

      const updateTime = () => {
        currentTime.value = video.currentTime;
        duration.value = video.duration;
      };

      const updatePlayState = () => {
        isPlaying.value = !video.paused;
      };

      const updateVolume = () => {
        volume.value = video.volume;
        isMuted.value = video.muted;
      };

      video.addEventListener("timeupdate", updateTime);
      video.addEventListener("play", updatePlayState);
      video.addEventListener("pause", updatePlayState);
      video.addEventListener("volumechange", updateVolume);

      cleanup(() => {
        video.removeEventListener("timeupdate", updateTime);
        video.removeEventListener("play", updatePlayState);
        video.removeEventListener("pause", updatePlayState);
        video.removeEventListener("volumechange", updateVolume);
      });
    });

    // Fullscreen handling
    // eslint-disable-next-line qwik/no-use-visible-task
    useVisibleTask$(({ track, cleanup }) => {
      track(() => containerRef);
      const container = containerRef;
      if (!container) return;

      const handleFullscreenChange = () => {
        isFullscreen.value = !!document.fullscreenElement;
      };

      document.addEventListener("fullscreenchange", handleFullscreenChange);

      cleanup(() => {
        document.removeEventListener(
          "fullscreenchange",
          handleFullscreenChange,
        );
      });
    });

    // Auto-hide controls
    const resetHideControlsTimer = $(() => {
      showControls.value = true;
      clearTimeout(hideControlsState.timeout);
      hideControlsState.timeout = setTimeout(() => {
        if (isPlaying.value) {
          showControls.value = false;
        }
      }, 3000) as any;
    });

    // Control functions
    const togglePlay$ = $(() => {
      const video = videoRef;
      if (!video) return;
      if (video.paused) {
        video.play();
      } else {
        video.pause();
      }
    });

    const toggleMute$ = $(() => {
      const video = videoRef;
      if (!video) return;
      video.muted = !video.muted;
    });

    const toggleFullscreen$ = $(async () => {
      const container = containerRef;
      if (!container) return;

      if (!document.fullscreenElement) {
        await container.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    });

    const seekBackward$ = $((seconds: number = 5) => {
      const video = videoRef;
      if (!video) return;
      video.currentTime = Math.max(0, video.currentTime - seconds);
    });

    const seekForward$ = $((seconds: number = 5) => {
      const video = videoRef;
      if (!video) return;
      video.currentTime = Math.min(video.duration, video.currentTime + seconds);
    });

    const increaseVolume$ = $(() => {
      const video = videoRef;
      if (!video) return;
      video.volume = Math.min(1, video.volume + 0.1);
      video.muted = false;
    });

    const decreaseVolume$ = $(() => {
      const video = videoRef;
      if (!video) return;
      video.volume = Math.max(0, video.volume - 0.1);
    });

    const increaseSpeed$ = $(() => {
      const video = videoRef;
      if (!video) return;
      const newRate = Math.min(2, playbackRate.value + 0.25);
      video.playbackRate = newRate;
      playbackRate.value = newRate;
    });

    const decreaseSpeed$ = $(() => {
      const video = videoRef;
      if (!video) return;
      const newRate = Math.max(0.25, playbackRate.value - 0.25);
      video.playbackRate = newRate;
      playbackRate.value = newRate;
    });

    const setSpeed$ = $((rate: number) => {
      const video = videoRef;
      if (!video) return;
      video.playbackRate = rate;
      playbackRate.value = rate;
      showSpeedMenu.value = false;
    });

    const handleSeek$ = $((e: Event) => {
      const video = videoRef;
      if (!video) return;
      const target = e.target as HTMLInputElement;
      video.currentTime = parseFloat(target.value);
    });

    const handleVolumeChange$ = $((e: Event) => {
      const video = videoRef;
      if (!video) return;
      const target = e.target as HTMLInputElement;
      const newVolume = parseFloat(target.value);
      video.volume = newVolume;
      video.muted = newVolume === 0;
    });

    const formatTime = (seconds: number): string => {
      if (isNaN(seconds)) return "0:00";
      const hrs = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      const secs = Math.floor(seconds % 60);

      if (hrs > 0) {
        return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
      }
      return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    return (
      <div
        class={`video-controls-overlay ${showControls.value ? "visible" : ""}`}
        onMouseMove$={resetHideControlsTimer}
        onMouseEnter$={resetHideControlsTimer}
        onClick$={resetHideControlsTimer}
      >
        <div class="video-controls">
          {/* Progress Bar */}
          <div class="control-row progress-row">
            <input
              type="range"
              class="progress-bar"
              min="0"
              max={duration.value || 0}
              value={currentTime.value}
              onInput$={handleSeek$}
              aria-label="Video progress"
            />
          </div>

          {/* Controls Row */}
          <div class="control-row controls-row">
            <div class="controls-left">
              <button
                class="control-btn"
                onClick$={togglePlay$}
                aria-label={isPlaying.value ? "Pause" : "Play"}
              >
                {isPlaying.value ? <LuPause /> : <LuPlay />}
              </button>

              <div class="volume-control">
                <button
                  class="control-btn"
                  onClick$={toggleMute$}
                  aria-label={isMuted.value ? "Unmute" : "Mute"}
                >
                  {isMuted.value || volume.value === 0 ? (
                    <LuVolumeX />
                  ) : (
                    <LuVolume2 />
                  )}
                </button>
                <input
                  type="range"
                  class="volume-slider"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted.value ? 0 : volume.value}
                  onInput$={handleVolumeChange$}
                  aria-label="Volume"
                />
              </div>

              <span class="time-display">
                {formatTime(currentTime.value)} / {formatTime(duration.value)}
              </span>
            </div>

            <div class="controls-right">
              {/* Playback Speed */}
              <div class="speed-control">
                <button
                  class="control-btn"
                  onClick$={() => (showSpeedMenu.value = !showSpeedMenu.value)}
                  aria-label="Playback speed"
                >
                  <LuGauge />
                  <span class="speed-label">{playbackRate.value}x</span>
                </button>
                {showSpeedMenu.value && (
                  <div class="speed-menu">
                    {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((rate) => (
                      <button
                        key={rate}
                        class={`speed-option ${playbackRate.value === rate ? "active" : ""}`}
                        onClick$={() => setSpeed$(rate)}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                class="control-btn"
                onClick$={toggleFullscreen$}
                aria-label={
                  isFullscreen.value ? "Exit fullscreen" : "Fullscreen"
                }
              >
                {isFullscreen.value ? <LuMinimize /> : <LuMaximize />}
              </button>
            </div>
          </div>

          {/* Keyboard shortcuts hint */}
          <div class="keyboard-hint">
            <span>
              Keyboard: Space/K=Play • M=Mute • F=Fullscreen • ←/→=Seek •
              ↑/↓=Volume
            </span>
          </div>
        </div>
      </div>
    );
  },
);
